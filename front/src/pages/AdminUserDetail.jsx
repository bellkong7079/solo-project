// front/src/pages/AdminUserDetail.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import AdminLayout from '../components/AdminLayout';
import './AdminUserDetail.css';

const API_URL = 'http://192.168.0.219:5000/api';

function AdminUserDetail() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'products'

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      alert('관리자 로그인이 필요합니다.');
      navigate('/admin/login');
      return;
    }
    fetchUserDetail();
    fetchUserProducts();
  }, [userId, navigate]);

  const fetchUserDetail = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data.user);
      setOrders(response.data.orders);
    } catch (error) {
      console.error('회원 상세 조회 실패:', error);
      alert('회원 정보를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProducts = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/admin/users/${userId}/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data.products);
    } catch (error) {
      console.error('구매 상품 조회 실패:', error);
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

  if (!user) {
    return (
      <AdminLayout>
        <div className="empty-state">회원을 찾을 수 없습니다.</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="user-detail-page">
        <div className="detail-header">
          <button className="btn-back" onClick={() => navigate('/admin/users')}>
            ← 회원 목록
          </button>
          <h1>회원 상세 정보</h1>
        </div>

        {/* 회원 정보 카드 */}
        <div className="user-info-card">
          <div className="user-avatar">
            {user.name?.charAt(0) || '?'}
          </div>
          <div className="user-details">
            <h2>{user.name}</h2>
            <p className="user-email">{user.email}</p>
            <p className="user-phone">{user.phone || '연락처 없음'}</p>
            <p className="user-joined">가입일: {new Date(user.created_at).toLocaleDateString()}</p>
          </div>
          <div className="user-stats-grid">
            <div className="stat-box">
              <p className="stat-label">주문 횟수</p>
              <p className="stat-number">{user.order_count}회</p>
            </div>
            <div className="stat-box">
              <p className="stat-label">총 구매액</p>
              <p className="stat-number">{Number(user.total_spent || 0).toLocaleString()}원</p>
            </div>
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div className="tab-menu">
          <button 
            className={`tab ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            주문 내역 ({orders.length})
          </button>
          <button 
            className={`tab ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            구매 상품 ({products.length})
          </button>
        </div>

        {/* 주문 내역 탭 */}
        {activeTab === 'orders' && (
          <div className="orders-section">
            {orders.length === 0 ? (
              <div className="empty-state">주문 내역이 없습니다.</div>
            ) : (
              orders.map(order => (
                <div key={order.order_id} className="order-card">
                  <div className="order-header">
                    <div className="order-info">
                      <h3>주문 #{order.order_id}</h3>
                      <span className={`status-badge ${order.status}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>
                    <div className="order-date">
                      {new Date(order.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="order-items">
                    {order.items?.map(item => (
                      <div key={item.order_item_id} className="order-item">
                        <div className="item-image">
                          {item.product_image ? (
                            <img src={`http://192.168.0.219:5000${item.product_image}`} alt={item.product_name} />
                          ) : (
                            <div className="no-image">No Image</div>
                          )}
                        </div>
                        <div className="item-details">
                          <p className="item-name">{item.product_name}</p>
                          <p className="item-quantity">수량: {item.quantity}개</p>
                        </div>
                        <div className="item-price">
                          {item.price.toLocaleString()}원
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="order-footer">
                    <div className="order-address">
                      <strong>배송지:</strong> {order.address} {order.detail_address}
                    </div>
                    <div className="order-total">
                      총 {order.total_price.toLocaleString()}원
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 구매 상품 탭 */}
        {activeTab === 'products' && (
          <div className="products-section">
            {products.length === 0 ? (
              <div className="empty-state">구매한 상품이 없습니다.</div>
            ) : (
              <div className="products-grid">
                {products.map(product => (
                  <div key={product.product_id} className="product-card">
                    <div className="product-image">
                      {product.product_image ? (
                        <img src={`http://192.168.0.219:5000${product.product_image}`} alt={product.name} />
                      ) : (
                        <div className="no-image">No Image</div>
                      )}
                    </div>
                    <div className="product-info">
                      <p className="product-category">{product.category_name}</p>
                      <h4 className="product-name">{product.name}</h4>
                      <div className="product-stats">
                        <p>구매 횟수: <strong>{product.purchase_count}회</strong></p>
                        <p>구매 수량: <strong>{product.total_quantity}개</strong></p>
                        <p>구매 금액: <strong>{Number(product.total_amount).toLocaleString()}원</strong></p>
                        <p className="last-purchase">
                          마지막 구매: {new Date(product.last_purchase_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminUserDetail;