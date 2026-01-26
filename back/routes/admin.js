const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const upload = require('../middlewares/upload');
const authMiddleware = require('../middlewares/authMiddleware');
const adminController = require('../controllers/adminController');

// ==================== 인증 관련 ====================

// 관리자 로그인
router.post('/login', adminController.login);

// ==================== 상품 관리 ====================

// 상품 목록 조회 (관리자용)
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

// 상품 등록 (관리자용)
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

// 상품 상세 조회 (관리자용)
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

// 상품 삭제 (관리자용)
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

// 🆕 상품 수정 (관리자용)
router.put('/products/:id', authMiddleware, upload.array('images', 5), async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    console.log('===== 관리자 상품 수정 =====');
    console.log('상품 ID:', req.params.id);
    console.log('받은 데이터:', req.body);
    
    const productId = req.params.id;
    const { name, description, price, discount_price, category_id, gender, status } = req.body;
    const options = JSON.parse(req.body.options || '[]');
    
    // gender 검증
    if (gender && !['male', 'female', 'unisex'].includes(gender)) {
      throw new Error(`gender 값이 잘못되었습니다: ${gender}`);
    }
    
    // 상품 기본 정보 수정
    await connection.query(
      `UPDATE products 
       SET name = ?, description = ?, price = ?, discount_price = ?, category_id = ?, gender = ?, status = ?
       WHERE product_id = ?`,
      [name, description, price, discount_price || null, category_id, gender, status, productId]
    );
    
    console.log('✅ 상품 기본 정보 수정 완료');
    
    // 새 이미지가 있으면 추가
    if (req.files && req.files.length > 0) {
      console.log('새 이미지 추가:', req.files.length, '개');
      
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const imageUrl = `/uploads/products/${file.filename}`;
        
        // 기존 이미지 개수 확인
        const [existingImages] = await connection.query(
          'SELECT COUNT(*) as count FROM product_images WHERE product_id = ?',
          [productId]
        );
        
        const displayOrder = existingImages[0].count + i + 1;
        
        await connection.query(
          `INSERT INTO product_images (product_id, image_url, is_thumbnail, display_order) 
           VALUES (?, ?, ?, ?)`,
          [productId, imageUrl, 0, displayOrder]
        );
      }
    }
    
    // 옵션 수정 (기존 옵션 삭제 후 새로 추가)
    if (options && options.length > 0) {
      console.log('옵션 수정:', options);
      
      // 기존 옵션 삭제
      await connection.query('DELETE FROM product_options WHERE product_id = ?', [productId]);
      
      // 새 옵션 추가
      for (const option of options) {
        await connection.query(
          `INSERT INTO product_options (product_id, option_name, option_value, stock, additional_price) 
           VALUES (?, ?, ?, ?, ?)`,
          [productId, option.option_name, option.option_value, option.stock, option.additional_price || 0]
        );
      }
      
      console.log('✅ 옵션 수정 완료');
    }
    
    await connection.commit();
    
    console.log('✅ 상품 수정 완료');
    
    res.json({ 
      message: '상품이 수정되었습니다.',
      productId 
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ 상품 수정 에러:', error);
    res.status(500).json({ 
      message: '상품 수정에 실패했습니다.',
      error: error.message 
    });
  } finally {
    connection.release();
  }
});

// ==================== 카테고리 관리 ====================

// 카테고리 목록 조회
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

// 카테고리 생성
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

// 주문 목록 조회
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

// 주문 상세 조회
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

// 주문 상태 변경
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
    console.error('주문 상태 변경 실패:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
});

// ==================== 대시보드 ====================

// 대시보드 통계
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
    
    // 4. 총 매출
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

// 🆕 대시보드 차트 데이터
router.get('/dashboard/charts', authMiddleware, adminController.getDashboardCharts);

// ==================== 회원 관리 ====================

