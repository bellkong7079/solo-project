const express = require('express');
const router = express.Router();
const { authUser } = require('../middlewares/auth');
const orderController = require('../controllers/orderController');

// 모든 라우트는 인증 필요
router.use(authUser);

// 주문 생성
router.post('/', orderController.createOrder);

// 내 주문 목록 조회
router.get('/', orderController.getMyOrders);

// 주문 상세 조회
router.get('/:orderId', orderController.getOrderDetail);

module.exports = router;