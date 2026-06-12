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
         ts.session_token AS active_session_token,
         COALESCE(COUNT(DISTINCT o.customer_id), 0) AS guest_count
       FROM restaurant_tables t
       LEFT JOIN table_sessions ts ON ts.table_id = t.id AND ts.status = 'active'
       LEFT JOIN orders o ON o.session_id = ts.id AND o.status NOT IN ('cancelled', 'completed')
       WHERE t.qr_token = ?
       GROUP BY t.id, ts.id, ts.session_token`,

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

exports.updateTableStatus = async (req, res) => {

  try {

    const { id } = req.params

    const { status } = req.body

    const allowed = ['available', 'occupied', 'reserved']

    if (!allowed.includes(status)) {

      return res.status(400).json({ success: false, message: 'Invalid status. Must be available, occupied, or reserved.' })

    }

    if (status === 'available') {

      const [sessions] = await db.query(

        'SELECT * FROM table_sessions WHERE table_id = ? AND status = "active" LIMIT 1',

        [id]

      )

      if (sessions.length) {

        const [openOrders] = await db.query(

          `SELECT COUNT(*) AS count
           FROM orders
           WHERE session_id = ?
           AND status NOT IN ("completed", "cancelled")`,

          [sessions[0].id]

        )

        if (openOrders[0].count > 0) {

          return res.status(400).json({
            success: false,
            message: 'Cannot make table available while orders are still active'
          })

        }

        await db.query(

          'UPDATE table_sessions SET status = "closed", ended_at = NOW() WHERE id = ?',

          [sessions[0].id]

        )

      }

    }

    const [result] = await db.query(

      'UPDATE restaurant_tables SET status = ? WHERE id = ?',

      [status, id]

    )

    if (!result.affectedRows) {

      return res.status(404).json({ success: false, message: 'Table not found' })

    }

    if (status === 'available') {

      try {
        const { getIO } = require('../socket')
        const io = getIO()
        if (io) {
          const [[table]] = await db.query('SELECT table_number FROM restaurant_tables WHERE id = ?', [id])
          io.to('waiter').to('admin').to('manager').emit('table-available', { table_id: Number(id), table_number: table?.table_number, reason: 'released' })
        }
      } catch { }

    }

    res.json({ success: true, message: `Table status updated to ${status}` })

  } catch (error) {

    res.status(500).json({ success: false, message: 'Failed to update table status', error: error.message })

  }

}

exports.closeSession = async (req, res) => {

  try {

    const { table_id } = req.body

    if (!table_id) {

      return res.status(400).json({ success: false, message: 'table_id is required' })

    }

    const [sessions] = await db.query(

      'SELECT * FROM table_sessions WHERE table_id = ? AND status = "active" LIMIT 1',

      [table_id]

    )

    if (!sessions.length) {

      return res.status(404).json({ success: false, message: 'No active session for this table' })

    }

    const [openOrders] = await db.query(
      `SELECT COUNT(*) AS count
       FROM orders
       WHERE session_id = ?
       AND status NOT IN ("completed", "cancelled")`,
      [sessions[0].id]
    )

    if (openOrders[0].count > 0) {

      return res.status(400).json({
        success: false,
        message: 'Cannot close session while orders are still active'
      })

    }

    await db.query(

      'UPDATE table_sessions SET status = "closed", ended_at = NOW() WHERE id = ?',

      [sessions[0].id]

    )

    await db.query(

      'UPDATE restaurant_tables SET status = "available" WHERE id = ?',

      [table_id]

    )

    try {
      const { getIO } = require('../socket')
      const io = getIO()
      if (io) {
        const [[table]] = await db.query('SELECT table_number FROM restaurant_tables WHERE id = ?', [table_id])
        io.to('waiter').to('admin').to('manager').emit('table-available', { table_id: Number(table_id), table_number: table?.table_number, reason: 'released' })
      }
    } catch { }

    res.json({ success: true, message: 'Session closed and table marked available' })

  } catch (error) {

    res.status(500).json({ success: false, message: 'Failed to close session', error: error.message })

  }

}

exports.customerDone = async (req, res) => {

  try {

    const { qrToken } = req.params

    const [tables] = await db.query(

      'SELECT * FROM restaurant_tables WHERE qr_token = ? LIMIT 1',

      [qrToken]

    )

    if (!tables.length) {

      return res.status(404).json({ success: false, message: 'Table not found' })

    }

    const table = tables[0]

    const [sessions] = await db.query(

      'SELECT * FROM table_sessions WHERE table_id = ? AND status = "active" LIMIT 1',

      [table.id]

    )

    if (sessions.length) {

      const [openOrders] = await db.query(
        `SELECT COUNT(*) AS count
         FROM orders
         WHERE session_id = ?
         AND status NOT IN ("completed", "cancelled")`,
        [sessions[0].id]
      )

      if (openOrders[0].count > 0) {

        return res.status(400).json({
          success: false,
          message: 'Please finish or cancel all active orders before leaving the table.'
        })

      }

      await db.query(

        'UPDATE table_sessions SET status = "closed", ended_at = NOW() WHERE id = ?',

        [sessions[0].id]

      )

    }

    await db.query(

      'UPDATE restaurant_tables SET status = "available" WHERE id = ?',

      [table.id]

    )

    const [reqResult] = await db.query(

      'INSERT INTO waiter_requests (table_id, type, notes) VALUES (?, "cleaning", "Guests finished - table needs cleaning")',

      [table.id]

    )

    const { getIO } = require('../socket')

    const io = getIO()

    if (io) {

      const newReq = {

        id: reqResult.insertId,

        table_id: table.id,

        table_number: table.table_number,

        type: 'cleaning',

        notes: 'Guests finished - table needs cleaning',

        status: 'pending'

      }

      io.to('waiter').to('admin').emit('new-waiter-request', newReq)

      io.to('waiter').to('admin').to('manager').emit('table-available', { table_id: table.id, table_number: table.table_number, reason: 'cleaning' })

    }

    res.json({ success: true, message: 'Thank you! Staff will clean your table shortly.' })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}
