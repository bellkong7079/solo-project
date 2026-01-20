import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import './MyPage.css';

function MyPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'info'

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    fetchUserData();
    fetchOrders();
  }, []);

  const fetchUserData = async () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('사용자 정보 로드 실패:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/orders');
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('주문 내역 조회 실패:', error);
      if (error.response?.status === 401) {
        alert('로그인이 필요합니다.');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
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

  const openChat = () => {
    // ChatWidget 열기 (ChatWidget이 전역으로 열리도록)
    const chatButton = document.querySelector('.chat-widget-button');
    if (chatButton) {
      chatButton.click();
    } else {
      alert('채팅 기능을 사용할 수 없습니다.');
    }
  };

  // 🆕 주문 취소
  const handleCancelOrder = async (orderId, orderStatus) => {
    // 취소 가능한 상태 확인
    if (orderStatus !== 'pending' && orderStatus !== 'paid') {
      alert('배송 준비 중이거나 배송이 시작된 주문은 취소할 수 없습니다.\n고객센터에 문의해주세요.');
      return;
    }

    if (!window.confirm('주문을 취소하시겠습니까?')) {
      return;
    }

    try {
      await axios.delete(`/orders/${orderId}`);
      alert('주문이 취소되었습니다.');
      fetchOrders(); // 주문 목록 새로고침
    } catch (error) {
      alert(error.response?.data?.message || '주문 취소에 실패했습니다.');
    }
  };

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  return (
    <div className="mypage">
      <div className="container">
        <div className="mypage-layout">
          {/* 사이드바 */}
          <aside className="mypage-sidebar">
            <div className="user-profile">
              <div className="user-avatar">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="user-info">
                <h3>{user?.name || '사용자'}님</h3>
                <p>{user?.email}</p>
              </div>
            </div>

            <nav className="mypage-nav">
              <button
                className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
                onClick={() => setActiveTab('orders')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
                주문 내역
              </button>

              <Link to="/profile" className="nav-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                회원정보 수정
              </Link>

              <button className="nav-item" onClick={openChat}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                1:1 문의
              </button>
            </nav>
          </aside>

          {/* 메인 콘텐츠 */}
          <main className="mypage-content">
            {activeTab === 'orders' && (
              <div className="orders-section">
                <div className="section-header">
                  <h2>주문 내역</h2>
                  <span className="order-count">총 {orders.length}건</span>
                </div>

                {orders.length === 0 ? (
                  <div className="empty-orders">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                      <rect x="3" y="3" width="7" height="7"></rect>
                      <rect x="14" y="3" width="7" height="7"></rect>
                      <rect x="14" y="14" width="7" height="7"></rect>
                      <rect x="3" y="14" width="7" height="7"></rect>
                    </svg>
                    <h3>주문 내역이 없습니다</h3>
                    <p>쇼핑을 시작해보세요!</p>
                    <Link to="/products" className="btn btn-primary">
                      상품 보러가기
                    </Link>
                  </div>
                ) : (
                  <div className="orders-list">
                    {orders.map(order => {
                      const statusInfo = getStatusBadge(order.status);
                      return (
                        <div key={order.order_id} className="order-card">
                          <div className="order-header">
                            <div className="order-date">
                              {formatDate(order.created_at)}
                            </div>
                            <span className={`status-badge ${statusInfo.class}`}>
                              {statusInfo.text}
                            </span>
                          </div>

                          <div className="order-info">
                            <div className="order-number">
                              주문번호: {order.order_id}
                            </div>
                            <div className="order-items-count">
                              {order.item_count || 1}개 상품
                            </div>
                          </div>

                          <div className="order-footer">
                            <div className="order-total">
                              <span className="total-label">총 결제금액</span>
                              <span className="total-price">
                                {formatPrice(order.total_price)}원
                              </span>
                            </div>
                            <div className="order-actions">
                              <Link 
                                to={`/orders/${order.order_id}`} 
                                className="btn btn-outline"
                              >
                                상세보기
                              </Link>
                              {/* 🆕 취소 가능한 상태일 때만 취소 버튼 표시 */}
                              {(order.status === 'pending' || order.status === 'paid') && (
                                <button 
                                  className="btn btn-cancel"
                                  onClick={() => handleCancelOrder(order.order_id, order.status)}
                                >
                                  주문취소
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default MyPage;