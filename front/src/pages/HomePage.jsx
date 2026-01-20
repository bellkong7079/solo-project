import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../utils/axios';
import './HomePage.css';

function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const response = await axios.get('/products?sort=latest');
      // 최신 상품 4개만 가져오기
      setFeaturedProducts(response.data.products.slice(0, 4));
    } catch (error) {
      console.error('상품 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="homepage">
      {/* 히어로 섹션 */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">계절</h1>
          <p className="hero-subtitle">고요하고, 부드러운, 일상</p>
          <Link to="/products" className="btn btn-primary">
            전체상품
          </Link>
        </div>
      </section>

      {/* 카테고리 섹션 - ⭐ 수정 */}
      <section className="categories">
        <div className="container">
          <div className="category-grid">
            <Link to="/products?gender=male" className="category-card">
              <img 
                src="https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=600" 
                alt="Men's Collection" 
              />
              <div className="category-overlay">
                <h3>Men's Collection</h3>
              </div>
            </Link>
            <Link to="/products?gender=female" className="category-card">
              <img 
                src="https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
                alt="Women's Collection" 
              />
              <div className="category-overlay">
                <h3>Women's Collection</h3>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* 추천 상품 섹션 */}
      <section className="featured">
        <div className="container">
          <h2 className="section-title">Featured Products</h2>
          
          {loading ? (
            <div className="loading-state">상품을 불러오는 중...</div>
          ) : featuredProducts.length === 0 ? (
            <div className="empty-state">
              <p>등록된 상품이 없습니다.</p>
              <p>관리자 페이지에서 상품을 등록해주세요!</p>
            </div>
          ) : (
            <div className="product-grid">
              {featuredProducts.map(product => (
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
                    <button className="quick-view">Quick View</button>
                  </div>
                  <div className="product-info">
                    <h3 className="product-name">{product.name}</h3>
                    <p className="product-price">
                      {product.discount_price ? (
                        <>
                          <span className="original-price">
                            {Number(product.price).toLocaleString()}원
                          </span>
                          <span className="discount-price">
                            {Number(product.discount_price).toLocaleString()}원
                          </span>
                        </>
                      ) : (
                        <span>{Number(product.price).toLocaleString()}원</span>
                      )}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 특징 섹션 */}
      <section className="features">
        <div className="container">
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
              <h4>무료 배송</h4>
              <p>5만원 이상 구매 시</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <h4>빠른 배송</h4>
              <p>평균 2-3일 배송</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
              </div>
              <h4>안전한 결제</h4>
              <p>SSL 보안 적용</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <h4>교환/반품</h4>
              <p>14일 이내 무료</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;