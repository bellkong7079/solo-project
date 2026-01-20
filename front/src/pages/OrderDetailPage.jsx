import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from '../utils/axios';
import './OrderDetailPage.css';

function OrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    fetchOrderDetail();
  }, [orderId]);

  const fetchOrderDetail = async () => {
    try {
      const response = await axios.get(`/orders/${orderId}`);
      setOrder(response.data.order);
      setOrderItems(response.data.items || []);
    } catch (error) {
      console.error('주문 상세 조회 실패:', error);
      if (error.response?.status === 401) {
        alert('로그인이 필요합니다.');
        navigate('/login');
      } else if (error.response?.status === 404) {
        alert('주문을 찾을 수 없습니다.');
        navigate('/mypage');
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  // 🆕 주문 취소
  const handleCancelOrder = async () => {
    if (order.status !== 'pending' && order.status !== 'paid') {
      alert('배송 준비 중이거나 배송이 시작된 주문은 취소할 수 없습니다.\n고객센터에 문의해주세요.');
      return;
    }

    if (!window.confirm('주문을 취소하시겠습니까?')) {
      return;
    }

    try {
      await axios.delete(`/orders/${orderId}`);
      alert('주문이 취소되었습니다.');
      navigate('/mypage');
    } catch (error) {
      alert(error.response?.data?.message || '주문 취소에 실패했습니다.');
    }
  };

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  if (!order) {
    return (
      <div className="error-page">
        <h2>주문을 찾을 수 없습니다</h2>
        <Link to="/mypage" className="btn btn-primary">마이페이지로 돌아가기</Link>
      </div>
    );
  }

  const statusInfo = getStatusBadge(order.status);

  return (
    <div className="order-detail-page">
      <div className="container">
        <div className="page-header">
          <button onClick={() => navigate(-1)} className="btn-back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            돌아가기
          </button>
          <h1>주문 상세</h1>
          {/* 🆕 취소 가능한 상태일 때만 취소 버튼 표시 */}
          {(order.status === 'pending' || order.status === 'paid') && (
            <button onClick={handleCancelOrder} className="btn btn-cancel-order">
              주문 취소
            </button>
          )}
        </div>

        <div className="order-detail-container">
          {/* 주문 정보 */}
          <section className="detail-section">
            <h2 className="section-title">주문 정보</h2>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">주문번호</span>
                <span className="info-value">{order.order_id}</span>
              </div>
              <div className="info-item">
                <span className="info-label">주문일시</span>
                <span className="info-value">{formatDate(order.created_at)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">주문상태</span>
                <span className={`status-badge ${statusInfo.class}`}>
                  {statusInfo.text}
                </span>
              </div>
            </div>
          </section>

          {/* 주문 상품 */}
          <section className="detail-section">
            <h2 className="section-title">주문 상품</h2>
            <div className="order-items-list">
              {orderItems.map((item, index) => (
                <div key={index} className="order-item">
                  <div className="item-image">
                    <img 
                      src={item.thumbnail 
                        ? `http://192.168.0.219:5000${item.thumbnail}` 
                        : 'https://via.placeholder.com/100'
                      } 
                      alt={item.name}
                    />
                  </div>
                  <div className="item-info">
                    <Link to={`/products/${item.product_id}`} className="item-name">
                      {item.name}
                    </Link>
                    {item.option_value && (
                      <p className="item-option">
                        {item.option_name}: {item.option_value}
                      </p>
                    )}
                    <p className="item-quantity">수량: {item.quantity}개</p>
                  </div>
                  <div className="item-price">
                    {formatPrice(item.price * item.quantity)}원
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 배송지 정보 */}
          <section className="detail-section">
            <h2 className="section-title">배송지 정보</h2>
            <div className="delivery-info">
              <div className="info-row">
                <span className="label">받는 사람</span>
                <span className="value">{order.recipient_name}</span>
              </div>
              <div className="info-row">
                <span className="label">연락처</span>
                <span className="value">{order.recipient_phone}</span>
              </div>
              <div className="info-row">
                <span className="label">배송주소</span>
                <span className="value">
                  ({order.postal_code}) {order.address} {order.address_detail}
                </span>
              </div>
              {order.delivery_memo && (
                <div className="info-row">
                  <span className="label">배송메모</span>
                  <span className="value">{order.delivery_memo}</span>
                </div>
              )}
            </div>
          </section>

          {/* 결제 정보 */}
          <section className="detail-section">
            <h2 className="section-title">결제 정보</h2>
            <div className="payment-summary">
              <div className="summary-row">
                <span>상품 금액</span>
                <span>{formatPrice(order.total_price)}원</span>
              </div>
              <div className="summary-row">
                <span>배송비</span>
                <span>{order.total_price >= 50000 ? '무료' : '3,000원'}</span>
              </div>
              <div className="summary-divider"></div>
              <div className="summary-row total">
                <span>총 결제금액</span>
                <span className="total-price">{formatPrice(order.total_price)}원</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default OrderDetailPage;