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


// 🆕 회원정보 수정
router.put('/me', authUser, authController.updateProfile);

// 🆕 회원 탈퇴
router.delete('/me', authUser, authController.deleteAccount);

module.exports = router;