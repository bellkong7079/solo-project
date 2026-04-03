import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useCart } from '../contexts/CartContext';
import './Header.css';

const API_URL = 'http://192.168.0.225:5000/api';

function Header() {
  const [user, setUser] = useState(null);
  const [userTier, setUserTier] = useState(null);
  const [categories, setCategories] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  
  // 🆕 검색 관련 state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [popularSearches, setPopularSearches] = useState([]);
  
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef(null);
  
  const { cartCount, clearCart } = useCart();

  useEffect(() => {
    checkLoginStatus();
  }, [location]);

  useEffect(() => {
    if (user && !user.isAdmin) {
      fetchUserTier();
    }
  }, [user]);

  useEffect(() => {
    fetchCategories();
    loadRecentSearches();
    fetchPopularSearches();
  }, []);

  // 🆕 검색창 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  const fetchUserTier = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      console.log('🔍 등급 조회 시작...');
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('📦 받은 데이터:', response.data);
      
      const totalSpent = response.data.user.total_spent || 0;
      console.log('💰 총 구매액:', totalSpent);
      
      let tier = '일반';
      
      if (totalSpent >= 1500000) tier = 'VIP';
      else if (totalSpent >= 800000) tier = '골드';
      else if (totalSpent >= 400000) tier = '실버';
      else if (totalSpent >= 200000) tier = '브론즈';
      
      console.log('🏆 계산된 등급:', tier);
      setUserTier(tier);
    } catch (error) {
      console.error('❌ 등급 조회 실패:', error);
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

  // 🆕 최근 검색어 로드
  const loadRecentSearches = () => {
    const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    setRecentSearches(recent.slice(0, 5));
  };

  // 🆕 인기 검색어 조회
  const fetchPopularSearches = async () => {
    try {
      const response = await axios.get(`${API_URL}/products/popular-searches`);
      setPopularSearches(response.data.searches || []);
    } catch (error) {
      console.error('인기 검색어 조회 실패:', error);
      // 기본 인기 검색어
      setPopularSearches(['셔츠', '청바지', '스니커즈', '가디건', '코트']);
    }
  };

  // 🆕 검색어 입력 시 자동완성
  const handleSearchInput = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setShowSearchDropdown(true);

    if (query.trim().length >= 2) {
      try {
        const response = await axios.get(`${API_URL}/products/search-suggestions`, {
          params: { q: query }
        });
        setSearchSuggestions(response.data.suggestions || []);
      } catch (error) {
        console.error('자동완성 조회 실패:', error);
        setSearchSuggestions([]);
      }
    } else {
      setSearchSuggestions([]);
    }
  };

  // 🆕 검색 실행
  const handleSearch = (query) => {
    if (!query.trim()) return;

    // 최근 검색어에 추가
    const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    const updated = [query, ...recent.filter(s => s !== query)].slice(0, 10);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
    setRecentSearches(updated.slice(0, 5));

    // 검색 페이지로 이동
    navigate(`/products?search=${encodeURIComponent(query)}`);
    setSearchQuery('');
    setShowSearchDropdown(false);
  };

  // 🆕 검색창 포커스
  const handleSearchFocus = () => {
    setShowSearchDropdown(true);
  };

  // 🆕 최근 검색어 삭제
  const deleteRecentSearch = (searchToDelete) => {
    const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    const updated = recent.filter(s => s !== searchToDelete);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
    setRecentSearches(updated.slice(0, 5));
  };

  const getTierIcon = (tier) => {
    switch(tier) {
      case 'VIP': return '💎';
      case '골드': return '🥇';
      case '실버': return '🥈';
      case '브론즈': return '🥉';
      default: return '👤';
    }
  };

  const getTierClass = (tier) => {
    switch(tier) {
      case 'VIP': return 'tier-vip';
      case '골드': return 'tier-gold';
      case '실버': return 'tier-silver';
      case '브론즈': return 'tier-bronze';
      default: return 'tier-normal';
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

        {/* 네비게이션 */}
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
          {/* 🆕 검색창 */}
          <div className="search-container" ref={searchRef}>
            <div className="search-input-wrapper">
              <input
                type="text"
                className="search-input"
                placeholder="상품 검색"
                value={searchQuery}
                onChange={handleSearchInput}
                onFocus={handleSearchFocus}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
              />
              <button 
                className="search-btn"
                onClick={() => handleSearch(searchQuery)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
              </button>
            </div>

            {/* 🆕 검색 드롭다운 */}
            {showSearchDropdown && (
              <div className="search-dropdown">
                {/* 자동완성 */}
                {searchQuery.trim().length >= 2 && searchSuggestions.length > 0 && (
                  <div className="search-section">
                    <h4>추천 검색어</h4>
                    {searchSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        className="search-item"
                        onClick={() => handleSearch(suggestion)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="11" cy="11" r="8"></circle>
                          <path d="m21 21-4.35-4.35"></path>
                        </svg>
                        <span dangerouslySetInnerHTML={{
                          __html: suggestion.replace(
                            new RegExp(searchQuery, 'gi'),
                            match => `<strong>${match}</strong>`
                          )
                        }}></span>
                      </button>
                    ))}
                  </div>
                )}

                {/* 최근 검색어 */}
                {!searchQuery && recentSearches.length > 0 && (
                  <div className="search-section">
                    <div className="search-section-header">
                      <h4>최근 검색어</h4>
                      <button
                        className="clear-all-btn"
                        onClick={() => {
                          localStorage.setItem('recentSearches', '[]');
                          setRecentSearches([]);
                        }}
                      >
                        전체 삭제
                      </button>
                    </div>
                    {recentSearches.map((search, index) => (
                      <div key={index} className="search-item recent">
                        <button
                          className="search-text"
                          onClick={() => handleSearch(search)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                          <span>{search}</span>
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => deleteRecentSearch(search)}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* 인기 검색어 */}
                {!searchQuery && popularSearches.length > 0 && (
                  <div className="search-section">
                    <h4>인기 검색어</h4>
                    <div className="popular-searches">
                      {popularSearches.map((search, index) => (
                        <button
                          key={index}
                          className="popular-tag"
                          onClick={() => handleSearch(search)}
                        >
                          <span className="rank">{index + 1}</span>
                          {search}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {user ? (
            <div className="user-menu-wrapper">
              <button 
                className={`user-menu-btn ${userTier ? getTierClass(userTier) : ''}`}
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                onBlur={() => setTimeout(() => setShowUserDropdown(false), 200)}
              >
                <span className="user-name">
                  {user.isAdmin ? '👑 ' : userTier ? `${getTierIcon(userTier)} ` : ''}{user.name}님
                </span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              {showUserDropdown && (
                <div className="user-dropdown">
                  {!user.isAdmin && userTier && (
                    <div className="tier-badge-dropdown">
                      <span className={`tier-badge ${getTierClass(userTier)}`}>
                        {getTierIcon(userTier)} {userTier}
                      </span>
                    </div>
                  )}
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