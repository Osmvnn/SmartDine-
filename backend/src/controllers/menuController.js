const db = require('../config/db')

exports.getCategories = async (req, res) => {

  try {

    const [rows] = await db.query(

      'SELECT * FROM menu_categories ORDER BY id ASC'

    )

    res.json({

      success: true,

      data: rows

    })

  } catch (error) {

    res.status(500).json({

      success: false,

      error: error.message

    })

  }

}

exports.getItems = async (req, res) => {

  try {

    const [rows] = await db.query(`

      SELECT

        menu_items.*,

        menu_categories.name AS category_name

      FROM menu_items

      LEFT JOIN menu_categories

        ON menu_items.category_id = menu_categories.id

      ORDER BY menu_items.id ASC

    `)

    const [modifiers] = await db.query('SELECT * FROM menu_item_modifiers ORDER BY id ASC')

    for (const item of rows) {
      item.modifiers = modifiers.filter(m => m.menu_item_id === item.id)
    }

    res.json({

      success: true,

      data: rows

    })

  } catch (error) {

    res.status(500).json({

      success: false,

      error: error.message

    })

  }

}

exports.getGroupedMenu = async (req, res) => {

  try {

    const [categories] = await db.query(

      'SELECT * FROM menu_categories ORDER BY id ASC'

    )

    const [items] = await db.query(

      'SELECT * FROM menu_items WHERE is_available = 1'

    )

    const [modifiers] = await db.query('SELECT * FROM menu_item_modifiers ORDER BY id ASC')

    for (const item of items) {
      item.modifiers = modifiers.filter(m => m.menu_item_id === item.id)
    }

    const result = categories.map(cat => ({

      id: cat.id,

      name: cat.name,

      items: items.filter(i => i.category_id === cat.id)

    }))

    res.json({

      success: true,

      data: result

    })

  } catch (error) {

    res.status(500).json({

      success: false,

      error: error.message

    })

  }

}

exports.getFavorites = async (req, res) => {

  try {

    const { session_id } = req.query

    if (!session_id) {

      return res.json({ success: true, data: [] })

    }

    const [rows] = await db.query(

      `SELECT favorites.*, menu_items.name, menu_items.price, menu_items.image_url

       FROM favorites

       LEFT JOIN menu_items ON favorites.menu_item_id = menu_items.id

       WHERE favorites.session_id = ?`,

      [session_id]

    )

    res.json({ success: true, data: rows })

  } catch (error) {

    res.status(500).json({ success: false, error: error.message })

  }

}

exports.toggleFavorite = async (req, res) => {

  try {

    const { session_id, menu_item_id } = req.body

    if (!menu_item_id) {

      return res.status(400).json({ success: false, message: 'menu_item_id is required' })

    }

    const sid = session_id || 0

    const [existing] = await db.query(

      'SELECT * FROM favorites WHERE session_id = ? AND menu_item_id = ?',

      [sid, menu_item_id]

    )

    if (existing.length) {

      await db.query('DELETE FROM favorites WHERE id = ?', [existing[0].id])

      return res.json({ success: true, message: 'Removed from favorites', favorited: false })

    } else {

      await db.query(

        'INSERT INTO favorites (session_id, menu_item_id) VALUES (?, ?)',

        [sid, menu_item_id]

      )

      return res.json({ success: true, message: 'Added to favorites', favorited: true })

    }

  } catch (error) {

    res.status(500).json({ success: false, error: error.message })

  }

}