import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import './Header.css';

const API_URL = 'http://localhost:5000/api';

function Header() {
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // 로그인 상태 확인
    checkLoginStatus();
    // 카테고리 불러오기
    fetchCategories();
  }, []);

  const checkLoginStatus = () => {
    const token = localStorage.getItem('token');
    const adminToken = localStorage.getItem('adminToken');
    const userData = localStorage.getItem('user');
    
    // 일반 사용자 토큰이 있으면
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('사용자 정보 파싱 실패:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    // 관리자 토큰만 있으면
    else if (adminToken) {
      try {
        const payload = JSON.parse(atob(adminToken.split('.')[1]));
        setUser({ 
          name: payload.name || 'Admin',
          email: payload.email,
          isAdmin: true
        });
      } catch (error) {
        console.error('관리자 토큰 파싱 실패:', error);
      }
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/categories`);
      setCategories(response.data.categories);
    } catch (error) {
      console.error('카테고리 조회 실패:', error);
    }
  };

  const handleLogout = () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      // 일반 사용자 토큰 삭제
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // 관리자 토큰도 삭제
      localStorage.removeItem('adminToken');
      
      setUser(null);
      alert('로그아웃 되었습니다.');
      navigate('/');
    }
  };

  const handleMouseEnter = (categoryId) => {
    setActiveDropdown(categoryId);
  };

  const handleMouseLeave = () => {
    setActiveDropdown(null);
  };

  return (
    <header className="header">
      <div className="header-content">
        {/* 로고 */}
        <Link to="/" className="logo">
          jongbin'S 服屋
        </Link>

        {/* 네비게이션 - 동적 카테고리 */}
        <nav className="nav">
          {categories.map(category => (
            <div 
              key={category.category_id}
              className="nav-item-wrapper"
              onMouseEnter={() => handleMouseEnter(category.category_id)}
              onMouseLeave={handleMouseLeave}
            >
              <Link 
                to={`/products?category=${category.slug}`} 
                className="nav-link"
              >
                {category.name}
              </Link>
              
              {/* 하위 카테고리(소분류) 드롭다운 */}
              {category.children && category.children.length > 0 && (
                <div className={`dropdown-menu ${activeDropdown === category.category_id ? 'show' : ''}`}>
                  {category.children.map(subCategory => (
                    <Link
                      key={subCategory.category_id}
                      to={`/products?category=${subCategory.slug}`}
                      className="dropdown-item"
                    >
                      {subCategory.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* 우측 메뉴 */}
        <div className="header-actions">
          <button className="icon-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </button>

          {user ? (
            <div className="user-menu">
              <span className="user-name">
                {user.isAdmin ? '👑 ' : ''}{user.name}님
              </span>
              {user.isAdmin && (
                <Link to="/admin/dashboard" className="admin-link-btn">
                  관리자
                </Link>
              )}
              <button onClick={handleLogout} className="header-logout-btn">
                로그아웃
              </button>
            </div>
          ) : (
            <Link to="/login" className="icon-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </Link>
          )}

          <Link to="/cart" className="icon-btn cart-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            <span className="cart-count">0</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Header;