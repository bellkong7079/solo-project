import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from '../utils/axios';
import './ProductListPage.css';

function ProductListPage() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('latest');
  const [searchQuery, setSearchQuery] = useState(''); // 🆕 검색어 state

  const category = searchParams.get('category');
  const gender = searchParams.get('gender');
  const search = searchParams.get('search'); // 🆕 검색 파라미터

  useEffect(() => {
    setSearchQuery(search || ''); // 🆕 검색어 저장
    fetchProducts();
  }, [category, gender, search, sortBy]);

  const fetchProducts = async () => {
    try {
      let url = '/products';
      const params = [];
      
      if (category) params.push(`category=${category}`);
      if (gender) params.push(`gender=${gender}`);
      if (search) params.push(`search=${encodeURIComponent(search)}`); // 🆕 검색어 추가
      if (sortBy) params.push(`sort=${sortBy}`);
      
      if (params.length > 0) {
        url += '?' + params.join('&');
      }

      const response = await axios.get(url);
      setProducts(response.data.products);
    } catch (error) {
      console.error('상품 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryTitle = () => {
    // 🆕 검색 모드
    if (searchQuery) {
      return (
        <div className="search-result-header">
          <h1 className="page-title">'{searchQuery}' 검색 결과</h1>
          <p className="search-count">{products.length}개의 상품을 찾았습니다</p>
        </div>
      );
    }

    // 성별에 따른 타이틀
    if (gender === 'male') return "남성 상품";
    if (gender === 'female') return "여성 상품";
    if (gender === 'unisex') return "유니섹스 상품";
    
    if (category === 'men') return "Men's Collection";
    if (category === 'women') return "Women's Collection";
    if (category === 'new') return "New Arrivals";
    
    // 카테고리가 있으면 표시
    if (category) return `${category}`;
    
    return "전체 상품";
  };

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  return (
    <div className="product-list-page">
      <div className="container">
        <div className="page-header">
          {/* 🆕 검색 결과 또는 일반 타이틀 */}
          {typeof getCategoryTitle() === 'string' ? (
            <h1 className="page-title">{getCategoryTitle()}</h1>
          ) : (
            getCategoryTitle()
          )}
          
          <div className="filter-bar">
            <div className="result-count">
              {products.length}개의 상품
            </div>
            
            <select 
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="latest">최신순</option>
              <option value="price_asc">가격 낮은순</option>
              <option value="price_desc">가격 높은순</option>
            </select>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="no-products">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              {searchQuery ? (
                // 🆕 검색 결과 없을 때
                <>
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </>
              ) : (
                // 일반 상품 없을 때
                <>
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </>
              )}
            </svg>
            {searchQuery ? (
              <>
                <h3>'{searchQuery}'에 대한 검색 결과가 없습니다</h3>
                <p>다른 검색어로 다시 시도해보세요</p>
              </>
            ) : (
              <>
                <h3>등록된 상품이 없습니다</h3>
                <p>관리자 페이지에서 상품을 등록해주세요!</p>
              </>
            )}
          </div>
        ) : (
          <div className="product-grid">
            {products.map(product => (
              <Link 
                to={`/products/${product.product_id}`} 
                key={product.product_id} 
                className="product-card"
              >
                <div className="product-image">
                  <img 
                    src={product.thumbnail 
                    ? `http://192.168.0.219:5000${product.thumbnail}` 
                    : 'https://via.placeholder.com/400'
                  } 
                    alt={product.name} 
                    />
                  {product.discount_price && (
                    <div className="discount-badge">
                      {Math.round((1 - product.discount_price / product.price) * 100)}%
                    </div>
                  )}
                </div>
                
                <div className="product-info">
                  <p className="product-category">{product.category_name}</p>
                  <h3 className="product-name">{product.name}</h3>
                  <div className="product-price">
                    {product.discount_price ? (
                      <>
                        <span className="original">{product.price.toLocaleString()}원</span>
                        <span className="discount">{product.discount_price.toLocaleString()}원</span>
                      </>
                    ) : (
                      <span className="current">{product.price.toLocaleString()}원</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductListPage;