const db = require('../config/db')

const PDFDocument = require('pdfkit')

exports.generateReceipt = async (req, res) => {

  try {

    const { id } = req.params

    const [orders] = await db.query(

      `SELECT orders.*, restaurant_tables.table_number 

       FROM orders

       LEFT JOIN restaurant_tables ON orders.table_id = restaurant_tables.id

       WHERE orders.id = ?`,

      [id]

    )

    if (!orders.length) {

      return res.status(404).json({ success: false, message: 'Order not found' })

    }

    const order = orders[0]

    const [items] = await db.query(

      `SELECT order_items.*, menu_items.name 

       FROM order_items

       LEFT JOIN menu_items ON order_items.menu_item_id = menu_items.id

       WHERE order_items.order_id = ?`,

      [id]

    )

    const [payments] = await db.query(

      'SELECT * FROM payments WHERE order_id = ? LIMIT 1',

      [id]

    )

    const doc = new PDFDocument({ size: [280, 600], margin: 20 })

    res.setHeader('Content-Type', 'application/pdf')

    res.setHeader('Content-Disposition', `inline; filename=receipt-${id}.pdf`)

    doc.pipe(res)

    doc.fontSize(16).font('Helvetica-Bold').text('Smart Dine', { align: 'center' })

    doc.fontSize(8).font('Helvetica').text('Thank you for dining with us!', { align: 'center' })

    doc.moveDown(0.5)

    doc.moveTo(20, doc.y).lineTo(260, doc.y).stroke()

    doc.moveDown(0.3)

    doc.fontSize(9).font('Helvetica')

    doc.text(`Order #${order.id}`)

    doc.text(`Table: ${order.table_number || 'N/A'}`)

    doc.text(`Date: ${new Date(order.created_at).toLocaleString()}`)

    doc.text(`Status: ${order.status}`)

    doc.moveDown(0.5)

    doc.moveTo(20, doc.y).lineTo(260, doc.y).stroke()

    doc.moveDown(0.3)

    doc.font('Helvetica-Bold').fontSize(9)

    doc.text('Items', 20)

    doc.moveDown(0.2)

    for (const item of items) {

      doc.font('Helvetica').fontSize(8)

      const y = doc.y

      doc.text(`${item.name || 'Item'}`, 20, y, { width: 120 })

      doc.text(`x${item.quantity}`, 145, y, { width: 40 })

      doc.text(`$${(Number(item.price || 0) * item.quantity).toFixed(2)}`, 190, y, { width: 60, align: 'right' })

      if (item.notes) {

        doc.fontSize(7).fillColor('#666').text(`  Note: ${item.notes}`, 20)

        doc.fillColor('#000')

      }

    }

    doc.moveDown(0.5)

    doc.moveTo(20, doc.y).lineTo(260, doc.y).stroke()

    doc.moveDown(0.3)

    if (Number(order.discount_amount) > 0) {

      doc.font('Helvetica').fontSize(9)

      const subtotal = Number(order.total) + Number(order.discount_amount)

      doc.text(`Subtotal: $${subtotal.toFixed(2)}`, { align: 'right' })

      doc.text(`Discount: -$${Number(order.discount_amount).toFixed(2)}`, { align: 'right' })

    }

    doc.font('Helvetica-Bold').fontSize(11)

    doc.text(`Total: $${Number(order.total).toFixed(2)}`, { align: 'right' })

    doc.moveDown(0.5)

    if (payments.length) {

      doc.font('Helvetica').fontSize(8)

      doc.text(`Payment: ${payments[0].method} (${payments[0].status})`)

      if (payments[0].transaction_id) {

        doc.text(`Txn: ${payments[0].transaction_id}`)

      }

    }

    doc.moveDown(1)

    doc.fontSize(8).text('--- Thank You! ---', { align: 'center' })

    doc.end()

  } catch (error) {

    if (!res.headersSent) {
      res.status(500).json({ success: false, message: error.message })
    }

  }

}
