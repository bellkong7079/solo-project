const db = require('../config/database');

// 주문 생성
exports.createOrder = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const userId = req.user.user_id;
    const {
      recipient_name,
      recipient_phone,
      postal_code,
      address,
      detail_address,
      message,
      total_price,
      items
    } = req.body;

    // 주문 생성
    const [orderResult] = await connection.query(
      `INSERT INTO orders 
       (user_id, total_price, status, recipient_name, recipient_phone, address, postal_code, detail_address, message) 
       VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        total_price,
        recipient_name,
        recipient_phone,
        `${address} ${detail_address || ''}`.trim(),
        postal_code || '',
        detail_address || '',
        message || ''
      ]
    );

    const orderId = orderResult.insertId;

    // 주문 상품 저장
    for (const item of items) {
      await connection.query(
        `INSERT INTO order_items (order_id, product_id, option_id, quantity, price) 
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.option_id, item.quantity, item.price]
      );
    }

    // 장바구니 비우기
    await connection.query('DELETE FROM cart_items WHERE user_id = ?', [userId]);

    await connection.commit();

    res.status(201).json({
      message: '주문이 완료되었습니다.',
      order_id: orderId
    });

  } catch (error) {
    await connection.rollback();
    console.error('주문 생성 실패:', error);
    res.status(500).json({ message: '주문에 실패했습니다.' });
  } finally {
    connection.release();
  }
};

// 내 주문 목록 조회
exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const [orders] = await db.query(
      `SELECT 
        o.*,
        COUNT(oi.order_item_id) as item_count
       FROM orders o
       LEFT JOIN order_items oi ON o.order_id = oi.order_id
       WHERE o.user_id = ?
       GROUP BY o.order_id
       ORDER BY o.created_at DESC`,
      [userId]
    );

    res.json({ orders });

  } catch (error) {
    console.error('주문 목록 조회 실패:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
};

// 주문 상세 조회
exports.getOrderDetail = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const orderId = req.params.orderId;

    // 주문 정보
    const [orders] = await db.query(
      'SELECT * FROM orders WHERE order_id = ? AND user_id = ?',
      [orderId, userId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
    }

    const order = orders[0];

    // 주문 상품 목록
    const [items] = await db.query(
      `SELECT 
        oi.*,
        p.name as product_name,
        po.option_name,
        po.option_value,
        (SELECT image_url FROM product_images WHERE product_id = p.product_id AND is_thumbnail = 1 LIMIT 1) as thumbnail
       FROM order_items oi
       JOIN products p ON oi.product_id = p.product_id
       LEFT JOIN product_options po ON oi.option_id = po.option_id
       WHERE oi.order_id = ?`,
      [orderId]
    );

    res.json({
      order: {
        ...order,
        items
      }
    });

  } catch (error) {
    console.error('주문 상세 조회 실패:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
};