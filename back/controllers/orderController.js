const db = require('../config/database');

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
    console.error('주문 목록 조회 에러:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
};

// 🔥 주문 상세 조회 (수정됨!)
exports.getOrderDetail = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.user_id;

    // 주문 정보 조회
    const [orders] = await db.query(
      'SELECT * FROM orders WHERE order_id = ? AND user_id = ?',
      [orderId, userId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
    }

    // 주문 상품 정보 조회
    const [items] = await db.query(
      `SELECT 
        oi.*,
        p.name as product_name,
        (SELECT image_url FROM product_images 
         WHERE product_id = p.product_id AND is_thumbnail = 1 
         LIMIT 1) as thumbnail,
        po.option_name,
        po.option_value
      FROM order_items oi
      JOIN products p ON oi.product_id = p.product_id
      LEFT JOIN product_options po ON oi.option_id = po.option_id
      WHERE oi.order_id = ?`,
      [orderId]
    );

    // 🔥 수정: order 객체 안에 items 포함!
    res.json({
      order: {
        ...orders[0],
        items: items
      }
    });
  } catch (error) {
    console.error('주문 상세 조회 에러:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
};

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
      address_detail,
      delivery_memo,
      items
    } = req.body;

    // 총 금액 계산
    const total_price = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // 주문 생성
    const [orderResult] = await connection.query(
      `INSERT INTO orders (
        user_id, 
        recipient_name, 
        recipient_phone, 
        postal_code, 
        address, 
        address_detail, 
        delivery_memo, 
        total_price, 
        status,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'paid', NOW())`,
      [
        userId,
        recipient_name,
        recipient_phone,
        postal_code,
        address,
        address_detail,
        delivery_memo,
        total_price
      ]
    );

    const orderId = orderResult.insertId;

    // 주문 상품 추가
    for (const item of items) {
      await connection.query(
        `INSERT INTO order_items (
          order_id, 
          product_id, 
          option_id, 
          quantity, 
          price
        ) VALUES (?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.option_id || null, item.quantity, item.price]
      );

      // 재고 감소
      if (item.option_id) {
        await connection.query(
          'UPDATE product_options SET stock = stock - ? WHERE option_id = ?',
          [item.quantity, item.option_id]
        );
      } else {
        await connection.query(
          'UPDATE products SET stock = stock - ? WHERE product_id = ?',
          [item.quantity, item.product_id]
        );
      }
    }

    // 장바구니 비우기
    await connection.query('DELETE FROM cart WHERE user_id = ?', [userId]);

    await connection.commit();

    res.status(201).json({
      message: '주문이 완료되었습니다.',
      order_id: orderId
    });

  } catch (error) {
    await connection.rollback();
    console.error('주문 생성 에러:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  } finally {
    connection.release();
  }
};

// 주문 취소
exports.cancelOrder = async (req, res) => {
  let connection;
  
  try {
    const orderId = req.params.orderId;
    const userId = req.user.user_id;

    connection = await db.getConnection();
    await connection.beginTransaction();

    // 주문 정보 조회
    const [orders] = await connection.query(
      'SELECT * FROM orders WHERE order_id = ? AND user_id = ?',
      [orderId, userId]
    );

    if (orders.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
    }

    const order = orders[0];

    // 취소 가능한 상태 확인
    if (order.status !== 'pending' && order.status !== 'paid') {
      await connection.rollback();
      return res.status(400).json({ 
        message: '배송 준비 중이거나 배송이 시작된 주문은 취소할 수 없습니다.' 
      });
    }

    if (order.status === 'cancelled') {
      await connection.rollback();
      return res.status(400).json({ message: '이미 취소된 주문입니다.' });
    }

    // 주문 상태 변경
    await connection.query(
      'UPDATE orders SET status = ? WHERE order_id = ?',
      ['cancelled', orderId]
    );

    // 주문 상품 조회
    const [orderItems] = await connection.query(
      'SELECT * FROM order_items WHERE order_id = ?',
      [orderId]
    );

    // 재고 복구
    for (const item of orderItems) {
      if (item.option_id) {
        await connection.query(
          'UPDATE product_options SET stock = stock + ? WHERE option_id = ?',
          [item.quantity, item.option_id]
        );
      } else {
        await connection.query(
          'UPDATE products SET stock = stock + ? WHERE product_id = ?',
          [item.quantity, item.product_id]
        );
      }
    }

    await connection.commit();

    res.json({ 
      message: '주문이 취소되었습니다.',
      order_id: orderId 
    });

  } catch (error) {
    console.error('주문 취소 에러:', error);
    
    if (connection) {
      await connection.rollback();
    }
    
    res.status(500).json({ 
      message: '서버 에러가 발생했습니다.',
      error: error.message
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};