const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const upload = require('../middlewares/upload');
const authMiddleware = require('../middlewares/authMiddleware');

// ==================== 인증 관련 ====================

// ⭐ 관리자 로그인
router.post('/login', async (req, res) => {
  try {
    console.log('===== 관리자 로그인 시도 =====');
    console.log('받은 데이터:', req.body);
    
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: '이메일과 비밀번호를 입력해주세요.' });
    }

    // 관리자 조회
    const [admins] = await db.query(
      'SELECT * FROM admins WHERE email = ?',
      [email]
    );

    console.log('조회된 관리자:', admins.length > 0 ? '있음' : '없음');

    if (admins.length === 0) {
      return res.status(401).json({ message: '이메일 또는 비밀번호가 틀렸습니다.' });
    }

    const admin = admins[0];

    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    console.log('비밀번호 검증:', isPasswordValid ? '성공' : '실패');

    if (!isPasswordValid) {
      return res.status(401).json({ message: '이메일 또는 비밀번호가 틀렸습니다.' });
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      { admin_id: admin.admin_id, email: admin.email, name: admin.name },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    console.log('✅ 로그인 성공');

    res.json({
      message: '로그인 성공',
      token,
      admin: {
        admin_id: admin.admin_id,
        email: admin.email,
        name: admin.name
      }
    });

  } catch (error) {
    console.error('❌ 로그인 에러:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
});

// ==================== 상품 관리 ====================

