const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();

// HTTP 서버 생성
const server = http.createServer(app);

// Socket.IO 설정
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// 미들웨어
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 제공 (업로드된 이미지)
app.use('/uploads', express.static('uploads'));

// 라우트 등록
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/products', require('./routes/products'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/categories', require('./routes/categories'));

// 기본 라우트
app.get('/', async (req, res) => {
  res.json({ message: '패션 쇼핑몰 API 서버' });
});

// Socket.IO 연결 처리
io.on('connection', (socket) => {
  console.log('✅ 사용자 연결:', socket.id);

  // 채팅방 입장
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`사용자 ${socket.id}가 방 ${roomId}에 입장`);
  });

  // 메시지 전송 (수정된 부분)
  socket.on('send_message', (data) => {
    // temp_id 제거 (상대방에게는 필요없음)
    const messageToSend = { ...data };
    delete messageToSend.temp_id;
    
    // 본인을 제외한 같은 방의 다른 사람들에게만 전송
    socket.to(data.room_id).emit('receive_message', messageToSend);
    
    console.log(`메시지 전송: 방 ${data.room_id}, 발신자: ${data.sender_type}`);
  });

  // 관리자 알림
  socket.on('new_chat_request', (data) => {
    io.emit('admin_new_chat', data);
  });

  socket.on('disconnect', () => {
    console.log('❌ 사용자 연결 해제:', socket.id);
  });
});

// 에러 핸들링
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: '서버 에러가 발생했습니다.' });
});

// 서버 시작
const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ 서버가 포트 ${PORT}에서 실행중입니다.`);
});