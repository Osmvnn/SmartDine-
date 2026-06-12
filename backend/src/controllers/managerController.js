const db = require('../config/db')

const PDFDocument = require('pdfkit')

const { LOW_STOCK_THRESHOLD } = require('../config/constants')

const PAID_ORDER_FILTER = `orders.status NOT IN ('cancelled') AND EXISTS (
  SELECT 1 FROM payments
  WHERE payments.order_id = orders.id
  AND payments.status = 'paid'
)`

exports.getDashboard = async (req, res) => {

  try {

    const [[{ todayOrders }]] = await db.query(

      'SELECT COUNT(*) as todayOrders FROM orders WHERE DATE(created_at) = CURDATE()'

    )

    const [[{ todayRevenue }]] = await db.query(

      `SELECT COALESCE(SUM(total), 0) as todayRevenue FROM orders WHERE DATE(created_at) = CURDATE() AND ${PAID_ORDER_FILTER}`

    )

    const [[{ activeTables }]] = await db.query(

      'SELECT COUNT(*) as activeTables FROM restaurant_tables WHERE status = "occupied"'

    )

    const [[{ totalTables }]] = await db.query(

      'SELECT COUNT(*) as totalTables FROM restaurant_tables'

    )

    const [[{ pendingOrders }]] = await db.query(

      'SELECT COUNT(*) as pendingOrders FROM orders WHERE status IN ("pending", "confirmed", "preparing")'

    )

    const [[{ completedToday }]] = await db.query(

      'SELECT COUNT(*) as completedToday FROM orders WHERE DATE(created_at) = CURDATE() AND status = "completed"'

    )

    const [[{ avgOrderValue }]] = await db.query(

      `SELECT COALESCE(AVG(total), 0) as avgOrderValue FROM orders WHERE ${PAID_ORDER_FILTER}`

    )

    const [lowStockItems] = await db.query(

      `SELECT id, name, stock_quantity FROM menu_items WHERE stock_quantity >= 0 AND stock_quantity <= ? ORDER BY stock_quantity ASC`,

      [LOW_STOCK_THRESHOLD]

    )

    res.json({

      success: true,

      data: {

        todayOrders,

        todayRevenue: Number(todayRevenue),

        activeTables,

        totalTables,

        pendingOrders,

        completedToday,

        avgOrderValue: Number(Number(avgOrderValue).toFixed(2)),

        lowStockItems

      }

    })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.getSales = async (req, res) => {

  try {

    const startDate = req.query.start_date || null

    const endDate = req.query.end_date || null

    let dateFilter = `created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`

    const dateParams = []

    if (startDate && endDate) {

      dateFilter = `DATE(created_at) BETWEEN ? AND ?`

      dateParams.push(startDate, endDate)

    } else if (startDate) {

      dateFilter = `DATE(created_at) >= ?`

      dateParams.push(startDate)

    } else if (endDate) {

      dateFilter = `DATE(created_at) <= ?`

      dateParams.push(endDate)

    }

    const [dailyRevenue] = await db.query(`

      SELECT 

        DATE(created_at) as date,

        COUNT(*) as orders,

        COALESCE(SUM(total), 0) as revenue

      FROM orders

      WHERE ${dateFilter}

        AND ${PAID_ORDER_FILTER}

      GROUP BY DATE(created_at)

      ORDER BY date ASC

    `, dateParams)

    const [topItems] = await db.query(`

      SELECT 

        menu_items.name,

        SUM(order_items.quantity) as total_sold,

        SUM(order_items.quantity * order_items.price) as total_revenue

      FROM order_items

      LEFT JOIN menu_items ON order_items.menu_item_id = menu_items.id

      LEFT JOIN orders ON order_items.order_id = orders.id

      WHERE ${PAID_ORDER_FILTER}

      GROUP BY menu_items.id, menu_items.name

      ORDER BY total_sold DESC

      LIMIT 10

    `)

    const [categoryRevenue] = await db.query(`

      SELECT

        menu_categories.name as category,

        COALESCE(SUM(CASE WHEN orders.id IS NOT NULL THEN order_items.quantity * order_items.price ELSE 0 END), 0) as revenue,

        COALESCE(SUM(CASE WHEN orders.id IS NOT NULL THEN order_items.quantity ELSE 0 END), 0) as items_sold

      FROM menu_categories

      LEFT JOIN menu_items ON menu_categories.id = menu_items.category_id

      LEFT JOIN order_items ON menu_items.id = order_items.menu_item_id

      LEFT JOIN orders ON order_items.order_id = orders.id AND ${PAID_ORDER_FILTER}

      GROUP BY menu_categories.id, menu_categories.name

      ORDER BY revenue DESC

    `)

    const [peakHoursRaw] = await db.query(`

      SELECT

        HOUR(created_at) as hour,

        COUNT(*) as orders,

        COALESCE(SUM(total), 0) as revenue

      FROM orders

      WHERE ${dateFilter}

        AND ${PAID_ORDER_FILTER}

      GROUP BY HOUR(created_at)

    `, dateParams)

    const peakHoursMap = new Map(peakHoursRaw.map(r => [r.hour, r]))

    const peakHours = Array.from({ length: 24 }, (_, hour) => ({

      hour,

      orders: peakHoursMap.get(hour)?.orders || 0,

      revenue: Number(peakHoursMap.get(hour)?.revenue || 0)

    }))

    const [dayOfWeekRaw] = await db.query(`

      SELECT

        DAYOFWEEK(created_at) as dow,

        COUNT(*) as orders,

        COALESCE(SUM(total), 0) as revenue

      FROM orders

      WHERE ${dateFilter}

        AND ${PAID_ORDER_FILTER}

      GROUP BY DAYOFWEEK(created_at)

    `, dateParams)

    const DOW_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    const dayOfWeekMap = new Map(dayOfWeekRaw.map(r => [r.dow, r]))

    const dayOfWeek = Array.from({ length: 7 }, (_, i) => ({

      day: DOW_NAMES[i],

      orders: dayOfWeekMap.get(i + 1)?.orders || 0,

      revenue: Number(dayOfWeekMap.get(i + 1)?.revenue || 0)

    }))

    res.json({

      success: true,

      data: { dailyRevenue, topItems, categoryRevenue, peakHours, dayOfWeek }

    })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.getTipReport = async (req, res) => {

  try {

    const startDate = req.query.start_date || null

    const endDate = req.query.end_date || null

    let dateFilter = `p.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`

    const dateParams = []

    if (startDate && endDate) {

      dateFilter = `DATE(p.created_at) BETWEEN ? AND ?`

      dateParams.push(startDate, endDate)

    } else if (startDate) {

      dateFilter = `DATE(p.created_at) >= ?`

      dateParams.push(startDate)

    } else if (endDate) {

      dateFilter = `DATE(p.created_at) <= ?`

      dateParams.push(endDate)

    }

    const [tips] = await db.query(`

      SELECT

        COALESCE(u.id, rt_waiter.id) as staff_id,

        COALESCE(u.name, rt_waiter.name, 'Unassigned') as staff_name,

        COALESCE(u.role, rt_waiter.role, '-') as staff_role,

        COUNT(*) as tip_count,

        COALESCE(SUM(p.tip_amount), 0) as total_tips

      FROM payments p

      JOIN orders o ON p.order_id = o.id

      LEFT JOIN restaurant_tables rt ON o.table_id = rt.id

      LEFT JOIN users rt_waiter ON rt.waiter_id = rt_waiter.id

      LEFT JOIN users u ON u.id = COALESCE(p.waiter_confirmed_by, p.confirmed_by)

      WHERE p.status = 'paid' AND p.tip_amount > 0 AND ${dateFilter}

      GROUP BY staff_id, staff_name, staff_role

      ORDER BY total_tips DESC

    `, dateParams)

    const [[{ totalTips }]] = await db.query(`

      SELECT COALESCE(SUM(p.tip_amount), 0) as totalTips

      FROM payments p

      WHERE p.status = 'paid' AND ${dateFilter}

    `, dateParams)

    res.json({

      success: true,

      data: {

        tips,

        totalTips: Number(totalTips)

      }

    })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.getStaffPerformance = async (req, res) => {
  try {
    const startDate = req.query.start_date || null
    const endDate = req.query.end_date || null

    const buildFilter = (column) => {
      if (startDate && endDate) return { sql: `DATE(${column}) BETWEEN ? AND ?`, params: [startDate, endDate] }
      if (startDate) return { sql: `DATE(${column}) >= ?`, params: [startDate] }
      if (endDate) return { sql: `DATE(${column}) <= ?`, params: [endDate] }
      return { sql: `${column} >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`, params: [] }
    }

    const orderFilter = buildFilter('o.created_at')
    const paymentFilter = buildFilter('p.created_at')
    const refundFilter = buildFilter('p.refunded_at')

    const [rows] = await db.query(`
      SELECT
        u.id as staff_id,
        u.name as staff_name,
        u.role as staff_role,
        COALESCE(order_stats.orders_handled, 0) as orders_handled,
        COALESCE(order_stats.revenue_generated, 0) as revenue_generated,
        COALESCE(payment_stats.payments_confirmed, 0) as payments_confirmed,
        COALESCE(refund_stats.refunds_issued, 0) as refunds_issued,
        COALESCE(tip_stats.total_tips, 0) as total_tips
      FROM users u
      LEFT JOIN (
        SELECT rt.waiter_id as staff_id, COUNT(*) as orders_handled, COALESCE(SUM(o.total), 0) as revenue_generated
        FROM orders o
        JOIN restaurant_tables rt ON o.table_id = rt.id
        WHERE rt.waiter_id IS NOT NULL AND ${orderFilter.sql} AND ${PAID_ORDER_FILTER.replace(/orders\./g, 'o.')}
        GROUP BY rt.waiter_id
      ) order_stats ON order_stats.staff_id = u.id
      LEFT JOIN (
        SELECT p.confirmed_by as staff_id, COUNT(*) as payments_confirmed
        FROM payments p
        WHERE p.confirmed_by IS NOT NULL AND p.status IN ('paid', 'refunded') AND ${paymentFilter.sql}
        GROUP BY p.confirmed_by
      ) payment_stats ON payment_stats.staff_id = u.id
      LEFT JOIN (
        SELECT p.refunded_by as staff_id, COUNT(*) as refunds_issued
        FROM payments p
        WHERE p.refunded_by IS NOT NULL AND p.status = 'refunded' AND ${refundFilter.sql}
        GROUP BY p.refunded_by
      ) refund_stats ON refund_stats.staff_id = u.id
      LEFT JOIN (
        SELECT COALESCE(p.waiter_confirmed_by, p.confirmed_by) as staff_id, COALESCE(SUM(p.tip_amount), 0) as total_tips
        FROM payments p
        WHERE p.status = 'paid' AND p.tip_amount > 0 AND ${paymentFilter.sql}
        GROUP BY staff_id
      ) tip_stats ON tip_stats.staff_id = u.id
      WHERE u.role IN ('waiter', 'cashier')
      ORDER BY revenue_generated DESC, total_tips DESC, staff_name ASC
    `, [...orderFilter.params, ...paymentFilter.params, ...refundFilter.params, ...paymentFilter.params])

    res.json({
      success: true,
      data: rows.map(r => ({
        ...r,
        revenue_generated: Number(r.revenue_generated),
        total_tips: Number(r.total_tips)
      }))
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.getTableStats = async (req, res) => {

  try {

    const date = req.query.date || null

    const dateCondition = date ? 'DATE(orders.created_at) = ?' : 'DATE(orders.created_at) = CURDATE()'

    const dateParams = date ? [date] : []

    const [tables] = await db.query(`

      SELECT

        restaurant_tables.*,

        COUNT(DISTINCT orders.id) as total_orders,

        COALESCE(SUM(orders.total), 0) as total_revenue

      FROM restaurant_tables

      LEFT JOIN orders ON restaurant_tables.id = orders.table_id AND ${PAID_ORDER_FILTER} AND ${dateCondition}

      GROUP BY restaurant_tables.id

      ORDER BY restaurant_tables.table_number ASC

    `, dateParams)

    const [[{ occupiedCount }]] = await db.query(

      'SELECT COUNT(*) as occupiedCount FROM restaurant_tables WHERE status = "occupied"'

    )

    const [[{ totalCount }]] = await db.query(

      'SELECT COUNT(*) as totalCount FROM restaurant_tables'

    )

    const [[{ today }]] = await db.query("SELECT DATE_FORMAT(CURDATE(), '%Y-%m-%d') as today")

    res.json({

      success: true,

      data: {

        tables,

        occupancyRate: totalCount > 0 ? Math.round((occupiedCount / totalCount) * 100) : 0,

        occupied: occupiedCount,

        total: totalCount,

        date: date || today

      }

    })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.getTableHistory = async (req, res) => {

  try {

    const days = Math.min(Math.max(parseInt(req.query.days) || 14, 1), 60)

    const [rows] = await db.query(`

      SELECT

        DATE_FORMAT(orders.created_at, '%Y-%m-%d') as date,

        COUNT(DISTINCT orders.id) as total_orders,

        COALESCE(SUM(orders.total), 0) as total_revenue

      FROM orders

      WHERE ${PAID_ORDER_FILTER} AND orders.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)

      GROUP BY DATE_FORMAT(orders.created_at, '%Y-%m-%d')

      ORDER BY date DESC

    `, [days])

    res.json({

      success: true,

      data: rows.map(r => ({ ...r, total_revenue: Number(r.total_revenue) }))

    })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.exportSalesCSV = async (req, res) => {

  try {

    const { from, to } = req.query

    let query = `

      SELECT orders.id, orders.status, orders.total, orders.discount_amount,

             orders.created_at, restaurant_tables.table_number

      FROM orders

      LEFT JOIN restaurant_tables ON orders.table_id = restaurant_tables.id

      WHERE ${PAID_ORDER_FILTER}

    `

    const params = []

    if (from) { query += ' AND DATE(orders.created_at) >= ?'; params.push(from) }

    if (to) { query += ' AND DATE(orders.created_at) <= ?'; params.push(to) }

    query += ' ORDER BY orders.created_at DESC'

    const [orders] = await db.query(query, params)

    let csv = 'Order ID,Table,Status,Total,Discount,Date\n'

    for (const o of orders) {

      csv += `${o.id},${o.table_number || 'N/A'},${o.status},${Number(o.total).toFixed(2)},${Number(o.discount_amount || 0).toFixed(2)},"${new Date(o.created_at).toLocaleString()}"\n`

    }

    res.setHeader('Content-Type', 'text/csv')

    res.setHeader('Content-Disposition', 'attachment; filename=sales-report.csv')

    res.send(csv)

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.exportSalesPDF = async (req, res) => {

  try {

    const { from, to } = req.query

    let query = `

      SELECT orders.id, orders.status, orders.total, orders.discount_amount,

             orders.created_at, restaurant_tables.table_number

      FROM orders

      LEFT JOIN restaurant_tables ON orders.table_id = restaurant_tables.id

      WHERE ${PAID_ORDER_FILTER}

    `

    const params = []

    if (from) { query += ' AND DATE(orders.created_at) >= ?'; params.push(from) }

    if (to) { query += ' AND DATE(orders.created_at) <= ?'; params.push(to) }

    query += ' ORDER BY orders.created_at DESC'

    const [orders] = await db.query(query, params)

    const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0)

    const doc = new PDFDocument({ margin: 40 })

    res.setHeader('Content-Type', 'application/pdf')

    res.setHeader('Content-Disposition', 'attachment; filename=sales-report.pdf')

    doc.pipe(res)

    doc.fontSize(20).font('Helvetica-Bold').text('Smart Dine - Sales Report', { align: 'center' })

    doc.moveDown(0.5)

    doc.fontSize(10).font('Helvetica').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' })

    if (from || to) {

      doc.text(`Period: ${from || 'Start'} to ${to || 'Now'}`, { align: 'center' })

    }

    doc.moveDown()

    doc.fontSize(12).font('Helvetica-Bold')

    doc.text(`Total Orders: ${orders.length}    |    Total Revenue: $${totalRevenue.toFixed(2)}`)

    doc.moveDown()

    doc.fontSize(9).font('Helvetica-Bold')

    const y = doc.y

    doc.text('ID', 40, y, { width: 40 })

    doc.text('Table', 80, y, { width: 50 })

    doc.text('Status', 130, y, { width: 70 })

    doc.text('Total', 200, y, { width: 60 })

    doc.text('Discount', 260, y, { width: 60 })

    doc.text('Date', 320, y, { width: 200 })

    doc.moveDown(0.5)

    doc.moveTo(40, doc.y).lineTo(550, doc.y).stroke()

    doc.moveDown(0.3)

    doc.font('Helvetica').fontSize(8)

    for (const o of orders.slice(0, 100)) {

      const row = doc.y

      if (row > 720) {

        doc.addPage()

      }

      doc.text(`${o.id}`, 40, doc.y, { width: 40 })

      doc.text(`${o.table_number || '-'}`, 80, doc.y - 10, { width: 50 })

      doc.text(`${o.status}`, 130, doc.y - 10, { width: 70 })

      doc.text(`$${Number(o.total).toFixed(2)}`, 200, doc.y - 10, { width: 60 })

      doc.text(`$${Number(o.discount_amount || 0).toFixed(2)}`, 260, doc.y - 10, { width: 60 })

      doc.text(`${new Date(o.created_at).toLocaleDateString()}`, 320, doc.y - 10, { width: 200 })

      doc.moveDown(0.2)

    }

    doc.end()

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}
