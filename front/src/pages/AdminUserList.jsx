// front/src/pages/AdminUserList.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AdminLayout from '../components/AdminLayout';
import './AdminUserList.css';

const API_URL = 'http://192.168.0.219:5000/api';

function AdminUserList() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      alert('관리자 로그인이 필요합니다.');
      navigate('/admin/login');
      return;
    }
    fetchUsers();
  }, [navigate]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data.users);
    } catch (error) {
      console.error('회원 목록 조회 실패:', error);
      alert('회원 목록을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="loading">로딩 중...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="list-header">
        <h1>👥 회원 관리</h1>
        <div className="header-actions">
          <button className="btn-back" onClick={() => navigate('/admin/dashboard')}>
            ← 대시보드
          </button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="user-stats">
        <div className="stat-card">
          <div className="stat-icon blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div className="stat-info">
            <p className="stat-label">전체 회원</p>
            <p className="stat-value">{users.length}명</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="8.5" cy="7" r="4"></circle>
              <polyline points="17 11 19 13 23 9"></polyline>
            </svg>
          </div>
          <div className="stat-info">
            <p className="stat-label">구매 회원</p>
            <p className="stat-value">{users.filter(u => u.order_count > 0).length}명</p>
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
            <p className="stat-label">총 구매액</p>
            <p className="stat-value">
              {users.reduce((sum, u) => sum + Number(u.total_spent || 0), 0).toLocaleString()}원
            </p>
          </div>
        </div>
      </div>

      {/* 검색 */}
      <div className="search-bar">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
        <input
          type="text"
          placeholder="회원 이름 또는 이메일 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* 회원 테이블 */}
      {filteredUsers.length === 0 ? (
        <div className="empty-state">
          <p>회원이 없습니다.</p>
        </div>
      ) : (
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>회원 ID</th>
                <th>이름</th>
                <th>이메일</th>
                <th>연락처</th>
                <th>주문 횟수</th>
                <th>총 구매액</th>
                <th>마지막 주문</th>
                <th>가입일</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.user_id}>
                  <td>#{user.user_id}</td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.phone || '-'}</td>
                  <td>
                    <span className="order-count">
                      {user.order_count}회
                    </span>
                  </td>
                  <td>
                    <span className="total-spent">
                      {Number(user.total_spent || 0).toLocaleString()}원
                    </span>
                  </td>
                  <td>
                    {user.last_order_date 
                      ? new Date(user.last_order_date).toLocaleDateString()
                      : '-'
                    }
                  </td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td>
                    <button 
                      className="btn-detail"
                      onClick={() => navigate(`/admin/users/${user.user_id}`)}
                    >
                      상세보기
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminUserList;