const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

// 관리자 로그인
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔍 로그인 시도:', { email, password });

    // 관리자 조회
    const [admins] = await db.query(
      'SELECT * FROM admins WHERE email = ?',
      [email]
    );

    console.log('📊 DB 조회 결과:', admins);

    if (admins.length === 0) {
      console.log('❌ 관리자를 찾을 수 없음');
      return res.status(401).json({ message: '이메일 또는 비밀번호가 잘못되었습니다.' });
    }

    const admin = admins[0];
    console.log('👤 조회된 관리자:', {
      admin_id: admin.admin_id,
      email: admin.email,
      hashedPassword: admin.password
    });

    // 비밀번호 확인
    console.log('🔐 비밀번호 비교 시작...');
    console.log('입력된 비밀번호:', password);
    console.log('저장된 해시:', admin.password);
    
    const isMatch = await bcrypt.compare(password, admin.password);
    console.log('🔐 비밀번호 매칭 결과:', isMatch);

    if (!isMatch) {
      console.log('❌ 비밀번호 불일치');
      return res.status(401).json({ message: '이메일 또는 비밀번호가 잘못되었습니다.' });
    }

    console.log('✅ 로그인 성공!');

    // JWT 토큰 생성
    const token = jwt.sign(
      { 
        admin_id: admin.admin_id, 
        email: admin.email,
        role: 'admin'
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

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
    console.error('💥 로그인 에러:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
};

// 상품 목록 조회
exports.getProducts = async (req, res) => {
  try {
    const [products] = await db.query(`
      SELECT 
        p.*,
        c.name as category_name,
        (SELECT image_url FROM product_images WHERE product_id = p.product_id AND is_thumbnail = 1 LIMIT 1) as thumbnail
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      ORDER BY p.created_at DESC
    `);

    res.json({ products });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
};

// 상품 등록
exports.createProduct = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const { name, description, price, discount_price, category_id, status, options } = req.body;

    // 상품 등록
    const [result] = await connection.query(
      `INSERT INTO products (name, description, price, discount_price, category_id, status) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, description, price, discount_price || null, category_id, status || 'active']
    );

    const productId = result.insertId;

    // 이미지 저장
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const imageUrl = `/uploads/products/${req.files[i].filename}`;
        const isThumbnail = i === 0;

        await connection.query(
          `INSERT INTO product_images (product_id, image_url, is_thumbnail, display_order) 
           VALUES (?, ?, ?, ?)`,
          [productId, imageUrl, isThumbnail, i]
        );
      }
    }

    // 옵션 저장
    if (options) {
      const optionList = JSON.parse(options);
      for (const option of optionList) {
        await connection.query(
          `INSERT INTO product_options (product_id, option_name, option_value, stock, additional_price) 
           VALUES (?, ?, ?, ?, ?)`,
          [productId, option.option_name, option.option_value, option.stock, option.additional_price || 0]
        );
      }
    }

    await connection.commit();

    res.status(201).json({ 
      message: '상품이 등록되었습니다.',
      product_id: productId
    });

  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  } finally {
    connection.release();
  }
};

// 상품 수정
exports.updateProduct = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const productId = req.params.id;
    const { name, description, price, discount_price, category_id, status } = req.body;

    await connection.query(
      `UPDATE products 
       SET name = ?, description = ?, price = ?, discount_price = ?, category_id = ?, status = ?
       WHERE product_id = ?`,
      [name, description, price, discount_price || null, category_id, status, productId]
    );

    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const imageUrl = `/uploads/products/${req.files[i].filename}`;
        
        await connection.query(
          `INSERT INTO product_images (product_id, image_url, is_thumbnail, display_order) 
           VALUES (?, ?, ?, ?)`,
          [productId, imageUrl, false, i]
        );
      }
    }

    await connection.commit();

    res.json({ message: '상품이 수정되었습니다.' });

  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  } finally {
    connection.release();
  }
};

// 상품 삭제
exports.deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    await db.query('DELETE FROM products WHERE product_id = ?', [productId]);

    res.json({ message: '상품이 삭제되었습니다.' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
};

// 카테고리 목록 조회
exports.getCategories = async (req, res) => {
  try {
    const [categories] = await db.query('SELECT * FROM categories ORDER BY display_order');
    res.json({ categories });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
};

// 카테고리 생성
exports.createCategory = async (req, res) => {
  try {
    const { name, parent_id, display_order } = req.body;

    const [result] = await db.query(
      'INSERT INTO categories (name, parent_id, display_order) VALUES (?, ?, ?)',
      [name, parent_id || null, display_order || 0]
    );

    res.status(201).json({ 
      message: '카테고리가 생성되었습니다.',
      category_id: result.insertId
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
};