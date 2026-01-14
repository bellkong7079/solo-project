const express = require('express');
const router = express.Router();
const { authUser } = require('../middlewares/auth');
const cartController = require('../controllers/cartController');

// 모든 라우트는 인증 필요
router.use(authUser);

// 장바구니 조회
router.get('/', cartController.getCart);

// 장바구니에 상품 추가
router.post('/', cartController.addToCart);

// 장바구니 상품 수량 변경
router.put('/:cartId', cartController.updateCartItem);

// 장바구니 상품 삭제
router.delete('/:cartId', cartController.removeFromCart);

// 장바구니 전체 비우기
router.delete('/', cartController.clearCart);

module.exports = router;