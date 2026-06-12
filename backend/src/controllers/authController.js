const db = require('../config/db')

const bcrypt = require('bcryptjs')

const jwt = require('jsonwebtoken')

const { JWT_SECRET } = require('../middleware/auth')

const { logSecurityEvent } = require('../services/securityLog')

exports.register = async (req, res) => {

  try {

    const { name, email, password, role } = req.body

    if (!name || !email || !password) {

      return res.status(400).json({ success: false, message: 'Name, email, and password are required' })

    }

    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email])

    if (existing.length) {

      return res.status(400).json({ success: false, message: 'Email already registered' })

    }

    const hash = await bcrypt.hash(password, 10)

    const [result] = await db.query(

      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',

      [name, email, hash, role || 'customer']

    )

    const token = jwt.sign(

      { id: result.insertId, name, email, role: role || 'customer' },

      JWT_SECRET,

      { expiresIn: '30d' }

    )

    res.status(201).json({

      success: true,

      message: 'Registration successful',

      token,

      user: { id: result.insertId, name, email, role: role || 'customer' }

    })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.login = async (req, res) => {

  try {

    const { email, password } = req.body

    if (!email || !password) {

      return res.status(400).json({ success: false, message: 'Email and password are required' })

    }

    const [users] = await db.query('SELECT * FROM users WHERE email = ? AND is_active = 1', [email])

    if (!users.length) {

      logSecurityEvent('failed_login', req, { email, details: { reason: 'unknown_email' } })

      return res.status(401).json({ success: false, message: 'Invalid email or password' })

    }

    const user = users[0]

    const validPassword = await bcrypt.compare(password, user.password)

    if (!validPassword) {

      logSecurityEvent('failed_login', req, { email, userId: user.id, details: { reason: 'bad_password' } })

      return res.status(401).json({ success: false, message: 'Invalid email or password' })

    }

    const token = jwt.sign(

      { id: user.id, name: user.name, email: user.email, role: user.role },

      JWT_SECRET,

      { expiresIn: '30d' }

    )

    res.json({

      success: true,

      message: 'Login successful',

      token,

      user: { id: user.id, name: user.name, email: user.email, role: user.role }

    })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.getMe = async (req, res) => {

  try {

    const [users] = await db.query(

      'SELECT id, name, email, role, created_at FROM users WHERE id = ?',

      [req.user.id]

    )

    if (!users.length) {

      return res.status(404).json({ success: false, message: 'User not found' })

    }

    res.json({ success: true, data: users[0] })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}
