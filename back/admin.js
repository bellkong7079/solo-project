const express = require('express');
const router = express.Router();
const { authAdmin } = require('../middlewares/auth');

// 관리자 인증 미들웨어 적용
router.use(authAdmin);

// 상품 관리
router.get('/products', getProducts);
router.post('/products', uploadImages, createProduct);
router.put('/products/:id', uploadImages, updateProduct);
router.delete('/products/:id', deleteProduct);

// 주문 관리
router.get('/orders', getOrders);
router.put('/orders/:id/status', updateOrderStatus);

// 회원 관리
router.get('/users', getUsers);

module.exports = router;