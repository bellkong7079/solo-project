const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
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

// 비밀번호 찾기 - 이메일 전송
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    console.log('1. 요청 이메일:', email);

    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    console.log('2. 유저 조회 완료. 찾은 수:', users.length);

    if (users.length === 0) {
      return res.json({ message: '입력하신 이메일로 재설정 링크를 전송했습니다.' });
    }

    const user = users[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    console.log('3. 토큰 생성 완료');

    await db.query('DELETE FROM password_reset_tokens WHERE user_id = ?', [user.user_id]);
    console.log('4. 기존 토큰 삭제 완료');

    await db.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.user_id, token, expiresAt]
    );
    console.log('5. 새 토큰 저장 완료');

    const resetLink = `http://192.168.0.225:5173/reset-password?token=${token}`;

    // 이메일 전송 시도, 실패해도 링크는 콘솔에 출력
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      await transporter.sendMail({
        from: `"계절 쇼핑몰" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '[계절] 비밀번호 재설정 안내',
        html: `
          <div style="max-width:500px;margin:0 auto;font-family:sans-serif;">
            <h2 style="color:#1a1a1a;">비밀번호 재설정</h2>
            <p>안녕하세요, <strong>${user.name}</strong>님.</p>
            <p>비밀번호 재설정 요청이 접수되었습니다.<br>아래 버튼을 클릭하여 새 비밀번호를 설정해 주세요.</p>
            <p><strong>링크는 30분간 유효합니다.</strong></p>
            <a href="${resetLink}" style="display:inline-block;margin:20px 0;padding:14px 28px;background:#1a1a1a;color:#fff;text-decoration:none;font-weight:600;">
              비밀번호 재설정
            </a>
            <p style="color:#999;font-size:13px;">본인이 요청하지 않으셨다면 이 이메일을 무시해 주세요.</p>
          </div>
        `
      });
      console.log('✅ 이메일 전송 성공');
    } catch (mailError) {
      console.error('⚠️ 이메일 전송 실패 (링크는 정상 생성됨):', mailError.message);
      console.log('🔗 비밀번호 재설정 링크:', resetLink);
    }
    res.json({ message: '입력하신 이메일로 재설정 링크를 전송했습니다.' });

  } catch (error) {
    console.error('❌ 비밀번호 찾기 에러 발생 위치:', error.message);
    res.status(500).json({ message: '이메일 전송에 실패했습니다.' });
  }
};

// 비밀번호 재설정
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: '토큰과 새 비밀번호를 입력해주세요.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: '비밀번호는 6자 이상이어야 합니다.' });
    }

    // 유효한 토큰 확인
    const [tokens] = await db.query(
      `SELECT * FROM password_reset_tokens
       WHERE token = ? AND used = 0 AND expires_at > NOW()`,
      [token]
    );

    if (tokens.length === 0) {
      return res.status(400).json({ message: '유효하지 않거나 만료된 링크입니다.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.query(
      'UPDATE users SET password = ? WHERE user_id = ?',
      [hashedPassword, tokens[0].user_id]
    );

    // 토큰 사용 처리
    await db.query(
      'UPDATE password_reset_tokens SET used = 1 WHERE token = ?',
      [token]
    );

    res.json({ message: '비밀번호가 변경되었습니다. 새 비밀번호로 로그인해 주세요.' });

  } catch (error) {
    console.error('비밀번호 재설정 에러:', error);
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