const db = require('../config/db')

exports.getTables = async (req, res) => {

  try {

    const [rows] = await db.query(

      'SELECT * FROM restaurant_tables ORDER BY table_number ASC'

    )

    res.json({

      success: true,

      data: rows

    })

  } catch (error) {

    res.status(500).json({

      success: false,

      message: 'Failed to fetch tables',

      error: error.message

    })

  }

}

exports.getTableByNumber = async (req, res) => {

  try {

    const { tableNumber } = req.params

    const [rows] = await db.query(

      'SELECT * FROM restaurant_tables WHERE table_number = ? LIMIT 1',

      [tableNumber]

    )

    if (!rows.length) {

      return res.status(404).json({

        success: false,

        message: 'Table not found'

      })

    }

    res.json({

      success: true,

      data: rows[0]

    })

  } catch (error) {

    res.status(500).json({

      success: false,

      message: 'Failed to fetch table',

      error: error.message

    })

  }

}

exports.getTableByQR = async (req, res) => {

  try {

    const { qrToken } = req.params

    const [rows] = await db.query(

      `SELECT t.*,
         ts.id AS active_session_id,

         COALESCE(COUNT(DISTINCT o.customer_id), 0) AS guest_count
       FROM restaurant_tables t
       LEFT JOIN table_sessions ts ON ts.table_id = t.id AND ts.status = 'active'
       LEFT JOIN orders o ON o.session_id = ts.id AND o.status NOT IN ('cancelled', 'completed')
       WHERE t.qr_token = ?
       GROUP BY t.id, ts.id`,

      [qrToken]

    )

    if (!rows.length) {

      return res.status(404).json({ success: false, message: 'Table not found' })

    }

    res.json({ success: true, data: rows[0] })

  } catch (error) {

    res.status(500).json({ success: false, message: 'Failed to fetch table', error: error.message })

  }

}


const { changeTableState } = require('../services/tableSession')

function announceAvailable({ table, requestId }, cleaning = false) {
  try {
    const io = require('../socket').getIO()
    if (!io) return
    if (requestId) io.to('waiter').to('admin').emit('new-waiter-request', {
      id: requestId, table_id: table.id, table_number: table.table_number,
      type: 'cleaning', notes: 'Guests finished - table needs cleaning', status: 'pending'
    })
    io.to('waiter').to('admin').to('manager').emit('table-available', {
      table_id: table.id, table_number: table.table_number, reason: cleaning ? 'cleaning' : 'released'
    })
  } catch { /* Database changes are already committed. */ }
}

const respondError = (res, error) => res.status(error.statusCode || 500).json({
  success: false, message: error.statusCode ? error.message : 'Failed to update table session'
})

exports.updateTableStatus = async (req, res) => {
  const { status } = req.body
  if (!['available', 'occupied', 'reserved'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid table status' })
  }
  try {
    const result = await changeTableState({ tableId: req.params.id, status })
    if (status === 'available') announceAvailable(result)
    res.json({ success: true, message: 'Table status updated to ' + status })
  } catch (error) { respondError(res, error) }
}

exports.closeSession = async (req, res) => {
  if (!req.body.table_id) return res.status(400).json({ success: false, message: 'table_id is required' })
  try {
    const result = await changeTableState({ tableId: req.body.table_id, requireSession: true })
    announceAvailable(result)
    res.json({ success: true, message: 'Session closed and table marked available' })
  } catch (error) { respondError(res, error) }
}

exports.customerDone = async (req, res) => {
  try {
    const result = await changeTableState({
      qrToken: req.params.qrToken, requireSession: true, cleaning: true,
      customerId: req.user.role === 'customer' ? req.user.id : null
    })
    announceAvailable(result, true)
    res.json({ success: true, message: 'Thank you! Staff will clean your table shortly.' })
  } catch (error) { respondError(res, error) }
}