// 모든 회원 목록 조회 (구매 통계 포함)
router.get('/users', authMiddleware, async (req, res) => {
  try {
    const [users] = await db.query(`
      SELECT 
        u.user_id,
        u.name,
        u.email,
        u.phone,
        u.created_at,
        COUNT(DISTINCT o.order_id) as order_count,
        COALESCE(SUM(o.total_price), 0) as total_spent,
        MAX(o.created_at) as last_order_date
      FROM users u
      LEFT JOIN orders o ON u.user_id = o.user_id
      GROUP BY u.user_id
      ORDER BY total_spent DESC
    `);

    res.json({ users });
  } catch (error) {
    console.error('회원 목록 조회 실패:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
});

// 특정 회원의 상세 정보 및 주문 내역
router.get('/users/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    // 회원 기본 정보
    const [users] = await db.query(`
      SELECT 
        u.*,
        COUNT(DISTINCT o.order_id) as order_count,
        COALESCE(SUM(o.total_price), 0) as total_spent
      FROM users u
      LEFT JOIN orders o ON u.user_id = o.user_id
      WHERE u.user_id = ?
      GROUP BY u.user_id
    `, [userId]);

    if (users.length === 0) {
      return res.status(404).json({ message: '회원을 찾을 수 없습니다.' });
    }

    const user = users[0];

    // 회원의 주문 목록
    const [orders] = await db.query(`
      SELECT 
        o.*,
        COUNT(oi.order_item_id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      WHERE o.user_id = ?
      GROUP BY o.order_id
      ORDER BY o.created_at DESC
    `, [userId]);

    // 각 주문의 상품 상세 정보
    for (let order of orders) {
      const [items] = await db.query(`
        SELECT 
          oi.*,
          p.name as product_name,
          p.price as product_price,
          (SELECT image_url FROM product_images 
          WHERE product_id = p.product_id AND is_thumbnail = 1 
          LIMIT 1) as product_image
        FROM order_items oi
        JOIN products p ON oi.product_id = p.product_id
        WHERE oi.order_id = ?
      `, [order.order_id]);
      
      order.items = items;
    }

    res.json({ user, orders });
  } catch (error) {
    console.error('회원 상세 조회 실패:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
});

// 회원별 구매 상품 통계
router.get('/users/:userId/products', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    const [products] = await db.query(`
      SELECT 
        p.product_id,
        p.name,
        c.name as category_name,
        COUNT(oi.order_item_id) as purchase_count,
        SUM(oi.quantity) as total_quantity,
        SUM(oi.price * oi.quantity) as total_amount,
        MAX(o.created_at) as last_purchase_date,
        (SELECT image_url FROM product_images 
        WHERE product_id = p.product_id AND is_thumbnail = 1 
        LIMIT 1) as product_image
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.order_id
      JOIN products p ON oi.product_id = p.product_id
      LEFT JOIN categories c ON p.category_id = c.category_id
      WHERE o.user_id = ?
      GROUP BY p.product_id
      ORDER BY purchase_count DESC, total_amount DESC
    `, [userId]);

    res.json({ products });
  } catch (error) {
    console.error('구매 상품 통계 조회 실패:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
});

// 🆕 분석 API 라우트들 (admin.js에 추가)

// 💰 매출 분석 데이터
router.get('/analytics/sales', authMiddleware, async (req, res) => {
  try {
    console.log('===== 매출 분석 데이터 요청 =====');

    // 1. 월별 매출 (12개월)
    const [monthlySales] = await db.query(`
      SELECT 
        DATE_FORMAT(created_at, '%m월') as month,
        COALESCE(SUM(total_price), 0) as total
      FROM orders
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        AND status != 'cancelled'
      GROUP BY YEAR(created_at), MONTH(created_at)
      ORDER BY YEAR(created_at), MONTH(created_at)
    `);

    // 2. 최근 30일 일별 매출
    const [dailySales] = await db.query(`
      SELECT 
        DATE_FORMAT(created_at, '%m/%d') as date,
        COALESCE(SUM(total_price), 0) as total
      FROM orders
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        AND status != 'cancelled'
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at)
    `);

    // 3. 시간대별 주문량
    const [hourlySales] = await db.query(`
      SELECT 
        HOUR(created_at) as hour,
        COUNT(*) as count
      FROM orders
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        AND status != 'cancelled'
      GROUP BY HOUR(created_at)
      ORDER BY HOUR(created_at)
    `);

    // 4. 요일별 평균 매출
    const [weekdaySales] = await db.query(`
      SELECT 
        DAYOFWEEK(created_at) as day,
        AVG(total_price) as total
      FROM orders
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
        AND status != 'cancelled'
      GROUP BY DAYOFWEEK(created_at)
      ORDER BY DAYOFWEEK(created_at)
    `);

    res.json({
      monthlySales,
      dailySales,
      hourlySales,
      weekdaySales
    });

  } catch (error) {
    console.error('❌ 매출 분석 데이터 조회 에러:', error);
    res.status(500).json({ 
      message: '서버 에러가 발생했습니다.',
      error: error.message 
    });
  }
});

// 📦 상품 분석 데이터
router.get('/analytics/products', authMiddleware, async (req, res) => {
  try {
    console.log('===== 상품 분석 데이터 요청 =====');

    // 1. 상품별 판매 순위 Top 20
    const [topProducts] = await db.query(`
      SELECT 
        p.name,
        SUM(oi.quantity) as sales
      FROM order_items oi
      JOIN products p ON oi.product_id = p.product_id
      JOIN orders o ON oi.order_id = o.order_id
      WHERE o.status != 'cancelled'
        AND o.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
      GROUP BY oi.product_id, p.name
      ORDER BY sales DESC
      LIMIT 20
    `);

    // 2. 카테고리별 매출
    const [categoryRevenue] = await db.query(`
      SELECT 
        c.name,
        COALESCE(SUM(oi.price * oi.quantity), 0) as revenue
      FROM categories c
      LEFT JOIN products p ON c.category_id = p.category_id
      LEFT JOIN order_items oi ON p.product_id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.order_id
      WHERE o.status != 'cancelled' OR o.status IS NULL
        AND o.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
      GROUP BY c.category_id, c.name
      ORDER BY revenue DESC
    `);

    // 3. 재고 부족 상품
    const [lowStock] = await db.query(`
      SELECT 
        p.name,
        CONCAT(po.option_name, ': ', po.option_value) as option,
        po.stock
      FROM product_options po
      JOIN products p ON po.product_id = p.product_id
      WHERE po.stock <= 10
      ORDER BY po.stock ASC
      LIMIT 10
    `);

    // 4. 상품 연령별 판매 (신상품 vs 일반 vs 구상품)
    const [productPerformance] = await db.query(`
      SELECT 
        CASE
          WHEN DATEDIFF(NOW(), p.created_at) <= 90 THEN 'new'
          WHEN DATEDIFF(NOW(), p.created_at) <= 365 THEN 'normal'
          ELSE 'old'
        END as age_group,
        SUM(oi.quantity) as sales
      FROM products p
      LEFT JOIN order_items oi ON p.product_id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.order_id
      WHERE o.status != 'cancelled' OR o.status IS NULL
      GROUP BY age_group
    `);

    res.json({
      topProducts,
      categoryRevenue,
      lowStock,
      productPerformance
    });

  } catch (error) {
    console.error('❌ 상품 분석 데이터 조회 에러:', error);
    res.status(500).json({ 
      message: '서버 에러가 발생했습니다.',
      error: error.message 
    });
  }
});

// 👥 고객 분석 데이터
router.get('/analytics/customers', authMiddleware, async (req, res) => {
  try {
    console.log('===== 고객 분석 데이터 요청 =====');

    // 1. 월별 신규 회원
    const [newCustomers] = await db.query(`
      SELECT 
        DATE_FORMAT(created_at, '%m월') as month,
        COUNT(*) as count
      FROM users
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY YEAR(created_at), MONTH(created_at)
      ORDER BY YEAR(created_at), MONTH(created_at)
    `);

    // 2. 고객별 구매 빈도 분포
    const [purchaseFrequency] = await db.query(`
      SELECT 
        CASE
          WHEN order_count = 1 THEN '1회'
          WHEN order_count = 2 THEN '2회'
          WHEN order_count BETWEEN 3 AND 5 THEN '3-5회'
          WHEN order_count BETWEEN 6 AND 10 THEN '6-10회'
          ELSE '11회 이상'
        END as frequency,
        COUNT(*) as count
      FROM (
        SELECT user_id, COUNT(*) as order_count
        FROM orders
        WHERE status != 'cancelled'
        GROUP BY user_id
      ) as user_orders
      GROUP BY frequency
      ORDER BY 
        CASE frequency
          WHEN '1회' THEN 1
          WHEN '2회' THEN 2
          WHEN '3-5회' THEN 3
          WHEN '6-10회' THEN 4
          ELSE 5
        END
    `);

    // 3. 고객 등급별 매출 (VIP, 골드, 실버, 브론즈, 일반)
    const [customerTiers] = await db.query(`
      SELECT 
        CASE
          WHEN total_spent >= 2000000 THEN 'VIP'
          WHEN total_spent >= 1000000 THEN '골드'
          WHEN total_spent >= 500000 THEN '실버'
          WHEN total_spent >= 200000 THEN '브론즈'
          ELSE '일반'
        END as tier,
        SUM(total_spent) as revenue
      FROM (
        SELECT user_id, SUM(total_price) as total_spent
        FROM orders
        WHERE status != 'cancelled'
        GROUP BY user_id
      ) as user_totals
      GROUP BY tier
      ORDER BY 
        CASE tier
          WHEN 'VIP' THEN 1
          WHEN '골드' THEN 2
          WHEN '실버' THEN 3
          WHEN '브론즈' THEN 4
          ELSE 5
        END
    `);

    // 4. 월별 평균 구매 금액
    const [avgOrderValue] = await db.query(`
      SELECT 
        DATE_FORMAT(created_at, '%m월') as month,
        AVG(total_price) as avg
      FROM orders
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        AND status != 'cancelled'
      GROUP BY YEAR(created_at), MONTH(created_at)
      ORDER BY YEAR(created_at), MONTH(created_at)
    `);

    res.json({
      newCustomers,
      purchaseFrequency,
      customerTiers,
      avgOrderValue
    });

  } catch (error) {
    console.error('❌ 고객 분석 데이터 조회 에러:', error);
    res.status(500).json({ 
      message: '서버 에러가 발생했습니다.',
      error: error.message 
    });
  }
});

// 📦 재고 관리 데이터
router.get('/inventory', authMiddleware, async (req, res) => {
  try {
    console.log('===== 재고 관리 데이터 요청 =====');

    // 1. 카테고리별 총 재고
    const [stockByCategory] = await db.query(`
      SELECT 
        c.name,
        COALESCE(SUM(po.stock), 0) as stock
      FROM categories c
      LEFT JOIN products p ON c.category_id = p.category_id
      LEFT JOIN product_options po ON p.product_id = po.product_id
      GROUP BY c.category_id, c.name
      ORDER BY stock DESC
    `);

    // 2. 재고 상태 분포
    const [stockStatus] = await db.query(`
      SELECT 
        CASE
          WHEN stock >= 50 THEN 'normal'
          WHEN stock >= 20 THEN 'caution'
          WHEN stock >= 10 THEN 'low'
          ELSE 'critical'
        END as status,
        COUNT(*) as count
      FROM product_options
      GROUP BY status
    `);

    // 3. 판매 속도별 분류
    const [turnoverRate] = await db.query(`
      SELECT 
        CASE
          WHEN COALESCE(weekly_sales, 0) >= 10 THEN 'fast'
          WHEN COALESCE(weekly_sales, 0) >= 5 THEN 'normal'
          WHEN COALESCE(weekly_sales, 0) >= 1 THEN 'slow'
          ELSE 'very_slow'
        END as speed,
        COUNT(*) as count
      FROM (
        SELECT 
          p.product_id,
          COUNT(oi.order_item_id) / 4 as weekly_sales
        FROM products p
        LEFT JOIN order_items oi ON p.product_id = oi.product_id
        LEFT JOIN orders o ON oi.order_id = o.order_id
        WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          AND (o.status != 'cancelled' OR o.status IS NULL)
        GROUP BY p.product_id
      ) as sales_data
      GROUP BY speed
    `);

    // 4. 장기 미판매 상품
    const [slowMoving] = await db.query(`
      SELECT 
        p.name,
        CONCAT(po.option_name, ': ', po.option_value) as option,
        po.stock,
        MAX(o.created_at) as last_sale_date,
        DATEDIFF(NOW(), MAX(o.created_at)) as days_since_sale
      FROM products p
      JOIN product_options po ON p.product_id = po.product_id
      LEFT JOIN order_items oi ON po.option_id = oi.option_id
      LEFT JOIN orders o ON oi.order_id = o.order_id
      GROUP BY po.option_id
      HAVING days_since_sale >= 60 OR days_since_sale IS NULL
      ORDER BY days_since_sale DESC
      LIMIT 10
    `);

    res.json({
      stockByCategory,
      stockStatus,
      turnoverRate,
      slowMoving
    });

  } catch (error) {
    console.error('❌ 재고 관리 데이터 조회 에러:', error);
    res.status(500).json({ 
      message: '서버 에러가 발생했습니다.',
      error: error.message 
    });
  }
});

module.exports = router;