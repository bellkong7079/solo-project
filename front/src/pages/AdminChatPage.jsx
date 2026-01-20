// front/src/pages/AdminChatPage.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';
import './AdminChatPage.css';
import AdminLayout from '../components/AdminLayout';

const SOCKET_URL = 'http://192.168.0.219:5000';

function AdminChatPage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);
  
  // 🆕 모달 관련 state
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [loadingCustomer, setLoadingCustomer] = useState(false);

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
      if (selectedRoom && data.room_id === selectedRoom.room_id) {
        setMessages(prev => [...prev, data]);
      }
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

  // 🆕 고객 정보 조회 및 모달 열기
  const openCustomerModal = async (userId) => {
    if (!userId) return;
    
    setShowCustomerModal(true);
    setLoadingCustomer(true);
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${SOCKET_URL}/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCustomerInfo(response.data.user);
      setCustomerOrders(response.data.orders || []);
    } catch (error) {
      console.error('고객 정보 조회 실패:', error);
      alert('고객 정보를 불러올 수 없습니다.');
      setShowCustomerModal(false);
    } finally {
      setLoadingCustomer(false);
    }
  };

  // 🆕 모달 닫기
  const closeCustomerModal = () => {
    setShowCustomerModal(false);
    setCustomerInfo(null);
    setCustomerOrders([]);
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { text: '결제대기', class: 'pending' },
      paid: { text: '결제완료', class: 'paid' },
      shipping: { text: '배송중', class: 'shipping' },
      delivered: { text: '배송완료', class: 'delivered' },
      cancelled: { text: '취소', class: 'cancelled' }
    };
    return statusMap[status] || { text: status, class: 'default' };
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
                  {/* 🆕 고객 정보 보기 버튼 */}
                  <button 
                    className="btn-customer-info"
                    onClick={() => openCustomerModal(selectedRoom.user_id)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                    고객 정보
                  </button>
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

      {/* 🆕 고객 정보 모달 */}
      {showCustomerModal && (
        <div className="modal-overlay" onClick={closeCustomerModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>고객 정보</h2>
              <button className="btn-modal-close" onClick={closeCustomerModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="modal-body">
              {loadingCustomer ? (
                <div className="modal-loading">
                  <div className="spinner"></div>
                  <p>로딩 중...</p>
                </div>
              ) : customerInfo ? (
                <>
                  {/* 고객 기본 정보 */}
                  <div className="customer-section">
                    <h3>기본 정보</h3>
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="info-label">이름</span>
                        <span className="info-value">{customerInfo.name}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">이메일</span>
                        <span className="info-value">{customerInfo.email}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">연락처</span>
                        <span className="info-value">{customerInfo.phone || '-'}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">가입일</span>
                        <span className="info-value">{formatDate(customerInfo.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* 구매 통계 */}
                  <div className="customer-section">
                    <h3>구매 통계</h3>
                    <div className="stats-grid">
                      <div className="stat-card">
                        <div className="stat-icon">📦</div>
                        <div className="stat-info">
                          <span className="stat-label">총 주문</span>
                          <span className="stat-value">{customerInfo.order_count}건</span>
                        </div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-icon">💰</div>
                        <div className="stat-info">
                          <span className="stat-label">총 구매액</span>
                          <span className="stat-value">{formatPrice(customerInfo.total_spent)}원</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 주문 내역 */}
                  <div className="customer-section">
                    <h3>주문 내역 ({customerOrders.length}건)</h3>
                    {customerOrders.length === 0 ? (
                      <div className="no-data">
                        <p>주문 내역이 없습니다</p>
                      </div>
                    ) : (
                      <div className="orders-list">
                        {customerOrders.map(order => {
                          const statusInfo = getStatusBadge(order.status);
                          return (
                            <div key={order.order_id} className="order-card">
                              <div className="order-card-header">
                                <span className="order-id">주문 #{order.order_id}</span>
                                <span className={`status-badge ${statusInfo.class}`}>
                                  {statusInfo.text}
                                </span>
                              </div>
                              
                              <div className="order-date-info">
                                {formatDate(order.created_at)}
                              </div>

                              {order.items && order.items.length > 0 && (
                                <div className="order-items-preview">
                                  {order.items.map((item, idx) => (
                                    <div key={idx} className="item-row">
                                      {item.product_image && (
                                        <img 
                                          src={`${SOCKET_URL}${item.product_image}`} 
                                          alt={item.product_name}
                                          className="item-thumbnail"
                                        />
                                      )}
                                      <div className="item-details">
                                        <span className="item-name">{item.product_name}</span>
                                        <span className="item-quantity">수량: {item.quantity}개</span>
                                      </div>
                                      <span className="item-price">
                                        {formatPrice(item.price * item.quantity)}원
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <div className="order-card-footer">
                                <span className="total-label">총 결제금액</span>
                                <span className="total-price">{formatPrice(order.total_price)}원</span>
                              </div>

                              <button
                                className="btn-view-order"
                                onClick={() => {
                                  closeCustomerModal();
                                  navigate(`/admin/orders/${order.order_id}`);
                                }}
                              >
                                주문 상세보기
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* 전체 보기 버튼 */}
                  {customerOrders.length > 0 && (
                    <button
                      className="btn-view-all-orders"
                      onClick={() => {
                        closeCustomerModal();
                        navigate(`/admin/users/${customerInfo.user_id}`);
                      }}
                    >
                      회원 상세 페이지로 이동
                    </button>
                  )}
                </>
              ) : (
                <div className="no-data">
                  <p>고객 정보를 불러올 수 없습니다</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminChatPage;