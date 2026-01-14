const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

// 회원가입
exports.signup = async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;

    // 이메일 중복 확인
    const [existingUsers] = await db.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: '이미 사용중인 이메일입니다.' });
    }

    // 비밀번호 해시
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 생성
    const [result] = await db.query(
      'INSERT INTO users (email, password, name, phone) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, name, phone || null]
    );

    // JWT 토큰 생성
    const token = jwt.sign(
      { 
        user_id: result.insertId, 
        email: email,
        role: 'user'
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: '회원가입이 완료되었습니다.',
      token,
      user: {
        user_id: result.insertId,
        email,
        name
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
};

// 로그인
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 사용자 조회
    const [users] = await db.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: '이메일 또는 비밀번호가 잘못되었습니다.' });
    }

    const user = users[0];

    // 비밀번호 확인
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: '이메일 또는 비밀번호가 잘못되었습니다.' });
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      { 
        user_id: user.user_id, 
        email: user.email,
        role: 'user'
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: '로그인 성공',
      token,
      user: {
        user_id: user.user_id,
        email: user.email,
        name: user.name
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
};

// 내 정보 조회
exports.getMe = async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT user_id, email, name, phone, created_at FROM users WHERE user_id = ?',
      [req.user.user_id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    res.json({ user: users[0] });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
};