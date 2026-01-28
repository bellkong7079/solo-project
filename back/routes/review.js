// back/routes/review.js

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authUser } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

// 🌟 1. 리뷰 작성 가능 여부 확인
router.get('/can-review/:productId', authUser, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const productId = req.params.productId;

    // 해당 상품을 구매했고, 배송 완료된 주문 확인
    const [orders] = await db.query(`
      SELECT DISTINCT o.order_id, o.created_at
      FROM orders o
      JOIN order_items oi ON o.order_id = oi.order_id
      WHERE o.user_id = ?
        AND oi.product_id = ?
        AND o.status = 'delivered'
        AND NOT EXISTS (
          SELECT 1 FROM reviews r
          WHERE r.order_id = o.order_id
            AND r.product_id = ?
        )
      ORDER BY o.created_at DESC
      LIMIT 1
    `, [userId, productId, productId]);

    if (orders.length === 0) {
      return res.json({ 
        canReview: false,
        message: '구매 확정 후 리뷰를 작성할 수 있습니다.'
      });
    }

    res.json({
      canReview: true,
      orderId: orders[0].order_id,
      orderDate: orders[0].created_at
    });

  } catch (error) {
    console.error('리뷰 작성 가능 여부 확인 에러:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
});

// 🌟 2. 리뷰 작성
router.post('/', authUser, upload.array('images', 5), async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const userId = req.user.user_id;
    const { product_id, order_id, rating, content } = req.body;

    // 구매 확인
    const [orders] = await connection.query(`
      SELECT o.order_id
      FROM orders o
      JOIN order_items oi ON o.order_id = oi.order_id
      WHERE o.order_id = ?
        AND o.user_id = ?
        AND oi.product_id = ?
        AND o.status = 'delivered'
    `, [order_id, userId, product_id]);

    if (orders.length === 0) {
      await connection.rollback();
      return res.status(403).json({ 
        message: '구매 확정된 상품만 리뷰를 작성할 수 있습니다.' 
      });
    }

    // 중복 리뷰 확인
    const [existing] = await connection.query(`
      SELECT review_id FROM reviews
      WHERE order_id = ? AND product_id = ?
    `, [order_id, product_id]);

    if (existing.length > 0) {
      await connection.rollback();
      return res.status(400).json({ 
        message: '이미 리뷰를 작성한 상품입니다.' 
      });
    }

    // 리뷰 등록
    const [result] = await connection.query(`
      INSERT INTO reviews (product_id, user_id, order_id, rating, content)
      VALUES (?, ?, ?, ?, ?)
    `, [product_id, userId, order_id, rating, content]);

    const reviewId = result.insertId;

    // 이미지 등록
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const imageUrl = `/uploads/reviews/${file.filename}`;
        
        await connection.query(`
          INSERT INTO review_images (review_id, image_url, display_order)
          VALUES (?, ?, ?)
        `, [reviewId, imageUrl, i + 1]);
      }
    }

    await connection.commit();

    res.status(201).json({ 
      message: '리뷰가 등록되었습니다.',
      reviewId
    });

  } catch (error) {
    await connection.rollback();
    console.error('리뷰 작성 에러:', error);
    res.status(500).json({ message: '리뷰 작성에 실패했습니다.' });
  } finally {
    connection.release();
  }
});