// ⭐ 상품 목록 조회 (관리자용)
router.get('/products', authMiddleware, async (req, res) => {
  try {
    const [products] = await db.query(`
      SELECT 
        p.*,
        c.name as category_name,
        (SELECT image_url FROM product_images 
         WHERE product_id = p.product_id AND is_thumbnail = 1 
         LIMIT 1) as thumbnail,
        (SELECT COUNT(*) FROM product_options WHERE product_id = p.product_id) as option_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      ORDER BY p.created_at DESC
    `);
    
    res.json({ products });
  } catch (error) {
    console.error('상품 목록 조회 실패:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
});

// ⭐ 상품 등록 (관리자용)
router.post('/products', authMiddleware, upload.array('images', 5), async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    console.log('===== 관리자 상품 등록 =====');
    console.log('받은 전체 데이터:', req.body);
    console.log('gender 값:', req.body.gender);
    console.log('=========================');
    
    const { name, description, price, discount_price, category_id, gender, status } = req.body;
    const options = JSON.parse(req.body.options || '[]');
    
    // gender 검증
    if (!gender || !['male', 'female', 'unisex'].includes(gender)) {
      throw new Error(`gender 값이 잘못되었습니다: ${gender}`);
    }
    
    console.log('✅ gender 검증 통과:', gender);
    
    // 상품 등록
    const [productResult] = await connection.query(
      `INSERT INTO products (name, description, price, discount_price, category_id, gender, status, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [name, description, price, discount_price || null, category_id, gender, status]
    );
    
    const productId = productResult.insertId;
    
    // 확인용 로그
    const [check] = await connection.query(
      'SELECT product_id, name, gender FROM products WHERE product_id = ?',
      [productId]
    );
    console.log('✅ DB에 저장된 상품:', check[0]);
    
    // 이미지 등록
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const imageUrl = `/uploads/products/${file.filename}`;
        const isThumbnail = i === 0 ? 1 : 0;
        
        await connection.query(
          `INSERT INTO product_images (product_id, image_url, is_thumbnail, display_order) 
           VALUES (?, ?, ?, ?)`,
          [productId, imageUrl, isThumbnail, i + 1]
        );
      }
    }
    
    // 옵션 등록
    if (options && options.length > 0) {
      for (const option of options) {
        await connection.query(
          `INSERT INTO product_options (product_id, option_name, option_value, stock, additional_price) 
           VALUES (?, ?, ?, ?, ?)`,
          [productId, option.option_name, option.option_value, option.stock, option.additional_price]
        );
      }
    }
    
    await connection.commit();
    
    res.status(201).json({ 
      message: '상품이 등록되었습니다.',
      productId 
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ 상품 등록 에러:', error);
    res.status(500).json({ 
      message: '상품 등록에 실패했습니다.',
      error: error.message 
    });
  } finally {
    connection.release();
  }
});

// ⭐ 상품 상세 조회 (관리자용)
router.get('/products/:id', authMiddleware, async (req, res) => {
  try {
    const productId = req.params.id;

    const [products] = await db.query(`
      SELECT 
        p.*,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      WHERE p.product_id = ?
    `, [productId]);

    if (products.length === 0) {
      return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
    }

    const product = products[0];

    // 이미지 조회
    const [images] = await db.query(
      'SELECT * FROM product_images WHERE product_id = ? ORDER BY display_order',
      [productId]
    );

    // 옵션 조회
    const [options] = await db.query(
      'SELECT * FROM product_options WHERE product_id = ?',
      [productId]
    );

    res.json({ 
      product: {
        ...product,
        images,
        options
      }
    });

  } catch (error) {
    console.error('상품 조회 실패:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
});

// ⭐ 상품 삭제 (관리자용)
router.delete('/products/:id', authMiddleware, async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const productId = req.params.id;
    
    // 옵션 삭제
    await connection.query('DELETE FROM product_options WHERE product_id = ?', [productId]);
    
    // 이미지 삭제
    await connection.query('DELETE FROM product_images WHERE product_id = ?', [productId]);
    
    // 상품 삭제
    await connection.query('DELETE FROM products WHERE product_id = ?', [productId]);
    
    await connection.commit();
    
    res.json({ message: '상품이 삭제되었습니다.' });
  } catch (error) {
    await connection.rollback();
    console.error('상품 삭제 실패:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  } finally {
    connection.release();
  }
});

// ==================== 카테고리 관리 ====================

// ⭐ 카테고리 목록 조회
router.get('/categories', authMiddleware, async (req, res) => {
  try {
    const [categories] = await db.query(`
      SELECT 
        c.*,
        COUNT(p.product_id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.category_id = p.category_id
      GROUP BY c.category_id
      ORDER BY c.category_id
    `);
    
    res.json({ categories });
  } catch (error) {
    console.error('카테고리 조회 실패:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
});

// ⭐ 카테고리 생성
router.post('/categories', authMiddleware, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const [result] = await db.query(
      'INSERT INTO categories (name, description) VALUES (?, ?)',
      [name, description]
    );
    
    res.status(201).json({ 
      message: '카테고리가 생성되었습니다.',
      category_id: result.insertId 
    });
  } catch (error) {
    console.error('카테고리 생성 실패:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
});

// ==================== 주문 관리 ====================

// ⭐ 주문 목록 조회
router.get('/orders', authMiddleware, async (req, res) => {
  try {
    console.log('===== 주문 목록 조회 =====');
    
    const [orders] = await db.query(`
      SELECT 
        o.*,
        u.name,
        u.email,
        COUNT(oi.order_item_id) as item_count
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.user_id
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      GROUP BY o.order_id
      ORDER BY o.created_at DESC
    `);
    
    console.log('✅ 주문 목록 조회 완료:', orders.length, '건');
    
    res.json({ orders });
  } catch (error) {
    console.error('❌ 주문 조회 실패:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
});

// ⭐ 주문 상세 조회
router.get('/orders/:id', authMiddleware, async (req, res) => {
  try {
    const orderId = req.params.id;
    
    const [orders] = await db.query(`
      SELECT 
        o.*,
        u.name,
        u.email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.user_id
      WHERE o.order_id = ?
    `, [orderId]);
    
    if (orders.length === 0) {
      return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
    }
    
    const [items] = await db.query(`
      SELECT 
        oi.*,
        p.name as product_name,
        (SELECT image_url FROM product_images 
         WHERE product_id = p.product_id AND is_thumbnail = 1 
         LIMIT 1) as thumbnail
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.product_id
      WHERE oi.order_id = ?
    `, [orderId]);
    
    res.json({ 
      order: {
        ...orders[0],
        items
      }
    });
  } catch (error) {
    console.error('주문 상세 조회 실패:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
});

// ⭐ 주문 상태 변경
router.put('/orders/:id/status', authMiddleware, async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;
    await db.query(
      'UPDATE orders SET status = ? WHERE order_id = ?',
      [status, orderId]
    );
    
    res.json({ message: '주문 상태가 변경되었습니다.' });
  } catch (error) {
    console.log("hello")
    console.error('주문 상태 변경 실패:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
});

/// ==================== 대시보드 ====================

// ⭐ 대시보드 통계
router.get('/dashboard/stats', authMiddleware, async (req, res) => {
  try {
    console.log('===== 대시보드 통계 요청 =====');
    
    const today = new Date().toISOString().split('T')[0];
    
    let todayOrdersCount = 0;
    let totalProductsCount = 0;
    let totalUsersCount = 0;
    let totalRevenueAmount = 0;
    
    // 1. 오늘 주문 수
    try {
      const [todayOrders] = await db.query(`
        SELECT COUNT(*) as count 
        FROM orders 
        WHERE DATE(created_at) = ?
      `, [today]);
      todayOrdersCount = todayOrders[0].count;
    } catch (err) {
      console.log('⚠️ orders 조회 에러:', err.message);
    }
    
    // 2. 전체 상품 수
    try {
      const [totalProducts] = await db.query(`
        SELECT COUNT(*) as count 
        FROM products 
        WHERE status = 'active'
      `);
      totalProductsCount = totalProducts[0].count;
    } catch (err) {
      console.log('⚠️ products 조회 에러:', err.message);
    }
    
    // 3. 전체 회원 수
    try {
      const [totalUsers] = await db.query(`
        SELECT COUNT(*) as count 
        FROM users
      `);
      totalUsersCount = totalUsers[0].count;
    } catch (err) {
      console.log('⚠️ users 조회 에러:', err.message);
    }
    
    // 4. 총 매출 (⭐ total_price 사용)
    try {
      const [totalRevenue] = await db.query(`
        SELECT COALESCE(SUM(total_price), 0) as total
        FROM orders 
        WHERE status IN ('paid', 'shipping', 'delivered', 'cancelled')
      `);
      totalRevenueAmount = totalRevenue[0].total;
    } catch (err) {
      console.log('⚠️ 매출 조회 에러:', err.message);
    }
    
    console.log('✅ 통계 조회 완료:', {
      todayOrdersCount,
      totalProductsCount,
      totalUsersCount,
      totalRevenueAmount
    });
    
    res.json({
      stats: {
        todayOrders: todayOrdersCount,
        totalProducts: totalProductsCount,
        totalUsers: totalUsersCount,
        totalRevenue: totalRevenueAmount
      }
    });
    
  } catch (error) {
    console.error('❌ 대시보드 통계 조회 실패:', error);
    res.status(500).json({ 
      message: '서버 에러가 발생했습니다.',
      error: error.message 
    });
  }
});
module.exports = router;