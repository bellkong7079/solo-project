const express = require('express');
const router = express.Router();
const { authAdmin } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const adminController = require('../controllers/adminController');

// 관리자 로그인 (인증 불필요)
router.post('/login', adminController.login);

// 아래부터는 관리자 인증 필요
router.use(authAdmin);

// 상품 관리
router.get('/products', adminController.getProducts);
router.post('/products', upload.array('images', 5), adminController.createProduct);
router.put('/products/:id', upload.array('images', 5), adminController.updateProduct);
router.delete('/products/:id', adminController.deleteProduct);

// 카테고리 관리
router.get('/categories', adminController.getCategories);
router.post('/categories', adminController.createCategory);

module.exports = router;