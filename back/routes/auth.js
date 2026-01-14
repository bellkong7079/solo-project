const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authUser } = require('../middlewares/auth');

// 회원가입
router.post('/signup', authController.signup);
router.post('/register', authController.signup);
// 로그인
router.post('/login', authController.login);

// 내 정보 조회 (로그인 필요)
router.get('/me', authUser, authController.getMe);

module.exports = router;