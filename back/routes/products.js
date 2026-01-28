const express = require('express');
const router = express.Router();
const db = require('../config/database');
const upload = require('../middlewares/upload');
const authMiddleware = require('../middlewares/authMiddleware');

// 🔍 검색 자동완성 (GET /products/search-suggestions)
router.get('/search-suggestions', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({ suggestions: [] });
    }

    const [suggestions] = await db.query(`
      SELECT DISTINCT name
      FROM products
      WHERE name LIKE ? AND status = 'active'
      LIMIT 10
    `, [`%${q}%`]);

    const suggestionList = suggestions.map(s => s.name);

    res.json({ suggestions: suggestionList });

  } catch (error) {
    console.error('검색 자동완성 에러:', error);
    res.status(500).json({ 
      message: '서버 에러가 발생했습니다.',
      suggestions: []
    });
  }
});

// 🔍 인기 검색어 (GET /products/popular-searches)
router.get('/popular-searches', async (req, res) => {
  try {
    // 최근 7일간 가장 많이 판매된 상품명
    const [popular] = await db.query(`
      SELECT p.name, COUNT(oi.order_item_id) as order_count
      FROM products p
      JOIN order_items oi ON p.product_id = oi.product_id
      JOIN orders o ON oi.order_id = o.order_id
      WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        AND o.status != 'cancelled'
      GROUP BY p.name
      ORDER BY order_count DESC
      LIMIT 5
    `);

    // 상품명에서 키워드 추출 (공백 기준 첫 단어)
    const searches = popular.map(p => {
      const words = p.name.split(' ');
      return words[0];
    });

    // 중복 제거
    const uniqueSearches = [...new Set(searches)];

    // 부족하면 카테고리명으로 채우기
    if (uniqueSearches.length < 5) {
      const [categories] = await db.query(`
        SELECT name FROM categories 
        WHERE parent_id IS NOT NULL AND is_active = 1
        LIMIT ${5 - uniqueSearches.length}
      `);
      categories.forEach(c => uniqueSearches.push(c.name));
    }

    res.json({ searches: uniqueSearches.slice(0, 5) });

  } catch (error) {
    console.error('인기 검색어 조회 에러:', error);
    // 기본 인기 검색어 반환
    res.json({ 
      searches: ['셔츠', '청바지', '스니커즈', '가디건', '코트']
    });
  }
});

// 기존 상품 목록 조회 (/products) - 검색 기능 추가
router.get('/', async (req, res) => {
  try {
    const { category_id, category, gender, search, sort } = req.query;
    
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

    // 성별 필터
    if (gender && ['male', 'female', 'unisex'].includes(gender)) {
      query += ' AND p.gender = ?';
      params.push(gender);
    }

    // category_id로 필터링
    if (category_id) {
      query += ' AND p.category_id = ?';
      params.push(category_id);
    }
    // category slug로 필터링
    else if (category) {
      const [categories] = await db.query(
        'SELECT category_id FROM categories WHERE slug = ? AND is_active = 1',
        [category]
      );
      
      if (categories.length > 0) {
        const categoryId = categories[0].category_id;
        
        const [childCategories] = await db.query(
          'SELECT category_id FROM categories WHERE parent_id = ? AND is_active = 1',
          [categoryId]
        );
        
        if (childCategories.length > 0) {
          const categoryIds = [categoryId, ...childCategories.map(c => c.category_id)];
          query += ` AND p.category_id IN (${categoryIds.map(() => '?').join(',')})`;
          params.push(...categoryIds);
        } else {
          query += ' AND p.category_id = ?';
          params.push(categoryId);
        }
      }
    }

    // 🔍 검색어 필터 (이름, 설명, 카테고리명)
    if (search && search.trim().length >= 2) {
      query += ` AND (
        p.name LIKE ? OR
        p.description LIKE ? OR
        c.name LIKE ?
      )`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // 정렬
    if (sort === 'price_asc') {
      query += ' ORDER BY p.price ASC';
    } else if (sort === 'price_desc') {
      query += ' ORDER BY p.price DESC';
    } else if (search) {
      // 검색 시: 관련도순 정렬
      query += ` ORDER BY
        CASE 
          WHEN p.name LIKE ? THEN 1
          WHEN p.name LIKE ? THEN 2
          ELSE 3
        END,
        p.created_at DESC`;
      params.push(`${search}%`, `%${search}%`);
    } else {
      query += ' ORDER BY p.created_at DESC';
    }

    const [products] = await db.query(query, params);

    res.json({ 
      products,
      total: products.length,
      searchQuery: search || null
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
});

// 상품 목록 조회 (사용자용)
router.get('/', async (req, res) => {
  try {
    const { category_id, category, gender, search, sort } = req.query;  // ⭐ category 추가
    
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

    // 성별 필터 추가
    if (gender && ['male', 'female', 'unisex'].includes(gender)) {
      query += ' AND p.gender = ?';
      params.push(gender);
    }

    // ⭐ category_id로 필터링 (기존 방식)
    if (category_id) {
      query += ' AND p.category_id = ?';
      params.push(category_id);
    }
    // ⭐ category slug로 필터링 (새로운 방식)
    else if (category) {
      // slug로 카테고리 찾기 (대분류 또는 소분류)
      const [categories] = await db.query(
        'SELECT category_id FROM categories WHERE slug = ? AND is_active = 1',
        [category]
      );
      
      if (categories.length > 0) {
        const categoryId = categories[0].category_id;
        
        // 해당 카테고리 또는 그 하위 카테고리의 상품들을 찾기
        const [childCategories] = await db.query(
          'SELECT category_id FROM categories WHERE parent_id = ? AND is_active = 1',
          [categoryId]
        );
        
        if (childCategories.length > 0) {
          // 대분류인 경우: 자기 자신 + 모든 하위 카테고리
          const categoryIds = [categoryId, ...childCategories.map(c => c.category_id)];
          query += ` AND p.category_id IN (${categoryIds.map(() => '?').join(',')})`;
          params.push(...categoryIds);
        } else {
          // 소분류인 경우: 자기 자신만
          query += ' AND p.category_id = ?';
          params.push(categoryId);
        }
      }
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
    
    const { name, description, price, discount_price, category_id, gender, status } = req.body;
    const options = JSON.parse(req.body.options || '[]');
    
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