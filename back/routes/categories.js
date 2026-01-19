// back/routes/categories.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authMiddleware = require('../middlewares/authMiddleware');

// ==================== 공개 API ====================

// 모든 활성 카테고리 조회 (계층 구조)
router.get('/', async (req, res) => {
  try {
    const [categories] = await db.query(`
      SELECT * FROM categories 
      WHERE is_active = 1 
      ORDER BY parent_id, display_order
    `);

    // 계층 구조로 변환
    const categoryTree = buildCategoryTree(categories);
    res.json({ categories: categoryTree });

  } catch (error) {
    console.error('카테고리 조회 실패:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
});

// 특정 카테고리 조회
router.get('/:id', async (req, res) => {
  try {
    const [categories] = await db.query(
      'SELECT * FROM categories WHERE category_id = ?',
      [req.params.id]
    );

    if (categories.length === 0) {
      return res.status(404).json({ message: '카테고리를 찾을 수 없습니다.' });
    }

    res.json({ category: categories[0] });

  } catch (error) {
    console.error('카테고리 조회 실패:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
});

// ==================== 관리자 API ====================

// 모든 카테고리 조회 (관리자용 - 비활성 포함)
router.get('/admin/all', authMiddleware, async (req, res) => {
  try {
    const [categories] = await db.query(`
      SELECT 
        c.*,
        p.name as parent_name,
        (SELECT COUNT(*) FROM categories WHERE parent_id = c.category_id) as children_count,
        (SELECT COUNT(*) FROM products WHERE category_id = c.category_id) as product_count
      FROM categories c
      LEFT JOIN categories p ON c.parent_id = p.category_id
      ORDER BY c.parent_id, c.display_order
    `);

    // 계층 구조로 변환
    const categoryTree = buildCategoryTree(categories);
    
    res.json({ 
      categories: categoryTree,
      flatCategories: categories  // 플랫 리스트도 함께 전송
    });

  } catch (error) {
    console.error('카테고리 조회 실패:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
});

// 카테고리 생성
router.post('/admin', authMiddleware, async (req, res) => {
  try {
    const { name, parent_id, display_order, slug } = req.body;

    // 입력 검증
    if (!name || !slug) {
      return res.status(400).json({ message: '카테고리 이름과 슬러그는 필수입니다.' });
    }

    // 슬러그 중복 확인
    const [existing] = await db.query(
      'SELECT category_id FROM categories WHERE slug = ?',
      [slug]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: '이미 사용 중인 슬러그입니다.' });
    }

    // depth 계산
    let depth = 0;
    if (parent_id) {
      const [parent] = await db.query(
        'SELECT depth FROM categories WHERE category_id = ?',
        [parent_id]
      );
      if (parent.length > 0) {
        depth = parent[0].depth + 1;
      }
    }

    // display_order가 없으면 마지막으로 설정
    let finalDisplayOrder = display_order;
    if (!finalDisplayOrder) {
      const [maxOrder] = await db.query(
        'SELECT MAX(display_order) as max_order FROM categories WHERE parent_id = ?',
        [parent_id || null]
      );
      finalDisplayOrder = (maxOrder[0].max_order || 0) + 1;
    }

    const [result] = await db.query(
      `INSERT INTO categories (name, parent_id, display_order, slug, depth, is_active) 
       VALUES (?, ?, ?, ?, ?, 1)`,
      [name, parent_id || null, finalDisplayOrder, slug, depth]
    );

    const [newCategory] = await db.query(
      'SELECT * FROM categories WHERE category_id = ?',
      [result.insertId]
    );

    res.status(201).json({ 
      message: '카테고리가 생성되었습니다.',
      category: newCategory[0]
    });

  } catch (error) {
    console.error('카테고리 생성 실패:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
});

// 카테고리 수정
router.put('/admin/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, parent_id, display_order, is_active, slug } = req.body;

    // 카테고리 존재 확인
    const [existing] = await db.query(
      'SELECT * FROM categories WHERE category_id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: '카테고리를 찾을 수 없습니다.' });
    }

    // 자기 자신을 부모로 설정하는지 확인
    if (parent_id && parseInt(parent_id) === parseInt(id)) {
      return res.status(400).json({ message: '자기 자신을 상위 카테고리로 설정할 수 없습니다.' });
    }

    // 슬러그 중복 확인 (자신 제외)
    if (slug) {
      const [duplicateSlug] = await db.query(
        'SELECT category_id FROM categories WHERE slug = ? AND category_id != ?',
        [slug, id]
      );

      if (duplicateSlug.length > 0) {
        return res.status(400).json({ message: '이미 사용 중인 슬러그입니다.' });
      }
    }

    // depth 재계산
    let depth = 0;
    if (parent_id) {
      const [parent] = await db.query(
        'SELECT depth FROM categories WHERE category_id = ?',
        [parent_id]
      );
      if (parent.length > 0) {
        depth = parent[0].depth + 1;
      }
    }

    // 업데이트
    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (parent_id !== undefined) {
      updates.push('parent_id = ?', 'depth = ?');
      values.push(parent_id || null, depth);
    }
    if (display_order !== undefined) {
      updates.push('display_order = ?');
      values.push(display_order);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(is_active);
    }
    if (slug !== undefined) {
      updates.push('slug = ?');
      values.push(slug);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await db.query(
      `UPDATE categories SET ${updates.join(', ')} WHERE category_id = ?`,
      values
    );

    const [updated] = await db.query(
      'SELECT * FROM categories WHERE category_id = ?',
      [id]
    );

    res.json({ 
      message: '카테고리가 수정되었습니다.',
      category: updated[0]
    });

  } catch (error) {
    console.error('카테고리 수정 실패:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
});

// 카테고리 삭제
router.delete('/admin/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // 하위 카테고리 확인
    const [children] = await db.query(
      'SELECT COUNT(*) as count FROM categories WHERE parent_id = ?',
      [id]
    );

    if (children[0].count > 0) {
      return res.status(400).json({ 
        message: '하위 카테고리가 있는 카테고리는 삭제할 수 없습니다. 먼저 하위 카테고리를 삭제해주세요.' 
      });
    }

    // 해당 카테고리를 사용하는 상품 확인
    const [products] = await db.query(
      'SELECT COUNT(*) as count FROM products WHERE category_id = ?',
      [id]
    );

    if (products[0].count > 0) {
      return res.status(400).json({ 
        message: `이 카테고리를 사용하는 상품이 ${products[0].count}개 있습니다. 상품을 먼저 다른 카테고리로 이동해주세요.` 
      });
    }

    await db.query('DELETE FROM categories WHERE category_id = ?', [id]);

    res.json({ message: '카테고리가 삭제되었습니다.' });

  } catch (error) {
    console.error('카테고리 삭제 실패:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
});

// ==================== 헬퍼 함수 ====================

// 플랫 배열을 계층 구조로 변환
function buildCategoryTree(categories) {
  const categoryMap = {};
  const tree = [];

  // 먼저 모든 카테고리를 맵에 저장
  categories.forEach(cat => {
    categoryMap[cat.category_id] = { ...cat, children: [] };
  });

  // 부모-자식 관계 설정
  categories.forEach(cat => {
    if (cat.parent_id) {
      if (categoryMap[cat.parent_id]) {
        categoryMap[cat.parent_id].children.push(categoryMap[cat.category_id]);
      }
    } else {
      tree.push(categoryMap[cat.category_id]);
    }
  });

  return tree;
}

module.exports = router;