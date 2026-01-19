// back/routes/chat.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authUser } = require('../middlewares/auth');
const authMiddleware = require('../middlewares/authMiddleware');

// ==================== 사용자용 API ====================

// 채팅방 생성 또는 기존 채팅방 조회
router.post('/rooms', authUser, async (req, res) => {
  try {
    const userId = req.user.user_id;
    
    // 기존 활성 채팅방 확인
    const [existingRooms] = await db.query(
      `SELECT * FROM chat_rooms 
       WHERE user_id = ? AND status = 'active' 
       ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );

    if (existingRooms.length > 0) {
      return res.json({ room: existingRooms[0], isNew: false });
    }

    // 새 채팅방 생성
    const [result] = await db.query(
      `INSERT INTO chat_rooms (user_id, status) VALUES (?, 'active')`,
      [userId]
    );

    const [newRoom] = await db.query(
      'SELECT * FROM chat_rooms WHERE room_id = ?',
      [result.insertId]
    );

    res.status(201).json({ room: newRoom[0], isNew: true });

  } catch (error) {
    console.error('채팅방 생성 실패:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
});

// 채팅 메시지 조회
router.get('/rooms/:roomId/messages', authUser, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.user_id;

    // 권한 확인
    const [rooms] = await db.query(
      'SELECT * FROM chat_rooms WHERE room_id = ? AND user_id = ?',
      [roomId, userId]
    );

    if (rooms.length === 0) {
      return res.status(403).json({ message: '접근 권한이 없습니다.' });
    }

    const [messages] = await db.query(
      `SELECT * FROM chat_messages 
       WHERE room_id = ? 
       ORDER BY created_at ASC`,
      [roomId]
    );

    res.json({ messages });

  } catch (error) {
    console.error('메시지 조회 실패:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
});

// 메시지 전송
router.post('/rooms/:roomId/messages', authUser, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.user_id;
    const { content } = req.body;

    // 권한 확인
    const [rooms] = await db.query(
      'SELECT * FROM chat_rooms WHERE room_id = ? AND user_id = ?',
      [roomId, userId]
    );

    if (rooms.length === 0) {
      return res.status(403).json({ message: '접근 권한이 없습니다.' });
    }

    const [result] = await db.query(
      `INSERT INTO chat_messages (room_id, sender_type, sender_id, content) 
       VALUES (?, 'user', ?, ?)`,
      [roomId, userId, content]
    );

    // 채팅방 업데이트 시간 갱신
    await db.query(
      'UPDATE chat_rooms SET updated_at = NOW() WHERE room_id = ?',
      [roomId]
    );

    const [newMessage] = await db.query(
      'SELECT * FROM chat_messages WHERE message_id = ?',
      [result.insertId]
    );

    res.status(201).json({ message: newMessage[0] });

  } catch (error) {
    console.error('메시지 전송 실패:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
});

// ==================== 관리자용 API ====================

// 모든 채팅방 목록 조회
router.get('/admin/rooms', authMiddleware, async (req, res) => {
  try {
    const [rooms] = await db.query(`
      SELECT 
        cr.*,
        u.name as user_name,
        u.email as user_email,
        (SELECT content FROM chat_messages 
         WHERE room_id = cr.room_id 
         ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT COUNT(*) FROM chat_messages 
         WHERE room_id = cr.room_id AND sender_type = 'user' AND is_read = 0) as unread_count
      FROM chat_rooms cr
      LEFT JOIN users u ON cr.user_id = u.user_id
      ORDER BY cr.updated_at DESC
    `);

    res.json({ rooms });

  } catch (error) {
    console.error('채팅방 목록 조회 실패:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
});

// 관리자 - 특정 채팅방 메시지 조회
router.get('/admin/rooms/:roomId/messages', authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;

    const [messages] = await db.query(
      `SELECT * FROM chat_messages 
       WHERE room_id = ? 
       ORDER BY created_at ASC`,
      [roomId]
    );

    // 읽음 처리
    await db.query(
      `UPDATE chat_messages 
       SET is_read = 1 
       WHERE room_id = ? AND sender_type = 'user'`,
      [roomId]
    );

    res.json({ messages });

  } catch (error) {
    console.error('메시지 조회 실패:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
});

// 관리자 - 메시지 전송
router.post('/admin/rooms/:roomId/messages', authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;
    const adminId = req.user.admin_id;
    const { content } = req.body;

    const [result] = await db.query(
      `INSERT INTO chat_messages (room_id, sender_type, sender_id, content) 
       VALUES (?, 'admin', ?, ?)`,
      [roomId, adminId, content]
    );

    // 채팅방 업데이트 시간 갱신
    await db.query(
      'UPDATE chat_rooms SET updated_at = NOW() WHERE room_id = ?',
      [roomId]
    );

    const [newMessage] = await db.query(
      'SELECT * FROM chat_messages WHERE message_id = ?',
      [result.insertId]
    );

    res.status(201).json({ message: newMessage[0] });

  } catch (error) {
    console.error('메시지 전송 실패:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
});

// 관리자 - 채팅방 상태 변경 (종료)
router.put('/admin/rooms/:roomId/close', authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;

    await db.query(
      `UPDATE chat_rooms SET status = 'closed' WHERE room_id = ?`,
      [roomId]
    );

    res.json({ message: '채팅이 종료되었습니다.' });

  } catch (error) {
    console.error('채팅 종료 실패:', error);
    res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
});

module.exports = router;