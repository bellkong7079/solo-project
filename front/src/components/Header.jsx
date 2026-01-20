import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useCart } from '../contexts/CartContext';
import './Header.css';

const API_URL = 'http://192.168.0.219:5000/api';

function Header() {
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false); // 🆕 유저 드롭다운 메뉴
  const navigate = useNavigate();
  const location = useLocation();
  
  const { cartCount, clearCart } = useCart();

  useEffect(() => {
    checkLoginStatus();
  }, [location]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const checkLoginStatus = () => {
    const token = localStorage.getItem('token');
    const adminToken = localStorage.getItem('adminToken');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error('사용자 정보 파싱 실패:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      }
    } else if (adminToken) {
      try {
        const payload = JSON.parse(atob(adminToken.split('.')[1]));
        setUser({ 
          name: payload.name || 'Admin',
          email: payload.email,
          isAdmin: true
        });
      } catch (error) {
        console.error('관리자 토큰 파싱 실패:', error);
        setUser(null);
      }
    } else {
      setUser(null);
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
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('adminToken');
      
      setUser(null);
      clearCart();
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
       KISETSU
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
            <div className="user-menu-wrapper">
              {/* 🆕 유저 메뉴 버튼 */}
              <button 
                className="user-menu-btn"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                onBlur={() => setTimeout(() => setShowUserDropdown(false), 200)}
              >
                <span className="user-name">
                  {user.isAdmin ? '👑 ' : ''}{user.name}님
                </span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              {/* 🆕 드롭다운 메뉴 */}
              {showUserDropdown && (
                <div className="user-dropdown">
                  {!user.isAdmin && (
                    <>
                      <Link to="/mypage" className="dropdown-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="7" height="7"></rect>
                          <rect x="14" y="3" width="7" height="7"></rect>
                          <rect x="14" y="14" width="7" height="7"></rect>
                          <rect x="3" y="14" width="7" height="7"></rect>
                        </svg>
                        마이페이지
                      </Link>
                      <Link to="/profile" className="dropdown-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        회원정보 수정
                      </Link>
                    </>
                  )}
                  {user.isAdmin && (
                    <Link to="/admin/dashboard" className="dropdown-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="7" height="7"></rect>
                        <rect x="14" y="3" width="7" height="7"></rect>
                        <rect x="14" y="14" width="7" height="7"></rect>
                        <rect x="3" y="14" width="7" height="7"></rect>
                      </svg>
                      관리자 페이지
                    </Link>
                  )}
                  <button onClick={handleLogout} className="dropdown-item logout">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    로그아웃
                  </button>
                </div>
              )}
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
            {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Header;