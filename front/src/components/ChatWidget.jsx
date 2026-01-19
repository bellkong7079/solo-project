// front/src/components/ChatWidget.jsx
import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from '../utils/axios';
import './ChatWidget.css';

const SOCKET_URL = 'http://192.168.0.219:5000';

function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  useEffect(() => {
    if (isOpen && isLoggedIn) {
      const newSocket = io(SOCKET_URL);
      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('🔌 [User] 소켓 연결 완료:', newSocket.id);
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [isOpen, isLoggedIn]);

  // room이 설정되면 자동으로 join
  useEffect(() => {
    if (socket && room) {
      console.log('🚪 [User] 방 입장:', room.room_id);
      socket.emit('join_room', room.room_id);
    }
  }, [socket, room]);

  // 실시간 메시지 수신 처리
  useEffect(() => {
    if (!socket || !room) return;

    const handleReceiveMessage = (data) => {
      console.log('📥 [User] 메시지 수신:', data);
      
      if (data.room_id === room.room_id) {
        console.log('✅ [User] 현재 방의 메시지 - 화면에 추가');
        setMessages(prev => [...prev, data]);
      } else {
        console.log('⚠️ [User] 다른 방의 메시지 - 무시');
      }
    };

    socket.on('receive_message', handleReceiveMessage);
    console.log('👂 [User] 메시지 수신 리스너 등록');

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      console.log('🔇 [User] 메시지 수신 리스너 해제');
    };
  }, [socket, room]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleOpen = async () => {
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.');
      window.location.href = '/login';
      return;
    }

    setIsOpen(true);
    setLoading(true);

    try {
      // 채팅방 생성 또는 조회
      const roomRes = await axios.post('/chat/rooms');
      setRoom(roomRes.data.room);

      // 기존 메시지 조회
      const msgRes = await axios.get(`/chat/rooms/${roomRes.data.room.room_id}/messages`);
      setMessages(msgRes.data.messages);

      // 새 채팅방이면 관리자에게 알림
      if (roomRes.data.isNew && socket) {
        socket.emit('new_chat_request', {
          room_id: roomRes.data.room.room_id,
          user_id: roomRes.data.room.user_id
        });
      }

    } catch (error) {
      console.error('채팅 초기화 실패:', error);
      alert('채팅을 시작할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !room) return;

    const tempId = `temp_${Date.now()}_${Math.random()}`;
    const messageData = {
      room_id: room.room_id,
      sender_type: 'user',
      content: newMessage,
      created_at: new Date().toISOString(),
      temp_id: tempId
    };

    console.log('📤 [User] 메시지 전송 시도:', messageData);

    try {
      // API로 메시지 저장
      await axios.post(`/chat/rooms/${room.room_id}/messages`, {
        content: newMessage
      });

      // 소켓으로 실시간 전송
      if (socket) {
        console.log('🔌 [User] 소켓으로 메시지 전송:', messageData);
        socket.emit('send_message', { ...messageData, temp_id: tempId });
      } else {
        console.log('❌ [User] 소켓이 연결되지 않음!');
      }

      setMessages(prev => [...prev, messageData]);
      setNewMessage('');

    } catch (error) {
      console.error('❌ [User] 메시지 전송 실패:', error);
      alert('메시지 전송에 실패했습니다.');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="chat-widget">
      {/* 채팅 버튼 */}
      {!isOpen && (
        <button className="chat-toggle-btn" onClick={handleOpen}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <span>고객센터</span>
        </button>
      )}

      {/* 채팅 창 */}
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <div className="chat-header-info">
              <div className="chat-status-dot"></div>
              <span>고객센터</span>
            </div>
            <button className="chat-close-btn" onClick={() => setIsOpen(false)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div className="chat-messages">
            {loading ? (
              <div className="chat-loading">로딩 중...</div>
            ) : messages.length === 0 ? (
              <div className="chat-welcome">
                <div className="welcome-icon">💬</div>
                <h3>안녕하세요!</h3>
                <p>무엇을 도와드릴까요?<br/>메시지를 보내주시면 빠르게 답변드리겠습니다.</p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`chat-message ${msg.sender_type === 'user' ? 'sent' : 'received'}`}
                >
                  <div className="message-content">{msg.content}</div>
                  <div className="message-time">{formatTime(msg.created_at)}</div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-area">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="메시지를 입력하세요..."
              rows="1"
            />
            <button 
              className="chat-send-btn" 
              onClick={handleSend}
              disabled={!newMessage.trim()}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatWidget;