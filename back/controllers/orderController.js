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

// 주문 상세 조회
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

    // 주문 상품 정보 조회 (썸네일 이미지 서브쿼리로 가져오기)
    const [items] = await db.query(
      `SELECT 
        oi.*,
        p.name,
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

    res.json({
      order: orders[0],
      items
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
      items // [{ product_id, option_id, quantity, price }]
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

// 🆕 주문 취소 (사용자용)
exports.cancelOrder = async (req, res) => {
  console.log('🔵 주문 취소 API 호출됨'); // 디버깅
  
  let connection;
  
  try {
    const orderId = req.params.orderId;
    const userId = req.user.user_id;
    
    console.log('📌 주문ID:', orderId, '사용자ID:', userId); // 디버깅

    // connection 가져오기
    connection = await db.getConnection();
    console.log('✅ DB 연결 성공'); // 디버깅
    
    await connection.beginTransaction();
    console.log('✅ 트랜잭션 시작'); // 디버깅

    // 주문 정보 조회
    const [orders] = await connection.query(
      'SELECT * FROM orders WHERE order_id = ? AND user_id = ?',
      [orderId, userId]
    );
    console.log('✅ 주문 조회 결과:', orders.length, '건'); // 디버깅

    if (orders.length === 0) {
      await connection.rollback();
      console.log('❌ 주문을 찾을 수 없음'); // 디버깅
      return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
    }

    const order = orders[0];
    console.log('📦 주문 상태:', order.status); // 디버깅

    // 취소 가능한 상태 확인
    if (order.status !== 'pending' && order.status !== 'paid') {
      await connection.rollback();
      console.log('❌ 취소 불가능한 상태'); // 디버깅
      return res.status(400).json({ 
        message: '배송 준비 중이거나 배송이 시작된 주문은 취소할 수 없습니다.' 
      });
    }

    // 이미 취소된 주문
    if (order.status === 'cancelled') {
      await connection.rollback();
      console.log('❌ 이미 취소된 주문'); // 디버깅
      return res.status(400).json({ message: '이미 취소된 주문입니다.' });
    }

    // 주문 상태 변경
    await connection.query(
      'UPDATE orders SET status = ? WHERE order_id = ?',
      ['cancelled', orderId]
    );
    console.log('✅ 주문 상태 변경 완료'); // 디버깅

    // 주문 상품 조회
    const [orderItems] = await connection.query(
      'SELECT * FROM order_items WHERE order_id = ?',
      [orderId]
    );
    console.log('✅ 주문 상품 조회:', orderItems.length, '건'); // 디버깅

    // 재고 복구
    for (const item of orderItems) {
      console.log('🔄 재고 복구 중:', item); // 디버깅
      
      if (item.option_id) {
        await connection.query(
          'UPDATE product_options SET stock = stock + ? WHERE option_id = ?',
          [item.quantity, item.option_id]
        );
        console.log('✅ 옵션 재고 복구 완료:', item.option_id); // 디버깅
      } else {
        await connection.query(
          'UPDATE products SET stock = stock + ? WHERE product_id = ?',
          [item.quantity, item.product_id]
        );
        console.log('✅ 상품 재고 복구 완료:', item.product_id); // 디버깅
      }
    }

    await connection.commit();
    console.log('✅ 트랜잭션 커밋 완료'); // 디버깅

    res.json({ 
      message: '주문이 취소되었습니다.',
      order_id: orderId 
    });
    
    console.log('🎉 주문 취소 완료'); // 디버깅

  } catch (error) {
    console.error('❌ 주문 취소 에러:', error); // 디버깅
    console.error('에러 스택:', error.stack); // 디버깅
    
    if (connection) {
      await connection.rollback();
      console.log('🔄 트랜잭션 롤백'); // 디버깅
    }
    
    res.status(500).json({ 
      message: '서버 에러가 발생했습니다.',
      error: error.message // 🆕 에러 메시지 포함
    });
  } finally {
    if (connection) {
      connection.release();
      console.log('🔌 DB 연결 해제'); // 디버깅
    }
  }
};