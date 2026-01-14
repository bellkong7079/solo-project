import { Link } from 'react-router-dom';
import './HomePage.css';

function HomePage() {
  // 임시 데이터 (나중에 API에서 가져올 예정)
  const featuredProducts = [
    {
      id: 1,
      name: "미니멀 화이트 티셔츠",
      price: 29000,
      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500"
    },
    {
      id: 2,
      name: "베이직 블랙 팬츠",
      price: 59000,
      image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500"
    },
    {
      id: 3,
      name: "오버핏 셔츠",
      price: 49000,
      image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500"
    },
    {
      id: 4,
      name: "와이드 데님 팬츠",
      price: 69000,
      image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500"
    }
  ];

  return (
    <div className="homepage">
      {/* 히어로 섹션 */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">素敵な FASHION</h1>
          <p className="hero-subtitle">Simple, Clean, Timeless</p>
          <Link to="/products" className="btn btn-primary">
            Shop Now
          </Link>
        </div>
      </section>

      {/* 카테고리 섹션 */}
      <section className="categories">
        <div className="container">
          <div className="category-grid">
            <Link to="/products?category=men" className="category-card">
              <img 
                src="https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=600" 
                alt="Men's Collection" 
              />
              <div className="category-overlay">
                <h3>Men's Collection</h3>
              </div>
            </Link>
            <Link to="/products?category=women" className="category-card">
              <img 
                src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600" 
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
          <div className="product-grid">
            {featuredProducts.map(product => (
              <Link to={`/products/${product.id}`} key={product.id} className="product-card">
                <div className="product-image">
                  <img src={product.image} alt={product.name} />
                  <button className="quick-view">Quick View</button>
                </div>
                <div className="product-info">
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-price">{product.price.toLocaleString()}원</p>
                </div>
              </Link>
            ))}
          </div>
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