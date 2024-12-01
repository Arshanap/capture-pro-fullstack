const path = require("path");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const Order = require("../../model/userModel/orderSchema");

const getInvoice = async (req, res) => {
  try {
    const { orderId } = req.query;

    // Find the order by the custom orderId field
    const order = await Order.findOne({ orderId }).populate("orderedItems.product");
    if (!order) {
      return res.status(400).json({ success: false, error: "Order not found" });
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
        res.status(500).send("Could not download the file");
      }
    });
  } catch (error) {
    console.error("Error generating invoice:", error);
    res.status(500).send("Internal server error");
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

      // Items Table
      doc.text("Order Items:", { underline: true }).moveDown(0.5);
      let totalAmount = 0;

      order.orderedItems.forEach((item, index) => {
        const subtotal = item.quantity * item.price;
        totalAmount += subtotal;
        doc.text(`${index + 1}. ${item.name} - ${item.quantity} x ₹${item.price} = ₹${subtotal.toFixed(2)}`);
      });

      doc.moveDown(1);
      doc.fontSize(14).fillColor("#0073e6").text(`Total: ₹${totalAmount.toFixed(2)}`, { align: "right" });

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
