const db = require('../config/db')

const POINTS_PER_DOLLAR = 10

const balanceCondition = (user_id, session_id) => {
  if (user_id) return { where: 'WHERE user_id = ?', params: [user_id] }
  if (session_id) return { where: 'WHERE session_id = ?', params: [session_id] }
  return null
}

const fetchBalance = async (queryable, user_id, session_id) => {
  const cond = balanceCondition(user_id, session_id)
  if (!cond) return 0

  const [[{ earned }]] = await queryable.query(
    `SELECT COALESCE(SUM(points), 0) as earned FROM loyalty_points ${cond.where} AND type = 'earned'`,
    cond.params
  )

  const [[{ redeemed }]] = await queryable.query(
    `SELECT COALESCE(SUM(points), 0) as redeemed FROM loyalty_points ${cond.where} AND type = 'redeemed'`,
    cond.params
  )

  return earned - redeemed
}

exports.POINTS_PER_DOLLAR = POINTS_PER_DOLLAR
exports.fetchBalance = fetchBalance

exports.getRewards = async (req, res) => {
  try {
    const { user_id, session_id } = req.query
    const cond = balanceCondition(user_id, session_id)
    const balance = cond ? await fetchBalance(db, user_id, session_id) : 0

    const [rewards] = await db.query(`
      SELECT loyalty_rewards.id, loyalty_rewards.name, loyalty_rewards.description, loyalty_rewards.points_cost,
             menu_items.id as menu_item_id, menu_items.name as item_name, menu_items.price as item_price, menu_items.image_url
      FROM loyalty_rewards
      LEFT JOIN menu_items ON loyalty_rewards.menu_item_id = menu_items.id
      WHERE loyalty_rewards.is_active = 1
      ORDER BY loyalty_rewards.points_cost ASC
    `)

    res.json({ success: true, data: { balance, rewards } })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
exports.validateRewardRedemption = async (connection, { user_id, session_id, rewardId }) => {
  if (!rewardId) return null
  if (!user_id && !session_id) return null

  const [[reward]] = await connection.query(
    'SELECT * FROM loyalty_rewards WHERE id = ? AND is_active = 1',
    [rewardId]
  )
  if (!reward || !reward.menu_item_id) return null

  const balance = await fetchBalance(connection, user_id, session_id)
  if (balance < reward.points_cost) return null

  const [[item]] = await connection.query('SELECT * FROM menu_items WHERE id = ?', [reward.menu_item_id])
  if (!item || !item.is_available) return null

  return { reward, item }
}

exports.recordRewardRedemption = async (connection, { user_id, session_id, orderId, reward }) => {
  await connection.query(
    'INSERT INTO loyalty_points (session_id, user_id, points, type, order_id, description) VALUES (?, ?, ?, "redeemed", ?, ?)',
    [session_id || null, user_id || null, reward.points_cost, orderId, `Redeemed ${reward.points_cost} points for free ${reward.name} on order #${orderId}`]
  )
}

exports.getBalance = async (req, res) => {
  try {
    const { session_id, user_id } = req.query
    const cond = balanceCondition(user_id, session_id)

    if (!cond) {
      return res.json({ success: true, data: { balance: 0, earned: 0, redeemed: 0, history: [] } })
    }

    const balance = await fetchBalance(db, user_id, session_id)

    const [history] = await db.query(
      `SELECT * FROM loyalty_points ${cond.where} ORDER BY created_at DESC LIMIT 50`,
      cond.params
    )

    res.json({ success: true, data: { balance, history } })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.earnPoints = async (order_id, session_id, total, user_id = null) => {
  const points = Math.floor(total * POINTS_PER_DOLLAR)
  if (points <= 0) return 0

  await db.query(
    'INSERT INTO loyalty_points (session_id, user_id, points, type, order_id, description) VALUES (?, ?, ?, "earned", ?, ?)',
    [session_id, user_id, points, order_id, `Earned from order #${order_id}`]
  )

  return points
}
// reservedPoints lets a caller set aside points already committed elsewhere in the
// same order (e.g. a free-item reward) so the same points can't be spent twice.
exports.calculateRedemption = async (connection, { user_id, session_id, requestedPoints, orderTotal, reservedPoints = 0 }) => {
  if (!requestedPoints || requestedPoints <= 0) return { pointsUsed: 0, discount: 0 }
  if (!user_id && !session_id) return { pointsUsed: 0, discount: 0 }

  const balance = Math.max(0, (await fetchBalance(connection, user_id, session_id)) - reservedPoints)
  const maxPointsByTotal = Math.floor(orderTotal * POINTS_PER_DOLLAR)
  const pointsUsed = Math.max(0, Math.min(Math.floor(requestedPoints), balance, maxPointsByTotal))

  if (pointsUsed <= 0) return { pointsUsed: 0, discount: 0 }

  const discount = Math.round((pointsUsed / POINTS_PER_DOLLAR) * 100) / 100

  return { pointsUsed, discount }
}
exports.recordRedemption = async (connection, { user_id, session_id, orderId, pointsUsed, discount }) => {
  if (!pointsUsed || pointsUsed <= 0) return

  await connection.query(
    'INSERT INTO loyalty_points (session_id, user_id, points, type, order_id, description) VALUES (?, ?, ?, "redeemed", ?, ?)',
    [session_id || null, user_id || null, pointsUsed, orderId, `Redeemed ${pointsUsed} points for $${discount.toFixed(2)} discount on order #${orderId}`]
  )
}

exports.redeemPoints = async (req, res) => {
  try {
    const { session_id, user_id, points } = req.body

    if (!points || points <= 0) {
      return res.status(400).json({ success: false, message: 'Valid points amount required' })
    }

    const cond = balanceCondition(user_id, session_id)
    if (!cond) {
      return res.status(400).json({ success: false, message: 'session_id or user_id required' })
    }

    const balance = await fetchBalance(db, user_id, session_id)

    if (points > balance) {
      return res.status(400).json({ success: false, message: 'Insufficient points' })
    }

    const discount = (points / POINTS_PER_DOLLAR).toFixed(2)

    await db.query(
      'INSERT INTO loyalty_points (session_id, user_id, points, type, description) VALUES (?, ?, ?, "redeemed", ?)',
      [session_id || null, user_id || null, points, `Redeemed ${points} points for $${discount} discount`]
    )

    res.json({ success: true, data: { discount: Number(discount), pointsUsed: points } })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
