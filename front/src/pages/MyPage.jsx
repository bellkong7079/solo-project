import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './MyPage.css';

const API_URL = 'http://192.168.0.219:5000/api';

function MyPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    fetchUserData();
    fetchOrders();
  }, [navigate]);

  const fetchUserData = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data.user);
    } catch (error) {
      console.error('사용자 정보 조회 실패:', error);
    }
  };

  const fetchOrders = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`${API_URL}/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('주문 내역 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 등급별 아이콘
  const getTierIcon = (tier) => {
    switch(tier) {
      case 'VIP': return '💎';
      case '골드': return '🥇';
      case '실버': return '🥈';
      case '브론즈': return '🥉';
      default: return '👤';
    }
  };

  // 등급별 색상 클래스
  const getTierClass = (tier) => {
    switch(tier) {
      case 'VIP': return 'tier-vip';
      case '골드': return 'tier-gold';
      case '실버': return 'tier-silver';
      case '브론즈': return 'tier-bronze';
      default: return 'tier-normal';
    }
  };

  // 다음 등급까지 필요한 금액
  const getNextTierInfo = (currentSpent, tier) => {
    const thresholds = {
      '일반': { next: '브론즈', amount: 200000 },
      '브론즈': { next: '실버', amount: 400000 },
      '실버': { next: '골드', amount: 800000 },
      '골드': { next: 'VIP', amount: 1500000 },
      'VIP': { next: null, amount: 0 }
    };

    const info = thresholds[tier] || thresholds['일반'];
    const remaining = info.amount - currentSpent;
    const progress = (currentSpent / info.amount) * 100;

    return {
      nextTier: info.next,
      nextAmount: info.amount,
      remaining: remaining > 0 ? remaining : 0,
      progress: progress > 100 ? 100 : progress
    };
  };

  // 등급별 혜택 목록
  const getTierBenefits = (tier) => {
    const benefits = {
      'VIP': [
        '무료 배송 (무제한)',
        '10% 상시 할인',
        '신상품 우선 구매',
        '??? 쿠폰 30,000원'
      ],
      '골드': [
        '5만원 이상 무료 배송',
        '5% 상시 할인',
        '??? 쿠폰 15,000원'
      ],
      '실버': [
        '7만원 이상 무료 배송',
        '3% 할인 쿠폰',
        '??? 쿠폰 10,000원'
      ],
      '브론즈': [
        '무료 배송 쿠폰 (월 1회)',
        '??? 쿠폰 5,000원'
      ],
      '일반': [
        '3만원 이상 무료 배송'
      ]
    };

    return benefits[tier] || benefits['일반'];
  };

  const getStatusText = (status) => {
    const statusMap = {
      'pending': '결제 대기',
      'paid': '결제 완료',
      'preparing': '상품 준비중',
      'shipping': '배송중',
      'delivered': '배송 완료',
      'cancelled': '주문 취소'
    };
    return statusMap[status] || status;
  };

  const getStatusClass = (status) => {
    if (status === 'delivered') return 'status-delivered';
    if (status === 'cancelled') return 'status-cancelled';
    if (status === 'shipping') return 'status-shipping';
    return 'status-preparing';
  };

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  const nextTierInfo = user?.tier ? getNextTierInfo(user.total_spent || 0, user.tier) : null;

  return (
    <div className="mypage-container">
      <div className="mypage-content">
        <h1>마이페이지</h1>

        {/* 🆕 등급 정보 섹션 */}
        {user && (
          <div className="tier-info-section">
            <div className="tier-info-header">
              <h2>회원 등급</h2>
              <Link to="/membership-benefits" className="view-benefits-link">
                등급별 혜택 보기 →
              </Link>
            </div>

            <div className="tier-info-grid">
              {/* 현재 등급 */}
              <div className="tier-card current-tier">
                <h3>현재 등급</h3>
                <div className={`tier-badge-large ${getTierClass(user.tier)}`}>
                  <span className="tier-icon">{getTierIcon(user.tier)}</span>
                  <span className="tier-name">{user.tier}</span>
                </div>
                <p className="total-spent">
                  누적 구매: <strong>{(user.total_spent || 0).toLocaleString()}원</strong>
                </p>
              </div>

              {/* 현재 등급 혜택 */}
              <div className="tier-card tier-benefits-card">
                <h3>현재 등급 혜택</h3>
                <ul className="benefits-list">
                  {getTierBenefits(user.tier).map((benefit, index) => (
                    <li key={index}>
                      <span className="check-icon">✅</span>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>

              {/* 다음 등급까지 */}
              {nextTierInfo?.nextTier && (
                <div className="tier-card next-tier-card">
                  <h3>다음 등급까지</h3>
                  <div className="next-tier-info">
                    <div className="next-tier-name">
                      <span className="tier-icon">{getTierIcon(nextTierInfo.nextTier)}</span>
                      <span>{nextTierInfo.nextTier}</span>
                    </div>
                    <p className="remaining-amount">
                      <strong>{nextTierInfo.remaining.toLocaleString()}원</strong> 남음
                    </p>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${nextTierInfo.progress}%` }}
                      ></div>
                    </div>
                    <p className="progress-text">
                      {nextTierInfo.progress.toFixed(1)}% 달성
                    </p>
                  </div>
                </div>
              )}

              {user.tier === 'VIP' && (
                <div className="tier-card vip-message">
                  <h3>🎉 최고 등급 달성!</h3>
                  <p>VIP 회원님께 특별한 혜택을 제공합니다.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 사용자 정보 */}
        <div className="user-info-section">
          <div className="section-header">
            <h2>회원 정보</h2>
            <Link to="/profile" className="edit-button">수정</Link>
          </div>
          <div className="user-info-grid">
            <div className="info-item">
              <span className="label">이름</span>
              <span className="value">{user?.name}</span>
            </div>
            <div className="info-item">
              <span className="label">이메일</span>
              <span className="value">{user?.email}</span>
            </div>
            <div className="info-item">
              <span className="label">연락처</span>
              <span className="value">{user?.phone || '-'}</span>
            </div>
          </div>
        </div>

        {/* 주문 내역 */}
        <div className="orders-section">
          <h2>주문 내역</h2>
          {orders.length === 0 ? (
            <div className="empty-orders">
              <p>주문 내역이 없습니다.</p>
              <Link to="/products" className="shop-button">쇼핑하러 가기</Link>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map((order) => (
                <Link 
                  key={order.order_id} 
                  to={`/orders/${order.order_id}`}
                  className="order-card"
                >
                  <div className="order-header">
                    <span className="order-date">
                      {new Date(order.created_at).toLocaleDateString('ko-KR')}
                    </span>
                    <span className={`order-status ${getStatusClass(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                  <div className="order-info">
                    <span className="order-number">주문번호: {order.order_id}</span>
                    <span className="order-total">{order.total_price?.toLocaleString()}원</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MyPage;