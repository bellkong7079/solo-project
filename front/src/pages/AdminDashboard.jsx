import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminDashboard.css';
import AdminLayout from '../components/AdminLayout';

function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProducts: 0,
    todayOrders: 0,
    totalUsers: 0,
    totalSales: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      alert('관리자 로그인이 필요합니다.');
      navigate('/admin/login');
      return;
    }

    fetchDashboardStats(token);
  }, [navigate]);

  const fetchDashboardStats = async (token) => {
    try {
      console.log('대시보드 통계 요청 중...');
      
      const response = await axios.get('http://localhost:5000/api/admin/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('받은 통계 데이터:', response.data);
      
      setStats({
        totalProducts: response.data.stats.totalProducts,
        todayOrders: response.data.stats.todayOrders,
        totalUsers: response.data.stats.totalUsers,
        totalSales: response.data.stats.totalRevenue
      });
      
    } catch (error) {
      console.error('통계 조회 실패:', error);
      console.error('에러 응답:', error.response?.data);
      
      if (error.response?.status === 401) {
        alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
        localStorage.clear();
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="loading">로딩 중...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-header">
        <h1>대시보드</h1>
        <p>관리자 페이지에 오신 것을 환영합니다</p>
      </div>

      <div className="dashboard-cards">
        <div className="stat-card">
          <div className="stat-icon blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
          </div>
          <div className="stat-info">
            <h3>전체 상품</h3>
            <p className="stat-number">{stats.totalProducts}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
          </div>
          <div className="stat-info">
            <h3>오늘 주문</h3>
            <p className="stat-number">{stats.todayOrders}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <div className="stat-info">
            <h3>전체 회원</h3>
            <p className="stat-number">{stats.totalUsers}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <div className="stat-info">
            <h3>총 매출</h3>
            <p className="stat-number">{stats.totalSales.toLocaleString()}원</p>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h2>빠른 작업</h2>
        <div className="action-buttons">
          <Link to="/admin/products/create" className="action-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            상품 등록
          </Link>
          
          <Link to="/admin/products" className="action-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            </svg>
            상품 목록
          </Link>

          <Link to="/admin/orders" className="action-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            </svg>
            주문 관리
          </Link>

          <Link to="/" className="action-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            </svg>
            쇼핑몰 보기
          </Link>
          
          <Link to="/admin/chat" className="action-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            고객 상담
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminDashboard;