// front/src/pages/AdminChatPage.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';
import './AdminChatPage.css';
import AdminLayout from '../components/AdminLayout';

const SOCKET_URL = 'http://localhost:5000';

function AdminChatPage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      alert('관리자 로그인이 필요합니다.');
      navigate('/admin/login');
      return;
    }

    // 소켓 연결
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('admin_new_chat', () => {
      fetchRooms();
    });

    fetchRooms();

    return () => {
      newSocket.disconnect();
    };
  }, [navigate]);

  // 실시간 메시지 수신 처리
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (data) => {
      // 현재 선택된 방의 메시지면 화면에 추가
      if (selectedRoom && data.room_id === selectedRoom.room_id) {
        setMessages(prev => [...prev, data]);
      }
      // 채팅방 목록 갱신 (마지막 메시지 업데이트)
      fetchRooms();
    };

    socket.on('receive_message', handleReceiveMessage);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
    };
  }, [socket, selectedRoom]);

  useEffect(() => {
    if (selectedRoom && socket) {
      socket.emit('join_room', selectedRoom.room_id);
      fetchMessages(selectedRoom.room_id);
    }
  }, [selectedRoom, socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${SOCKET_URL}/api/chat/admin/rooms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRooms(response.data.rooms);
    } catch (error) {
      console.error('채팅방 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (roomId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${SOCKET_URL}/api/chat/admin/rooms/${roomId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data.messages);
    } catch (error) {
      console.error('메시지 조회 실패:', error);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedRoom) return;

    const tempId = `temp_${Date.now()}_${Math.random()}`;
    const messageData = {
      room_id: selectedRoom.room_id,
      sender_type: 'admin',
      content: newMessage,
      created_at: new Date().toISOString(),
      temp_id: tempId
    };

    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(
        `${SOCKET_URL}/api/chat/admin/rooms/${selectedRoom.room_id}/messages`,
        { content: newMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (socket) {
        socket.emit('send_message', { ...messageData, temp_id: tempId });
      }

      setMessages(prev => [...prev, messageData]);
      setNewMessage('');
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      alert('메시지 전송에 실패했습니다.');
    }
  };

  const handleCloseChat = async (roomId) => {
    if (!window.confirm('이 채팅을 종료하시겠습니까?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(
        `${SOCKET_URL}/api/chat/admin/rooms/${roomId}/close`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchRooms();
      if (selectedRoom?.room_id === roomId) {
        setSelectedRoom(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('채팅 종료 실패:', error);
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
    return date.toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUnreadTotal = () => {
    return rooms.reduce((sum, room) => sum + (room.unread_count || 0), 0);
  };

  return (
    <AdminLayout>
      <div className="admin-header">
        <h1>💬 고객 상담</h1>
        <p>실시간으로 고객과 소통하세요</p>
      </div>

      <div className="chat-container">
        {/* 채팅방 목록 */}
        <div className="chat-room-list">
          <div className="room-list-header">
            <h3>상담 목록</h3>
            <span className="room-count">{rooms.length}건</span>
          </div>

          <div className="room-list-content">
            {loading ? (
              <div className="room-loading">로딩 중...</div>
            ) : rooms.length === 0 ? (
              <div className="no-rooms">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <p>상담 내역이 없습니다</p>
              </div>
            ) : (
              rooms.map(room => (
                <div
                  key={room.room_id}
                  className={`room-item ${selectedRoom?.room_id === room.room_id ? 'active' : ''} ${room.status}`}
                  onClick={() => setSelectedRoom(room)}
                >
                  <div className="room-avatar">
                    {room.user_name?.charAt(0) || '?'}
                  </div>
                  <div className="room-info">
                    <div className="room-header">
                      <span className="user-name">{room.user_name || '알 수 없음'}</span>
                      {room.unread_count > 0 && (
                        <span className="unread-badge">{room.unread_count}</span>
                      )}
                    </div>
                    <p className="last-message">{room.last_message || '새 대화'}</p>
                    <div className="room-footer">
                      <span className="room-time">{formatTime(room.updated_at)}</span>
                      <span className={`status-dot ${room.status}`}></span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 채팅 영역 */}
        <div className="chat-area">
          {selectedRoom ? (
            <>
              <div className="chat-area-header">
                <div className="chat-user-info">
                  <div className="chat-avatar">
                    {selectedRoom.user_name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <h3>{selectedRoom.user_name || '고객'}</h3>
                    <span>{selectedRoom.user_email}</span>
                  </div>
                </div>
                <div className="chat-actions">
                  {selectedRoom.status === 'active' && (
                    <button 
                      className="btn-close-chat"
                      onClick={() => handleCloseChat(selectedRoom.room_id)}
                    >
                      상담 종료
                    </button>
                  )}
                </div>
              </div>

              <div className="chat-messages">
                {messages.length === 0 ? (
                  <div className="no-messages">
                    <p>대화를 시작해보세요!</p>
                  </div>
                ) : (
                  messages.map((msg, index) => (
                    <div 
                      key={index} 
                      className={`chat-message ${msg.sender_type === 'admin' ? 'sent' : 'received'}`}
                    >
                      <div className="message-bubble">{msg.content}</div>
                      <div className="message-time">{formatTime(msg.created_at)}</div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {selectedRoom.status === 'active' ? (
                <div className="chat-input-area">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="메시지를 입력하세요..."
                    rows="1"
                  />
                  <button 
                    className="btn-send" 
                    onClick={handleSend}
                    disabled={!newMessage.trim()}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="chat-closed-notice">
                  이 상담은 종료되었습니다.
                </div>
              )}
            </>
          ) : (
            <div className="no-chat-selected">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              <h3>상담을 선택해주세요</h3>
              <p>왼쪽 목록에서 고객 상담을 선택하면<br/>대화 내용이 여기에 표시됩니다.</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminChatPage;