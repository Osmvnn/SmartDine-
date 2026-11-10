const db = require('../config/db')
const { timeDifferenceMinutes } = require('../config/reportSql')

exports.createReservation = async (req, res) => {

  try {

    const { table_id, customer_name, customer_phone, customer_email, reservation_date, reservation_time, guests, notes } = req.body

    if (!customer_name || !reservation_date || !reservation_time) {

      return res.status(400).json({ success: false, message: 'customer_name, reservation_date, and reservation_time are required' })

    }

    if (table_id) {

      const [conflicts] = await db.query(

        `SELECT id FROM reservations

         WHERE table_id = ? AND reservation_date = ? AND status IN ('pending', 'confirmed')

         AND ${timeDifferenceMinutes('reservation_time')} < 120`,

        [table_id, reservation_date, reservation_time]

      )

      if (conflicts.length) {

        return res.status(400).json({ success: false, message: 'Table is already reserved for this time slot' })

      }

    }

    const [result] = await db.query(

      `INSERT INTO reservations (user_id, table_id, customer_name, customer_phone, customer_email, reservation_date, reservation_time, guests, notes)

       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,

      [req.user?.id || null, table_id || null, customer_name, customer_phone || null, customer_email || null, reservation_date, reservation_time, guests || 2, notes || null]

    )

    require('../services/pushService').notifyRoles(['manager', 'admin'], {
      title: 'New Reservation',
      body: `${customer_name} · ${guests || 2} guests · ${reservation_date} at ${reservation_time}`,
      tag: `reservation-${result.insertId}`,
      url: '/manager/reservations'
    }).catch(() => {})

    res.status(201).json({ success: true, data: { id: result.insertId }, message: 'Reservation created' })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.getReservations = async (req, res) => {

  try {

    const { date, status } = req.query

    let query = `

      SELECT reservations.*, restaurant_tables.table_number

      FROM reservations

      LEFT JOIN restaurant_tables ON reservations.table_id = restaurant_tables.id

      WHERE 1=1

    `

    const params = []

    if (date) {

      query += ' AND reservations.reservation_date = ?'

      params.push(date)

    }

    if (status) {

      query += ' AND reservations.status = ?'

      params.push(status)

    }

    query += ' ORDER BY reservations.reservation_date ASC, reservations.reservation_time ASC'

    const [rows] = await db.query(query, params)

    res.json({ success: true, data: rows })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.getMyReservations = async (req, res) => {

  try {

    const [rows] = await db.query(

      `SELECT reservations.*, restaurant_tables.table_number

       FROM reservations

       LEFT JOIN restaurant_tables ON reservations.table_id = restaurant_tables.id

       WHERE reservations.user_id = ?

       ORDER BY reservations.reservation_date DESC, reservations.reservation_time DESC`,

      [req.user.id]

    )

    res.json({ success: true, data: rows })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.updateReservationStatus = async (req, res) => {

  try {

    const { id } = req.params

    const { status } = req.body

    const allowed = ['pending', 'confirmed', 'cancelled', 'completed', 'no_show']

    if (!allowed.includes(status)) {

      return res.status(400).json({ success: false, message: 'Invalid status' })

    }

    const [result] = await db.query('UPDATE reservations SET status = ? WHERE id = ?', [status, id])

    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Reservation not found' })

    const [rows] = await db.query(

      `SELECT reservations.*, restaurant_tables.table_number

       FROM reservations

       LEFT JOIN restaurant_tables ON reservations.table_id = restaurant_tables.id

       WHERE reservations.id = ?`,

      [id]

    )

    const reservation = rows[0]

    if (reservation?.user_id) {

      try {

        const { getIO } = require('../socket')

        const io = getIO()

        if (io) {

          io.to(`user-${reservation.user_id}`).emit('reservation-status-changed', {

            id: reservation.id,

            status,

            reservation_date: reservation.reservation_date,

            reservation_time: reservation.reservation_time,

            table_number: reservation.table_number

          })

        }

      } catch { }

      require('../services/pushService').notifyUser(reservation.user_id, {

        title: 'Reservation Update',

        body: `Your reservation for ${reservation.reservation_date} at ${reservation.reservation_time} is now ${status}.`,

        tag: `reservation-${reservation.id}`,

        url: '/customer/reservations'

      }).catch(() => {})

    }

    res.json({ success: true, message: 'Reservation status updated' })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.deleteReservation = async (req, res) => {

  try {

    const { id } = req.params

    const [result] = await db.query('DELETE FROM reservations WHERE id = ?', [id])

    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Reservation not found' })

    res.json({ success: true, message: 'Reservation deleted' })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.getAvailableTables = async (req, res) => {

  try {

    const { date, time, guests } = req.query

    if (!date || !time) {

      return res.status(400).json({ success: false, message: 'date and time are required' })

    }

    let query = `

      SELECT * FROM restaurant_tables

      WHERE id NOT IN (

        SELECT table_id FROM reservations

        WHERE table_id IS NOT NULL

        AND reservation_date = ?

        AND status IN ('pending', 'confirmed')

        AND ${timeDifferenceMinutes('reservation_time')} < 120

      )

    `

    const params = [date, time]

    if (guests) {

      query += ' AND capacity >= ?'

      params.push(guests)

    }

    query += ' ORDER BY table_number ASC'

    const [tables] = await db.query(query, params)

    res.json({ success: true, data: tables })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}