// 🌟 3. 상품별 리뷰 목록 조회
router.get('/product/:productId', async (req, res) => {
  try {
    const productId = req.params.productId;
    const { sort = 'latest', page = 1, limit = 10 } = req.query;

    let orderBy = 'r.created_at DESC';
    if (sort === 'helpful') orderBy = 'r.helpful_count DESC, r.created_at DESC';
    else if (sort === 'rating_high') orderBy = 'r.rating DESC, r.created_at DESC';
    else if (sort === 'rating_low') orderBy = 'r.rating ASC, r.created_at DESC';

    const offset = (page - 1) * limit;

    // 리뷰 목록
    const [reviews] = await db.query(`
      SELECT 
        r.*,
        u.name as user_name,
        u.email as user_email,
        (SELECT COUNT(*) FROM review_images WHERE review_id = r.review_id) as image_count
      FROM reviews r
      JOIN users u ON r.user_id = u.user_id
      WHERE r.product_id = ?
      ORDER BY r.is_best DESC, ${orderBy}
      LIMIT ? OFFSET ?
    `, [productId, parseInt(limit), parseInt(offset)]);

    // 각 리뷰의 이미지 조회
    for (let review of reviews) {
      const [images] = await db.query(`
        SELECT image_url FROM review_images
        WHERE review_id = ?
        ORDER BY display_order
      `, [review.review_id]);
      review.images = images.map(img => img.image_url);
    }

    // 전체 개수
    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM reviews WHERE product_id = ?',
      [productId]
    );

    // 평균 평점
    const [avgResult] = await db.query(`
      SELECT 
        AVG(rating) as avgRating,
        COUNT(*) as totalReviews,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as rating5,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as rating4,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as rating3,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as rating2,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as rating1
      FROM reviews
      WHERE product_id = ?
    `, [productId]);

    res.json({
      reviews,
      total: countResult[0].total,
      avgRating: parseFloat(avgResult[0].avgRating || 0).toFixed(1),
      ratingDistribution: {
        5: avgResult[0].rating5,
        4: avgResult[0].rating4,
        3: avgResult[0].rating3,
        2: avgResult[0].rating2,
        1: avgResult[0].rating1
      },
      page: parseInt(page),
      totalPages: Math.ceil(countResult[0].total / limit)
    });

  } catch (error) {
    console.error('리뷰 목록 조회 에러:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
});

// 🌟 4. 리뷰 도움돼요
router.post('/:reviewId/helpful', authUser, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const reviewId = req.params.reviewId;

    // 중복 확인
    const [existing] = await db.query(
      'SELECT * FROM review_helpful WHERE review_id = ? AND user_id = ?',
      [reviewId, userId]
    );

    if (existing.length > 0) {
      // 취소
      await db.query(
        'DELETE FROM review_helpful WHERE review_id = ? AND user_id = ?',
        [reviewId, userId]
      );
      await db.query(
        'UPDATE reviews SET helpful_count = helpful_count - 1 WHERE review_id = ?',
        [reviewId]
      );
      return res.json({ message: '도움돼요를 취소했습니다.', helpful: false });
    }

    // 추가
    await db.query(
      'INSERT INTO review_helpful (review_id, user_id) VALUES (?, ?)',
      [reviewId, userId]
    );
    await db.query(
      'UPDATE reviews SET helpful_count = helpful_count + 1 WHERE review_id = ?',
      [reviewId]
    );

    res.json({ message: '도움이 돼요!', helpful: true });

  } catch (error) {
    console.error('리뷰 도움돼요 에러:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
});

// 🌟 5. 내가 작성한 리뷰 목록
router.get('/my-reviews', authUser, async (req, res) => {
  try {
    const userId = req.user.user_id;

    const [reviews] = await db.query(`
      SELECT 
        r.*,
        p.name as product_name,
        p.thumbnail as product_thumbnail
      FROM reviews r
      JOIN products p ON r.product_id = p.product_id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
    `, [userId]);

    // 각 리뷰의 이미지
    for (let review of reviews) {
      const [images] = await db.query(
        'SELECT image_url FROM review_images WHERE review_id = ? ORDER BY display_order',
        [review.review_id]
      );
      review.images = images.map(img => img.image_url);
    }

    res.json({ reviews });

  } catch (error) {
    console.error('내 리뷰 조회 에러:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
});

// 🌟 6. 리뷰 수정
router.put('/:reviewId', authUser, upload.array('newImages', 5), async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const userId = req.user.user_id;
    const reviewId = req.params.reviewId;
    const { rating, content, deleteImages } = req.body;

    // 본인 리뷰 확인
    const [reviews] = await connection.query(
      'SELECT * FROM reviews WHERE review_id = ? AND user_id = ?',
      [reviewId, userId]
    );

    if (reviews.length === 0) {
      await connection.rollback();
      return res.status(403).json({ message: '본인의 리뷰만 수정할 수 있습니다.' });
    }

    // 리뷰 수정
    await connection.query(
      'UPDATE reviews SET rating = ?, content = ?, updated_at = NOW() WHERE review_id = ?',
      [rating, content, reviewId]
    );

    // 이미지 삭제
    if (deleteImages && deleteImages.length > 0) {
      const deleteImageIds = JSON.parse(deleteImages);
      for (let imageId of deleteImageIds) {
        await connection.query('DELETE FROM review_images WHERE image_id = ?', [imageId]);
      }
    }

    // 새 이미지 추가
    if (req.files && req.files.length > 0) {
      // 현재 이미지 개수 확인
      const [currentImages] = await connection.query(
        'SELECT COUNT(*) as count FROM review_images WHERE review_id = ?',
        [reviewId]
      );
      
      let displayOrder = currentImages[0].count + 1;

      for (let file of req.files) {
        const imageUrl = `/uploads/reviews/${file.filename}`;
        await connection.query(
          'INSERT INTO review_images (review_id, image_url, display_order) VALUES (?, ?, ?)',
          [reviewId, imageUrl, displayOrder++]
        );
      }
    }

    await connection.commit();

    res.json({ message: '리뷰가 수정되었습니다.' });

  } catch (error) {
    await connection.rollback();
    console.error('리뷰 수정 에러:', error);
    res.status(500).json({ message: '리뷰 수정에 실패했습니다.' });
  } finally {
    connection.release();
  }
});

// 🌟 7. 리뷰 삭제
router.delete('/:reviewId', authUser, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const reviewId = req.params.reviewId;

    // 본인 리뷰 확인
    const [reviews] = await db.query(
      'SELECT * FROM reviews WHERE review_id = ? AND user_id = ?',
      [reviewId, userId]
    );

    if (reviews.length === 0) {
      return res.status(403).json({ message: '본인의 리뷰만 삭제할 수 있습니다.' });
    }

    // 리뷰 삭제 (CASCADE로 이미지도 자동 삭제)
    await db.query('DELETE FROM reviews WHERE review_id = ?', [reviewId]);

    res.json({ message: '리뷰가 삭제되었습니다.' });

  } catch (error) {
    console.error('리뷰 삭제 에러:', error);
    res.status(500).json({ message: '리뷰 삭제에 실패했습니다.' });
  }
});

module.exports = router;