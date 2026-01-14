// backend/createAdmin.js
const bcrypt = require('bcryptjs');
const db = require('./config/database');

async function createAdmin() {
  try {
    const email = 'admin@test.com';
    const password = 'admin123';
    const name = 'Admin';

    // 비밀번호 해시 생성
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('생성할 관리자 정보:');
    console.log('이메일:', email);
    console.log('비밀번호:', password);
    console.log('해시:', hashedPassword);

    // 기존 계정 삭제
    await db.query('DELETE FROM admins WHERE email = ?', [email]);
    console.log('기존 계정 삭제 완료');

    // 새 계정 생성
    const [result] = await db.query(
      'INSERT INTO admins (email, password, name) VALUES (?, ?, ?)',
      [email, hashedPassword, name]
    );

    console.log('✅ 관리자 계정 생성 완료!');
    console.log('admin_id:', result.insertId);
    console.log('\n로그인 정보:');
    console.log('이메일: admin@test.com');
    console.log('비밀번호: admin123');

    process.exit(0);
  } catch (error) {
    console.error('❌ 에러 발생:', error);
    process.exit(1);
  }
}

createAdmin();