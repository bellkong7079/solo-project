const jwt = require('jsonwebtoken');

// 사용자 인증 미들웨어
const authUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: '인증 토큰이 없습니다.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 🔍 디버깅 로그 추가
    console.log('🔑 디코딩된 사용자 토큰:', decoded);
    
    if (decoded.role !== 'user') {
      return res.status(403).json({ message: '사용자 권한이 없습니다.' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error('❌ 토큰 검증 실패:', error.message);
    return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
  }
};

// 관리자 인증 미들웨어
const authAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: '인증 토큰이 없습니다.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 🔍 디버깅 로그 추가
    console.log('🔑 디코딩된 관리자 토큰:', decoded);
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: '관리자 권한이 없습니다.' });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    console.error('❌ 관리자 토큰 검증 실패:', error.message);
    return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
  }
};

module.exports = { authUser, authAdmin };