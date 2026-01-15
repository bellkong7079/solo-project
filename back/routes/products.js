const express = require('express');
const router = express.Router();
const db = require('../config/database');
const upload = require('../middlewares/upload');
const authMiddleware = require('../middlewares/authMiddleware');

// 상품 목록 조회 (사용자용)
router.get('/', async (req, res) => {
  try {
    const { category_id, gender, search, sort } = req.query;  // ⭐ gender 추가
    
    let query = `
      SELECT 
        p.*,
        c.name as category_name,
        (SELECT image_url FROM product_images WHERE product_id = p.product_id AND is_thumbnail = 1 LIMIT 1) as thumbnail
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      WHERE p.status = 'active'
    `;
    
    const params = [];

    // ⭐ 성별 필터 추가
    if (gender && ['male', 'female', 'unisex'].includes(gender)) {
      query += ' AND p.gender = ?';
      params.push(gender);
    }

    if (category_id) {
      query += ' AND p.category_id = ?';
      params.push(category_id);
    }

    if (search) {
      query += ' AND p.name LIKE ?';
      params.push(`%${search}%`);
    }

    if (sort === 'price_asc') {
      query += ' ORDER BY p.price ASC';
    } else if (sort === 'price_desc') {
      query += ' ORDER BY p.price DESC';
    } else {
      query += ' ORDER BY p.created_at DESC';
    }

    const [products] = await db.query(query, params);

    res.json({ products });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
});

// 상품 등록 (관리자용)
router.post('/', authMiddleware, upload.array('images', 5), async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    console.log('받은 데이터:', req.body);
    console.log('파일 정보:', req.files);
    
    const { name, description, price, discount_price, category_id, gender, status } = req.body;  // ⭐ gender 추가
    const options = JSON.parse(req.body.options || '[]');
    
    // ⭐ gender 추가
    const [productResult] = await connection.query(
      `INSERT INTO products (name, description, price, discount_price, category_id, gender, status, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [name, description, price, discount_price || null, category_id, gender || 'unisex', status]
    );
    
    const productId = productResult.insertId;
    
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
    console.error('상품 등록 에러:', error);
    res.status(500).json({ 
      message: '상품 등록에 실패했습니다.',
      error: error.message 
    });
  } finally {
    connection.release();
  }
});

// 상품 상세 조회
router.get('/:id', async (req, res) => {
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

    const [images] = await db.query(
      'SELECT * FROM product_images WHERE product_id = ? ORDER BY display_order',
      [productId]
    );

    const [options] = await db.query(
      'SELECT * FROM product_options WHERE product_id = ?',
      [productId]
    );

    await db.query(
      'UPDATE products SET view_count = view_count + 1 WHERE product_id = ?',
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
    console.error(error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
});

module.exports = router;