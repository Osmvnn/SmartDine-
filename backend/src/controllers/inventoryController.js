const db = require('../config/db')

exports.getItems = async (req, res) => {

  try {

    const { category, search } = req.query

    let query = 'SELECT * FROM inventory_items'

    const params = []

    const conditions = []

    if (category) {

      conditions.push('category = ?')

      params.push(category)

    }

    if (search) {

      conditions.push('(name LIKE ? OR supplier LIKE ?)')

      params.push(`%${search}%`, `%${search}%`)

    }

    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ')

    query += ' ORDER BY category ASC, name ASC'

    const [rows] = await db.query(query, params)

    const data = rows.map(item => ({

      ...item,

      status: getStatus(item)

    }))

    const outOfStock = data.filter(i => i.status === 'out_of_stock').length

    const lowStock = data.filter(i => i.status === 'low_stock').length

    res.json({ success: true, data, summary: { total: data.length, outOfStock, lowStock } })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.getCategories = async (req, res) => {

  try {

    const [rows] = await db.query('SELECT DISTINCT category FROM inventory_items ORDER BY category ASC')

    res.json({ success: true, data: rows.map(r => r.category) })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.getItem = async (req, res) => {

  try {

    const [rows] = await db.query('SELECT * FROM inventory_items WHERE id = ?', [req.params.id])

    if (!rows.length) return res.status(404).json({ success: false, message: 'Item not found' })

    res.json({ success: true, data: { ...rows[0], status: getStatus(rows[0]) } })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.createItem = async (req, res) => {

  try {

    const { name, category, unit, quantity, min_quantity, cost_per_unit, supplier, notes } = req.body

    if (!name) return res.status(400).json({ success: false, message: 'Name is required' })

    const [result] = await db.query(

      `INSERT INTO inventory_items (name, category, unit, quantity, min_quantity, cost_per_unit, supplier, notes, last_restocked)

       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,

      [

        name,

        category || 'General',

        unit || 'pcs',

        quantity !== undefined ? quantity : 0,

        min_quantity !== undefined ? min_quantity : 5,

        cost_per_unit !== undefined ? cost_per_unit : 0,

        supplier || null,

        notes || null

      ]

    )

    res.status(201).json({ success: true, data: { id: result.insertId }, message: 'Inventory item created' })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.updateItem = async (req, res) => {

  try {

    const { name, category, unit, quantity, min_quantity, cost_per_unit, supplier, notes } = req.body

    const { id } = req.params

    const [result] = await db.query(

      `UPDATE inventory_items

       SET name = ?, category = ?, unit = ?, quantity = ?, min_quantity = ?, cost_per_unit = ?, supplier = ?, notes = ?

       WHERE id = ?`,

      [name, category, unit, quantity, min_quantity, cost_per_unit, supplier || null, notes || null, id]

    )

    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Item not found' })

    res.json({ success: true, message: 'Item updated' })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.restockItem = async (req, res) => {

  try {

    const { amount } = req.body

    const qty = parseFloat(amount)

    if (!qty || qty <= 0) return res.status(400).json({ success: false, message: 'Amount must be a positive number' })

    const [result] = await db.query(

      `UPDATE inventory_items SET quantity = quantity + ?, last_restocked = NOW() WHERE id = ?`,

      [qty, req.params.id]

    )

    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Item not found' })

    const [[updated]] = await db.query('SELECT * FROM inventory_items WHERE id = ?', [req.params.id])

    res.json({ success: true, data: { ...updated, status: getStatus(updated) }, message: `Restocked +${qty} ${updated.unit}` })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

exports.deleteItem = async (req, res) => {

  try {

    const [result] = await db.query('DELETE FROM inventory_items WHERE id = ?', [req.params.id])

    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Item not found' })

    res.json({ success: true, message: 'Item deleted' })

  } catch (error) {

    res.status(500).json({ success: false, message: error.message })

  }

}

function getStatus(item) {

  if (parseFloat(item.quantity) === 0) return 'out_of_stock'

  if (parseFloat(item.quantity) <= parseFloat(item.min_quantity)) return 'low_stock'

  return 'in_stock'

}