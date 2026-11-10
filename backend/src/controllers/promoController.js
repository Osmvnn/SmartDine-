const db = require('../config/db')

exports.getPromoCodes = async (req, res) => {

  try {

    const [rows] = await db.query('SELECT * FROM promo_codes ORDER BY created_at DESC')

    res.json({ success: true, data: rows })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.createPromoCode = async (req, res) => {

  try {

    const { code, description, discount_type, discount_value, min_order, max_uses, expires_at } = req.body

    if (!code || !discount_type || !discount_value) {

      return res.status(400).json({ success: false, message: 'code, discount_type, and discount_value are required' })

    }

    const [result] = await db.query(

      `INSERT INTO promo_codes (code, description, discount_type, discount_value, min_order, max_uses, expires_at)

       VALUES (?, ?, ?, ?, ?, ?, ?)`,

      [code.toUpperCase(), description || null, discount_type, discount_value, min_order || 0, max_uses || 0, expires_at || null]

    )

    res.status(201).json({ success: true, data: { id: result.insertId }, message: 'Promo code created' })

  } catch (error) {

    if (error.code === 'ER_DUP_ENTRY') {

      return res.status(400).json({ success: false, message: 'Promo code already exists' })

    }

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.updatePromoCode = async (req, res) => {

  try {

    const { id } = req.params

    const { code, description, discount_type, discount_value, min_order, max_uses, is_active, expires_at } = req.body

    if (!code || !discount_type || !discount_value) {

      return res.status(400).json({ success: false, message: 'code, discount_type, and discount_value are required' })

    }

    const [result] = await db.query(

      `UPDATE promo_codes SET code = ?, description = ?, discount_type = ?, discount_value = ?,

       min_order = ?, max_uses = ?, is_active = ?, expires_at = ? WHERE id = ?`,

      [code.toUpperCase(), description, discount_type, discount_value, min_order || 0, max_uses || 0, is_active !== undefined ? is_active : 1, expires_at || null, id]

    )

    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Promo code not found' })

    res.json({ success: true, message: 'Promo code updated' })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.deletePromoCode = async (req, res) => {

  try {

    const { id } = req.params

    const [result] = await db.query('DELETE FROM promo_codes WHERE id = ?', [id])

    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Promo code not found' })

    res.json({ success: true, message: 'Promo code deleted' })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.validatePromo = async (req, res) => {

  try {

    const { code, order_total } = req.body

    if (!code) {

      return res.status(400).json({ success: false, message: 'Promo code is required' })

    }

    const [rows] = await db.query(

      'SELECT * FROM promo_codes WHERE code = ? AND is_active = TRUE LIMIT 1',

      [code.toUpperCase()]

    )

    if (!rows.length) {

      return res.status(404).json({ success: false, message: 'Invalid promo code' })

    }

    const promo = rows[0]

    if (promo.expires_at && new Date(promo.expires_at) < new Date()) {

      return res.status(400).json({ success: false, message: 'Promo code has expired' })

    }

    if (promo.max_uses > 0 && promo.used_count >= promo.max_uses) {

      return res.status(400).json({ success: false, message: 'Promo code has reached maximum uses' })

    }

    if (order_total && Number(order_total) < Number(promo.min_order)) {

      return res.status(400).json({ success: false, message: `Minimum order of $${promo.min_order} required` })

    }

    let discount = 0

    if (promo.discount_type === 'percent') {

      discount = order_total ? (Number(order_total) * Number(promo.discount_value) / 100) : 0

    } else {

      discount = Number(promo.discount_value)

    }

    res.json({

      success: true,

      data: {

        id: promo.id,

        code: promo.code,

        discount_type: promo.discount_type,

        discount_value: Number(promo.discount_value),

        discount: Math.round(discount * 100) / 100,

        description: promo.description

      }

    })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}