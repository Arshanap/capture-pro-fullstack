const path = require("path");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const Order = require("../../model/userModel/orderSchema");
const {statusCodes} = require("../../config/key")


const getInvoice = async (req, res) => {
  try {
    const { orderId } = req.query;

    // Find the order by the custom orderId field
    const order = await Order.findOne({ orderId }).populate("orderedItems.product");
    if (!order) {
      return res.status(statusCodes.BAD_REQUEST).json({ success: false, error: "Order not found" });
    }

    // Create invoices directory if it doesn't exist
    const invoiceDir = path.join(__dirname, "../../invoices");
    if (!fs.existsSync(invoiceDir)) {
      fs.mkdirSync(invoiceDir);
    }

    // Generate the path for the invoice PDF
    const invoicePath = path.join(invoiceDir, `${orderId}.pdf`);

    // Generate and save the PDF invoice
    await generateInvoice(order, invoicePath);

    // Send the PDF file to the client
    res.download(invoicePath, `Invoice_${orderId}.pdf`, (err) => {
      if (err) {
        console.error("Error sending the file:", err);
        res.status(statusCodes.INTERNAL_SERVER_ERROR).send("Could not download the file");
      }
    });
  } catch (error) {
    console.error("Error generating invoice:", error);
    res.status(statusCodes.INTERNAL_SERVER_ERROR).send("Internal server error");
  }
};

function generateInvoice(order, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const writeStream = fs.createWriteStream(outputPath);
    
      doc.pipe(writeStream);
    
      // Header Section
      doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke();
      doc.fontSize(20).fillColor("#0073e6").text("Capture Pro", { align: "center" }).moveDown(0.5);
      doc.fontSize(12).fillColor("black").text("Address: New York City, Business St, 10010", { align: "center" });
      doc.text("Phone: +1-234-567-890 | Email: capturepro77@gmail.com", { align: "center" });
    
      doc.moveDown(1).fontSize(18).fillColor("#333333").text("Invoice", { align: "center", underline: true }).moveDown(1);
    
      // Order Details
      doc.fontSize(12).fillColor("black").text("Order Details:").moveDown(0.5);
      doc.text(`Order ID: ${order.orderId}`, { indent: 20 });
      doc.text(`Order Date: ${new Date(order.invoiceDate).toLocaleDateString()}`, { indent: 20 });
      doc.text(`Payment Method: ${order.paymentMethod}`, { indent: 20 });
      doc.text(`Order Status: ${order.status}`, { indent: 20 }).moveDown(1);
    
      // Items Table Header
      doc.fontSize(12).fillColor("black").text("Order Items:", { underline: true }).moveDown(0.5);
      doc.fontSize(10).fillColor("#000000");
      const tableTop = doc.y;
      const tableStartX = 50;
      const columnWidths = [30, 200, 50, 50, 80, 80]; // Adjust widths as needed
    
      // Table Header
      doc.text("No.", tableStartX, tableTop, { width: columnWidths[0], align: "center" });
      doc.text("Product", tableStartX + columnWidths[0], tableTop, { width: columnWidths[1], align: "left" });
      doc.text("Qty", tableStartX + columnWidths[0] + columnWidths[1], tableTop, { width: columnWidths[2], align: "center" });
      doc.text("Price", tableStartX + columnWidths[0] + columnWidths[1] + columnWidths[2], tableTop, { width: columnWidths[3], align: "center" });
      doc.text("Total", tableStartX + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3] + columnWidths[4], tableTop, { width: columnWidths[5], align: "center" });
    
      doc.moveDown(0.5).lineWidth(0.5).moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
    
      // Table Body
      let subtotal = 0;
      let totalDiscount = 0;
      let currentY = doc.y;
      const discount = order.discount || 0;
      totalDiscount += discount;

      order.orderedItems.forEach((item, index) => {
        const itemTotal = item.quantity * (item.price - discount);
        subtotal += item.quantity * item.price;
    
        doc.text(index + 1, tableStartX, currentY, { width: columnWidths[0], align: "center" });
        doc.text(item.name, tableStartX + columnWidths[0], currentY, { width: columnWidths[1], align: "left" });
        doc.text(item.quantity, tableStartX + columnWidths[0] + columnWidths[1], currentY, { width: columnWidths[2], align: "center" });
        doc.text(`₹${item.price.toFixed(2)}`, tableStartX + columnWidths[0] + columnWidths[1] + columnWidths[2], currentY, { width: columnWidths[3], align: "center" });
        doc.text(`₹${itemTotal.toFixed(2)}`, tableStartX + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3] + columnWidths[4], currentY, { width: columnWidths[5], align: "center" });
    
        currentY += 20;
      });
    
      doc.moveDown(1);
      doc.lineWidth(0.5).moveTo(50, currentY).lineTo(doc.page.width - 50, currentY).stroke();
    
      // Subtotal, Discount, and Total
      const totalAmount = subtotal - totalDiscount;
      const rightMargin = 50;
    
      currentY += 10; // Add some spacing
    
      doc.text(`Subtotal: ₹${subtotal.toFixed(2)}`, doc.page.width - rightMargin - 100, currentY, { align: "right", width: 100 });
      currentY += 20;
      doc.text(`Discount: ₹${discount.toFixed(2)}`, doc.page.width - rightMargin - 100, currentY, { align: "right", width: 100 });
      currentY += 20;
      doc.text(`Total: ₹${totalAmount.toFixed(2)}`, doc.page.width - rightMargin - 100, currentY, { align: "right", width: 100 });
    
      // Finalize PDF
      doc.end();
      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { getInvoice };
