const Product = require("../../model/userModel/productSchema")
const Cart = require("../../model/userModel/cartSchema")
const Order = require("../../model/userModel/orderSchema")
const User = require("../../model/userModel/userSchema")
const fs = require("fs")
const path = require("path")
const sharp = require("sharp")
const PDFDocument = require('pdfkit');
const moment = require("moment")
const {statusCodes} = require("../../config/key")




const getSalesReport = async (filter, start, end) => {
    let startDate, endDate;
    // console.log("ethi ethi ethi22")

    if (filter === 'custom' && start && end) {
        startDate = new Date(start);
        endDate = new Date(end);
    } else {
        switch (filter) {
            case 'daily':
                startDate = moment().startOf('day').toDate();
                endDate = moment().endOf('day').toDate();
                break;
            case 'weekly':
                startDate = moment().startOf('week').toDate();
                endDate = moment().endOf('week').toDate();
                break;
            case 'monthly':
                startDate = moment().startOf('month').toDate();
                endDate = moment().endOf('month').toDate();
                break;
            case 'yearly':
                startDate = moment().startOf('year').toDate();
                endDate = moment().endOf('year').toDate();
                break;
            default:
                startDate = moment().startOf('year').toDate();
                endDate = moment().endOf('year').toDate();
                break;
        }
    }

    try {
        const order = await Order.aggregate([
            {
                $match: {
                    createdOn: {
                        $gte: startDate,
                        $lte: endDate
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalAmount: { $sum: '$totalPrice' },
                    totalCouponDiscount: { $sum: '$discount' },
                    totalCancelledOrders: {
                        $sum: { $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0] },
                      },
                      totalReturnedOrders: {
                        $sum: { $cond: [{ $eq: ["$status", "Returned"] }, 1, 0] },
                      },
                      totalShippedOrders: {
                        $sum: { $cond: [{ $eq: ["$status", "Shipped"] }, 1, 0] },
                      },
                      totalDeliveredOrders: {
                        $sum: { $cond: [{ $eq: ["$status", "Delivered"] }, 1, 0] },
                      },
                      totalProcessingOrders: {
                        $sum: { $cond: [{ $eq: ["$status", "Processing"] }, 1, 0] },
                      },
                      totalPendingOrders: {
                        $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] },
                      },
                    totalProductOffers: { $sum: '$productOffer' },
                    totalCategoryOffer: { $sum: '$categoryOffer' }
                }
            }
        ]);

        return order[0] || null; // Return the first result or null if no data
    } catch (error) {
        console.error('Error fetching sales report:', error);
        return null;
    }
};



const loadSales = async (req,res)=>{
    try {
        const filter=req.query.filter||'yearly'
        const start = req.query.start || null;
        const end = req.query.end || null;

        // console.log("ethi ethi ethi 1")


        const report=await getSalesReport(filter,start,end)

        if(!report){
           return res.render('admin/salesReport', {
            start: start || '',
            end: end || '',
                report: null,
                filter: filter,
                message:'no result found for the search'
            });
        }

            res.render('admin/salesReport',{
                start: start || '',
                end: end || '',
                report:report,
                filter:filter,
                
            })
        
        // res.render('admin/salesreport')
    } catch (error) {
        console.error(error)
        res.render('admin/salesReport',{
            start: start || '',
            end: end || '',
            report:null,
            filter:filter,
            message:'error occured ',
            
        })
    }
}


const downloadSalesReportPdf = async (req, res) => {
    try {
        const filter = req.query.filter || 'daily';
        const start = req.query.start || null;
        const end = req.query.end || null;

        // Assuming getSalesReport is a function that returns the report data
        const report = await getSalesReport(filter, start, end);

        if (!report) {
            return res.status(statusCodes.BAD_REQUEST).send('No report data available');
        }

        // Create a new PDF document
        const doc = new PDFDocument();

        // Set headers for file download
        res.setHeader('Content-Disposition', 'attachment; filename="sales-report.pdf"');
        res.setHeader('Content-Type', 'application/pdf');

        // Pipe the PDF document to the response
        doc.pipe(res);

        // Add content to the PDF
        doc.fontSize(20).text('Sales Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Total Orders: ${report.totalOrders}`);
        doc.text(`Total Amount: Rs${report.totalAmount}`);
        doc.text(`Total Coupon Discount: Rs${report.totalCoupondiscount}`);
        doc.text(`Total Delivered Orders: ${report.totalDeliveredOrders}`);
        doc.text(`Total Returned Orders: ${report.totalReturnedOrders}`);
        doc.text(`Total Shipped Orders: ${report.totalShippedOrders}`);
        doc.text(`Total Product Offers: Rs${report.totalProductOffers}`);

        // Finalize the PDF and end the stream
        doc.end();
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(statusCodes.INTERNAL_SERVER_ERROR).send('Error generating PDF');
    }
};




module.exports = {loadSales, downloadSalesReportPdf}