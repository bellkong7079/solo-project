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
      'INSERT INTO users (email, password, name, phone, created_at) VALUES (?, ?, ?, ?, NOW())',
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
        name,
        phone: phone || null
      }
    });

  } catch (error) {
    console.error('회원가입 에러:', error);
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
        name: user.name,
        phone: user.phone
      }
    });

  } catch (error) {
    console.error('로그인 에러:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
};

// authController.js의 getMe 함수 수정

// authController.js의 getMe 함수 (완전 수정판)

// authController.js의 getMe 함수 (완전 수정판 v2)

exports.getMe = async (req, res) => {
  try {
    console.log('===== getMe 요청 시작 =====');
    console.log('req.user:', req.user); // 🔍 디버깅
    
    // userId 가져오기 (여러 가능성 체크)
    const userId = req.user?.userId || req.user?.user_id || req.user?.id;
    
    if (!userId) {
      console.error('❌ userId를 찾을 수 없음:', req.user);
      return res.status(401).json({ message: '인증 정보가 없습니다.' });
    }
    
    console.log('User ID:', userId);

    // 1. 기본 사용자 정보 조회 (address, address_detail 제거)
    const [users] = await db.query(
      'SELECT user_id, email, name, phone, created_at FROM users WHERE user_id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    const user = users[0];
    console.log('기본 사용자 정보 조회 성공:', user.name);

    // 2. 총 구매액 계산 (별도 쿼리)
    const [orderStats] = await db.query(`
      SELECT COALESCE(SUM(total_price), 0) as total_spent
      FROM orders
      WHERE user_id = ? AND status != 'cancelled'
    `, [userId]);

    const totalSpent = Number(orderStats[0]?.total_spent || 0);
    console.log('총 구매액:', totalSpent);

    // 3. 등급 계산
    let tier = '일반';
    if (totalSpent >= 1500000) tier = 'VIP';
    else if (totalSpent >= 800000) tier = '골드';
    else if (totalSpent >= 400000) tier = '실버';
    else if (totalSpent >= 200000) tier = '브론즈';
    
    console.log('계산된 등급:', tier);

    // 4. 응답
    res.json({
      user: {
        ...user,
        total_spent: totalSpent,
        tier: tier
      }
    });

    console.log('===== getMe 응답 성공 =====');

  } catch (error) {
    console.error('❌ getMe 에러:', error);
    console.error('에러 상세:', error.message);
    
    res.status(500).json({ 
      message: '서버 에러가 발생했습니다.',
      error: error.message 
    });
  }
};

// 🆕 회원정보 수정
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { name, phone, currentPassword, newPassword } = req.body;

    // 현재 사용자 정보 조회
    const [users] = await db.query('SELECT * FROM users WHERE user_id = ?', [userId]);
    
    if (users.length === 0) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    const user = users[0];

    // 비밀번호 변경을 원하는 경우
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: '현재 비밀번호를 입력해주세요.' });
      }

      // 현재 비밀번호 확인
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: '현재 비밀번호가 틀렸습니다.' });
      }

      // 새 비밀번호 길이 확인
      if (newPassword.length < 6) {
        return res.status(400).json({ message: '새 비밀번호는 6자 이상이어야 합니다.' });
      }

      // 새 비밀번호 해시
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // 비밀번호 포함 업데이트
      await db.query(
        'UPDATE users SET name = ?, phone = ?, password = ?, updated_at = NOW() WHERE user_id = ?',
        [name || user.name, phone || user.phone, hashedPassword, userId]
      );
    } else {
      // 비밀번호 변경 없이 이름/전화번호만 수정
      await db.query(
        'UPDATE users SET name = ?, phone = ?, updated_at = NOW() WHERE user_id = ?',
        [name || user.name, phone || user.phone, userId]
      );
    }

    // 업데이트된 사용자 정보 조회
    const [updatedUsers] = await db.query(
      'SELECT user_id, email, name, phone, created_at FROM users WHERE user_id = ?',
      [userId]
    );

    res.json({ 
      message: '회원정보가 수정되었습니다.',
      user: updatedUsers[0]
    });

  } catch (error) {
    console.error('회원정보 수정 에러:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
};

// 🆕 회원 탈퇴
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: '비밀번호를 입력해주세요.' });
    }

    // 현재 사용자 정보 조회
    const [users] = await db.query('SELECT * FROM users WHERE user_id = ?', [userId]);
    
    if (users.length === 0) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    const user = users[0];

    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: '비밀번호가 틀렸습니다.' });
    }

    // 사용자 삭제
    await db.query('DELETE FROM users WHERE user_id = ?', [userId]);

    res.json({ message: '회원 탈퇴가 완료되었습니다.' });

  } catch (error) {
    console.error('회원 탈퇴 에러:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
};