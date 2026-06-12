const db = require('../config/db')

exports.clockIn = async (req, res) => {

  try {

    const userId = req.user.id

    const [active] = await db.query(

      'SELECT * FROM shifts WHERE user_id = ? AND clock_out IS NULL LIMIT 1',

      [userId]

    )

    if (active.length) {

      return res.json({ success: true, data: { id: active[0].id, alreadyClockedIn: true }, message: 'Already clocked in' })

    }

    const [result] = await db.query('INSERT INTO shifts (user_id) VALUES (?)', [userId])

    res.status(201).json({ success: true, data: { id: result.insertId }, message: 'Clocked in successfully' })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.clockOut = async (req, res) => {

  try {

    const userId = req.user.id

    const body = req.body && typeof req.body === 'object' ? req.body : {}

    const { note } = body

    const [active] = await db.query(

      'SELECT * FROM shifts WHERE user_id = ? AND clock_out IS NULL LIMIT 1',

      [userId]

    )

    if (!active.length) {

      return res.status(400).json({ success: false, message: 'Not clocked in' })

    }

    await db.query(

      'UPDATE shifts SET clock_out = NOW(), note = ? WHERE id = ?',

      [note || null, active[0].id]

    )

    res.json({ success: true, message: 'Clocked out successfully' })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.getMyShifts = async (req, res) => {

  try {

    const userId = req.user.id

    const [shifts] = await db.query(

      'SELECT * FROM shifts WHERE user_id = ? ORDER BY clock_in DESC LIMIT 50',

      [userId]

    )

    const [active] = await db.query(

      'SELECT * FROM shifts WHERE user_id = ? AND clock_out IS NULL LIMIT 1',

      [userId]

    )

    res.json({ success: true, data: { shifts, isClockedIn: active.length > 0, activeShift: active[0] || null } })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.getShiftsHistory = async (req, res) => {

  try {

    const days = Math.min(Math.max(parseInt(req.query.days) || 14, 1), 60)

    const [rows] = await db.query(`

      SELECT

        DATE_FORMAT(shifts.clock_in, '%Y-%m-%d') as date,

        COUNT(*) as shift_count,

        COUNT(DISTINCT shifts.user_id) as staff_count,

        COALESCE(SUM(TIMESTAMPDIFF(MINUTE, shifts.clock_in, COALESCE(shifts.clock_out, NOW()))), 0) as total_minutes

      FROM shifts

      LEFT JOIN users ON shifts.user_id = users.id

      WHERE shifts.clock_in >= DATE_SUB(CURDATE(), INTERVAL ? DAY)

      AND users.role != 'customer'

      GROUP BY DATE_FORMAT(shifts.clock_in, '%Y-%m-%d')

      ORDER BY date DESC

    `, [days])

    res.json({

      success: true,

      data: rows.map(r => ({ ...r, total_minutes: Number(r.total_minutes) }))

    })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.getAllShifts = async (req, res) => {

  try {

    const { date, user_id } = req.query

    let query = `

      SELECT shifts.*, users.name as user_name, users.role

      FROM shifts

      LEFT JOIN users ON shifts.user_id = users.id

      WHERE users.role != 'customer'

    `

    const params = []

    if (date) {

      query += ' AND DATE(shifts.clock_in) = ?'

      params.push(date)

    }

    if (user_id) {

      query += ' AND shifts.user_id = ?'

      params.push(user_id)

    }

    query += ' ORDER BY shifts.clock_in DESC'

    const [shifts] = await db.query(query, params)

    res.json({ success: true, data: shifts })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}
