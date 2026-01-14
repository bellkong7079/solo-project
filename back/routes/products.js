const express = require('express');
const router = express.Router();
const db = require('../config/database');

// 상품 목록 조회 (사용자용)
router.get('/', async (req, res) => {
  try {
    const { category_id, search, sort } = req.query;
    
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

    // 조회수 증가
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