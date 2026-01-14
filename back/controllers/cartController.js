const db = require('../config/database');

// 장바구니 조회
exports.getCart = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const [cartItems] = await db.query(`
      SELECT 
        c.cart_id,
        c.quantity,
        p.product_id,
        p.name,
        p.price,
        p.discount_price,
        po.option_id,
        po.option_name,
        po.option_value,
        po.additional_price,
        po.stock,
        (SELECT image_url FROM product_images WHERE product_id = p.product_id AND is_thumbnail = 1 LIMIT 1) as thumbnail
      FROM cart_items c
      JOIN products p ON c.product_id = p.product_id
      LEFT JOIN product_options po ON c.option_id = po.option_id
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC
    `, [userId]);

    // 총 금액 계산
    let totalPrice = 0;
    const items = cartItems.map(item => {
      const itemPrice = (item.discount_price || item.price) + (item.additional_price || 0);
      const itemTotal = itemPrice * item.quantity;
      totalPrice += itemTotal;
      
      return {
        ...item,
        itemPrice,
        itemTotal
      };
    });

    res.json({ 
      items,
      totalPrice,
      itemCount: items.length
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
};

// 장바구니에 상품 추가
exports.addToCart = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { product_id, option_id, quantity = 1 } = req.body;

    // 상품 존재 확인
    const [products] = await db.query(
      'SELECT * FROM products WHERE product_id = ?',
      [product_id]
    );

    if (products.length === 0) {
      return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
    }

    // 옵션 재고 확인
    if (option_id) {
      const [options] = await db.query(
        'SELECT stock FROM product_options WHERE option_id = ?',
        [option_id]
      );

      if (options.length === 0) {
        return res.status(404).json({ message: '옵션을 찾을 수 없습니다.' });
      }

      if (options[0].stock < quantity) {
        return res.status(400).json({ message: '재고가 부족합니다.' });
      }
    }

    // 이미 장바구니에 있는지 확인
    const [existing] = await db.query(
      'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ? AND option_id = ?',
      [userId, product_id, option_id || null]
    );

    if (existing.length > 0) {
      // 수량만 증가
      await db.query(
        'UPDATE cart_items SET quantity = quantity + ? WHERE cart_id = ?',
        [quantity, existing[0].cart_id]
      );

      return res.json({ message: '장바구니 수량이 업데이트되었습니다.' });
    }

    // 새로 추가
    const [result] = await db.query(
      'INSERT INTO cart_items (user_id, product_id, option_id, quantity) VALUES (?, ?, ?, ?)',
      [userId, product_id, option_id || null, quantity]
    );

    res.status(201).json({ 
      message: '장바구니에 추가되었습니다.',
      cart_id: result.insertId
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
};

// 장바구니 상품 수량 변경
exports.updateCartItem = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const cartId = req.params.cartId;
    const { quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({ message: '수량은 1개 이상이어야 합니다.' });
    }

    // 장바구니 항목 확인
    const [cartItems] = await db.query(
      'SELECT * FROM cart_items WHERE cart_id = ? AND user_id = ?',
      [cartId, userId]
    );

    if (cartItems.length === 0) {
      return res.status(404).json({ message: '장바구니 항목을 찾을 수 없습니다.' });
    }

    // 재고 확인
    const cartItem = cartItems[0];
    if (cartItem.option_id) {
      const [options] = await db.query(
        'SELECT stock FROM product_options WHERE option_id = ?',
        [cartItem.option_id]
      );

      if (options[0].stock < quantity) {
        return res.status(400).json({ message: '재고가 부족합니다.' });
      }
    }

    // 수량 업데이트
    await db.query(
      'UPDATE cart_items SET quantity = ? WHERE cart_id = ?',
      [quantity, cartId]
    );

    res.json({ message: '수량이 변경되었습니다.' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
};

// 장바구니 상품 삭제
exports.removeFromCart = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const cartId = req.params.cartId;

    await db.query(
      'DELETE FROM cart_items WHERE cart_id = ? AND user_id = ?',
      [cartId, userId]
    );

    res.json({ message: '장바구니에서 삭제되었습니다.' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
};

// 장바구니 전체 비우기
exports.clearCart = async (req, res) => {
  try {
    const userId = req.user.user_id;

    await db.query('DELETE FROM cart_items WHERE user_id = ?', [userId]);

    res.json({ message: '장바구니가 비워졌습니다.' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
};