import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminOrderDetail.css';
import AdminLayout from '../components/AdminLayout';

function AdminOrderDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      alert('관리자 로그인이 필요합니다.');
      navigate('/admin/login');
      return;
    }
    fetchOrderDetail();
  }, [orderId, navigate]);

  const fetchOrderDetail = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`http://localhost:5000/api/admin/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrder(response.data.order);
    } catch (error) {
      console.error('주문 상세 조회 실패:', error);
      alert('주문 정보를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      pending: '결제 대기',
      paid: '결제 완료',
      shipping: '배송 중',
      delivered: '배송 완료',
      cancelled: '취소됨'
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="loading">로딩 중...</div>
      </AdminLayout>
    );
  }

  if (!order) {
    return (
      <AdminLayout>
        <div className="error">주문을 찾을 수 없습니다.</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="detail-header">
        <button className="btn-back" onClick={() => navigate('/admin/orders')}>
          ← 주문 목록
        </button>
        <h1>주문 상세 #{order.order_id}</h1>
      </div>

      <div className="detail-content">
        {/* 주문 정보 */}
        <div className="info-section">
          <h2>주문 정보</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>주문번호</label>
              <span>#{order.order_id}</span>
            </div>
            <div className="info-item">
              <label>주문일시</label>
              <span>{new Date(order.created_at).toLocaleString()}</span>
            </div>
            <div className="info-item">
              <label>주문상태</label>
              <span className={`status-badge ${order.status}`}>{getStatusText(order.status)}</span>
            </div>
            <div className="info-item">
              <label>총 금액</label>
              <span className="price">{(order.total_price || 0).toLocaleString()}원</span>
            </div>
          </div>
        </div>

        {/* 배송 정보 */}
        <div className="info-section">
          <h2>배송 정보</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>수령인</label>
              <span>{order.recipient_name}</span>
            </div>
            <div className="info-item">
              <label>연락처</label>
              <span>{order.recipient_phone}</span>
            </div>
            <div className="info-item full-width">
               <label>배송지</label>
               <span>{order.address}
               {order.detail_address && ` ${order.detail_address}`}</span>
            </div>
            {order.delivery_memo && (
              <div className="info-item full-width">
                <label>배송 메모</label>
                <span>{order.delivery_memo}</span>
              </div>
            )}
          </div>
        </div>

        {/* 주문 상품 */}
        <div className="info-section">
          <h2>주문 상품</h2>
          <table className="items-table">
            <thead>
              <tr>
                <th>상품명</th>
                <th>옵션</th>
                <th>수량</th>
                <th>가격</th>
              </tr>
            </thead>
            <tbody>
              {order.items && order.items.map((item, index) => (
                <tr key={index}>
                  <td>{item.product_name}</td>
                  <td>{item.option_value || '-'}</td>
                  <td>{item.quantity}개</td>
                  <td>{(item.price * item.quantity).toLocaleString()}원</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminOrderDetail;