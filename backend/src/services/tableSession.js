const db = require('../config/db')

const fail = (statusCode, message) => { throw Object.assign(new Error(message), { statusCode }) }

// Ordering and every session-close path serialize on the parent table row.
async function changeTableState({ tableId, qrToken, status = 'available', requireSession = false, customerId, cleaning = false }) {
  const connection = await db.getConnection()
  try {
    await connection.beginTransaction()
    const [[table]] = await connection.query(
      `SELECT * FROM restaurant_tables WHERE ${qrToken ? 'qr_token' : 'id'} = ? FOR UPDATE`,
      [qrToken || tableId]
    )
    if (!table) fail(404, 'Table not found')
    let requestId
    if (status === 'available') {
      const [[session]] = await connection.query(
        "SELECT * FROM table_sessions WHERE table_id = ? AND status = 'active' LIMIT 1 FOR UPDATE", [table.id]
      )
      if (!session && (requireSession || customerId)) fail(404, 'No active session for this table')
      if (session) {
        // Recheck membership inside the lock: middleware may have seen an old session.
        if (customerId) {
          const [[membership]] = await connection.query('SELECT id FROM orders WHERE session_id = ? AND customer_id = ? LIMIT 1', [session.id, customerId])
          if (!membership) fail(403, 'You do not belong to this table session')
        }
        const [[open]] = await connection.query(
          "SELECT COUNT(*) AS count FROM orders WHERE session_id = ? AND status NOT IN ('completed', 'cancelled')", [session.id]
        )
        if (Number(open.count)) fail(400, 'Cannot close session while orders are still active')
        await connection.query("UPDATE table_sessions SET status = 'closed', ended_at = NOW() WHERE id = ?", [session.id])
      }
      if (cleaning) {
        const [request] = await connection.query(
          'INSERT INTO waiter_requests (table_id, type, notes) VALUES (?, ?, ?)',
          [table.id, 'cleaning', 'Guests finished - table needs cleaning']
        )
        requestId = request.insertId
      }
    }
    await connection.query('UPDATE restaurant_tables SET status = ? WHERE id = ?', [status, table.id])
    await connection.commit()
    return { table, requestId }
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

module.exports = { changeTableState }
