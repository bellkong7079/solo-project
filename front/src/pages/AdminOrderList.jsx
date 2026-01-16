import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminOrderList.css';

function AdminOrderList() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, paid, shipping, delivered

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      alert('관리자 로그인이 필요합니다.');
      navigate('/admin/login');
      return;
    }
    fetchOrders();
  }, [navigate]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('http://192.168.0.219:5000/api/admin/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data.orders);
    } catch (error) {
      console.error('주문 조회 실패:', error);
      alert('주문 목록을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    if (!window.confirm('주문 상태를 변경하시겠습니까?')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(
        `http://192.168.0.219:5000/api/admin/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('상태가 변경되었습니다.');
      fetchOrders();
    } catch (error) {
      console.error('상태 변경 실패:', error);
      alert('상태 변경에 실패했습니다.');
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

  const getStatusClass = (status) => {
    return status;
  };

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(order => order.status === filter);

  if (loading) {
    return (
      <div className="admin-order-list">
        <div className="loading">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="admin-order-list">
      <div className="list-header">
        <h1>주문 관리</h1>
        <div className="header-actions">
          <button className="btn-back" onClick={() => navigate('/admin/dashboard')}>
            ← 대시보드
          </button>
        </div>
      </div>

      {/* 필터 */}
      <div className="filter-tabs">
        <button 
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          전체 ({orders.length})
        </button>
        <button 
          className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          결제 대기 ({orders.filter(o => o.status === 'pending').length})
        </button>
        <button 
          className={`filter-tab ${filter === 'paid' ? 'active' : ''}`}
          onClick={() => setFilter('paid')}
        >
          결제 완료 ({orders.filter(o => o.status === 'paid').length})
        </button>
        <button 
          className={`filter-tab ${filter === 'shipping' ? 'active' : ''}`}
          onClick={() => setFilter('shipping')}
        >
          배송 중 ({orders.filter(o => o.status === 'shipping').length})
        </button>
        <button 
          className={`filter-tab ${filter === 'delivered' ? 'active' : ''}`}
          onClick={() => setFilter('delivered')}
        >
          배송 완료 ({orders.filter(o => o.status === 'delivered').length})
        </button>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="empty-state">
          <p>주문 내역이 없습니다.</p>
        </div>
      ) : (
        <div className="orders-table-container">
          <table className="orders-table">
            <thead>
              <tr>
                <th>주문번호</th>
                <th>주문자</th>
                <th>연락처</th>
                <th>상품 수</th>
                <th>주문 금액</th>
                <th>주문 상태</th>
                <th>주문일</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order.order_id}>
                  <td>#{order.order_id}</td>
                  <td>{order.recipient_name}</td>
                  <td>{order.recipient_phone}</td>
                  <td>{order.item_count || 0}개</td>
                  <td>{(order.total_price || 0).toLocaleString()}원</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </td>
                  <td>{new Date(order.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons">
                      {order.status === 'pending' && (
                        <button 
                          className="btn-status"
                          onClick={() => updateOrderStatus(order.order_id, 'paid')}
                        >
                          결제 확인
                        </button>
                      )}
                      {order.status === 'paid' && (
                        <button 
                          className="btn-status"
                          onClick={() => updateOrderStatus(order.order_id, 'shipping')}
                        >
                          배송 시작
                        </button>
                      )}
                      {order.status === 'shipping' && (
                        <button 
                          className="btn-status"
                          onClick={() => updateOrderStatus(order.order_id, 'delivered')}
                        >
                          배송 완료
                        </button>
                      )}
                      <button 
                        className="btn-detail"
                        onClick={() => navigate(`/admin/orders/${order.order_id}`)}
                      >
                        상세보기
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminOrderList;