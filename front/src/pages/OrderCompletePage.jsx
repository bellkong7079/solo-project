import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from '../utils/axios';
import './OrderCompletePage.css';

function OrderCompletePage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }
    fetchOrderDetail();
  }, [orderId, navigate]);

  const fetchOrderDetail = async () => {
    try {
      const response = await axios.get(`/orders/${orderId}`);
      setOrder(response.data.order);
    } catch (error) {
      console.error('주문 조회 실패:', error);
      alert('주문 정보를 불러올 수 없습니다.');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  if (!order) {
    return <div className="error">주문 정보를 찾을 수 없습니다.</div>;
  }

  return (
    <div className="order-complete-page">
      <div className="container">
        <div className="complete-card">
          {/* 체크 아이콘 */}
          <div className="success-icon">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>

          <h1 className="complete-title">주문이 완료되었습니다!</h1>
          <p className="complete-subtitle">
            주문번호: <strong>#{order.order_id}</strong>
          </p>

          {/* 주문 정보 */}
          <div className="order-summary-box">
            <div className="summary-row">
              <span>주문 금액</span>
              <span className="price">{(order.total_price || 0).toLocaleString()}원</span>
            </div>
            <div className="summary-row">
              <span>주문 상태</span>
              <span className="status-badge pending">결제 대기</span>
            </div>
          </div>

          {/* 배송 정보 */}
          <div className="delivery-info">
            <h3>배송 정보</h3>
            <div className="info-row">
              <span className="label">받는 사람</span>
              <span>{order.recipient_name}</span>
            </div>
            <div className="info-row">
              <span className="label">연락처</span>
              <span>{order.recipient_phone}</span>
            </div>
            <div className="info-row">
              <span className="label">배송지</span>
              <span>
                {order.postal_code && `[${order.postal_code}] `}
                {order.address}
                {order.detail_address && ` ${order.detail_address}`}
              </span>
            </div>
            {order.message && (
              <div className="info-row">
                <span className="label">배송 메시지</span>
                <span>{order.message}</span>
              </div>
            )}
          </div>

          {/* 주문 상품 */}
          <div className="ordered-items">
            <h3>주문 상품 ({order.items?.length || 0}개)</h3>
            <div className="items-list">
              {order.items?.map((item, index) => (
                <div key={index} className="order-item">
                  <img 
                    src={item.thumbnail 
                      ? `http://192.168.0.219:5000${item.thumbnail}`
                      : 'https://via.placeholder.com/80'
                    } 
                    alt={item.product_name} 
                  />
                  <div className="item-info">
                    <h4>{item.product_name}</h4>
                    {item.option_value && (
                      <p className="option">{item.option_name}: {item.option_value}</p>
                    )}
                    <p className="quantity">수량: {item.quantity}개</p>
                  </div>
                  <div className="item-price">
                    {(Number(item.price) * Number(item.quantity)).toLocaleString()}원
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 버튼 */}
          <div className="action-buttons">
            <Link to="/" className="btn btn-secondary btn-large">
              홈으로
            </Link>
            <Link to="/products" className="btn btn-primary btn-large">
              쇼핑 계속하기
            </Link>
          </div>

          <p className="notice">
            주문 내역은 마이페이지에서 확인하실 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}

export default OrderCompletePage;