import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import './ProductDetailPage.css';

function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('detail');

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await axios.get(`/products/${id}`);
      setProduct(response.data.product);
      
      // 첫 번째 옵션 자동 선택
      if (response.data.product.options?.length > 0) {
        setSelectedOption(response.data.product.options[0].option_id);
      }
    } catch (error) {
      console.error('상품 조회 실패:', error);
      alert('상품을 불러올 수 없습니다.');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    if (product.options?.length > 0 && !selectedOption) {
      alert('옵션을 선택해주세요.');
      return;
    }

    try {
      await axios.post('/cart', {
        product_id: product.product_id,
        option_id: selectedOption,
        quantity: quantity
      });

      if (window.confirm('장바구니에 추가되었습니다. 장바구니로 이동하시겠습니까?')) {
        navigate('/cart');
      }
    } catch (error) {
      alert(error.response?.data?.message || '장바구니 추가에 실패했습니다.');
    }
  };

  const handleBuyNow = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    if (product.options?.length > 0 && !selectedOption) {
      alert('옵션을 선택해주세요.');
      return;
    }

    try {
      await axios.post('/cart', {
        product_id: product.product_id,
        option_id: selectedOption,
        quantity: quantity
      });
      navigate('/checkout');
    } catch (error) {
      alert(error.response?.data?.message || '구매에 실패했습니다.');
    }
  };

  const getSelectedOptionInfo = () => {
    if (!selectedOption || !product.options) return null;
    return product.options.find(opt => opt.option_id === selectedOption);
  };

  const getTotalPrice = () => {
    const basePrice = product.discount_price || product.price;
    const optionInfo = getSelectedOptionInfo();
    const additionalPrice = optionInfo?.additional_price || 0;
    return (basePrice + additionalPrice) * quantity;
  };

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  if (!product) {
    return <div className="error">상품을 찾을 수 없습니다.</div>;
  }

  const images = product.images?.length > 0 
    ? product.images 
    : [{ image_url: product.thumbnail || 'https://via.placeholder.com/600' }];

  return (
    <div className="product-detail-page">
      <div className="container">
        <div className="product-layout">
          {/* 이미지 갤러리 */}
          <div className="product-gallery">
            <div className="main-image">
              <img src={images[selectedImage]?.image_url} alt={product.name} />
            </div>
            {images.length > 1 && (
              <div className="thumbnail-list">
                {images.map((img, index) => (
                  <div
                    key={index}
                    className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                    onClick={() => setSelectedImage(index)}
                  >
                    <img src={img.image_url} alt={`${product.name} ${index + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 상품 정보 */}
          <div className="product-info-section">
            <h1 className="product-title">{product.name}</h1>
            
            <div className="product-price-box">
              {product.discount_price ? (
                <>
                  <span className="original-price">{product.price.toLocaleString()}원</span>
                  <span className="discount-price">{product.discount_price.toLocaleString()}원</span>
                  <span className="discount-rate">
                    {Math.round((1 - product.discount_price / product.price) * 100)}%
                  </span>
                </>
              ) : (
                <span className="current-price">{product.price.toLocaleString()}원</span>
              )}
            </div>

            <div className="product-short-desc">
              {product.description?.substring(0, 100)}
            </div>

            {/* 옵션 선택 */}
            {product.options?.length > 0 && (
              <div className="option-section">
                <label className="option-label">옵션 선택</label>
                <select 
                  className="option-select"
                  value={selectedOption || ''}
                  onChange={(e) => setSelectedOption(Number(e.target.value))}
                >
                  {product.options.map(option => (
                    <option key={option.option_id} value={option.option_id}>
                      {option.option_name}: {option.option_value}
                      {option.additional_price > 0 && ` (+${option.additional_price.toLocaleString()}원)`}
                      {option.stock === 0 && ' (품절)'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 수량 선택 */}
            <div className="quantity-section">
              <label className="quantity-label">수량</label>
              <div className="quantity-control">
                <button 
                  className="qty-btn"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </button>
                <span className="qty-value">{quantity}</span>
                <button 
                  className="qty-btn"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </button>
              </div>
            </div>

            {/* 총 가격 */}
            <div className="total-price-box">
              <span>총 상품 금액</span>
              <span className="total-price">{getTotalPrice().toLocaleString()}원</span>
            </div>

            {/* 구매 버튼 */}
            <div className="action-buttons">
              <button className="btn btn-secondary btn-large" onClick={handleAddToCart}>
                장바구니
              </button>
              <button className="btn btn-primary btn-large" onClick={handleBuyNow}>
                바로 구매
              </button>
            </div>
          </div>
        </div>

        {/* 상품 상세 탭 */}
        <div className="product-tabs">
          <div className="tab-header">
            <button 
              className={`tab-btn ${activeTab === 'detail' ? 'active' : ''}`}
              onClick={() => setActiveTab('detail')}
            >
              상품 상세
            </button>
            <button 
              className={`tab-btn ${activeTab === 'delivery' ? 'active' : ''}`}
              onClick={() => setActiveTab('delivery')}
            >
              배송 정보
            </button>
            <button 
              className={`tab-btn ${activeTab === 'review' ? 'active' : ''}`}
              onClick={() => setActiveTab('review')}
            >
              상품 후기
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'detail' && (
              <div className="detail-content">
                <p>{product.description}</p>
                {/* 추가 상세 이미지들이 있다면 여기에 표시 */}
              </div>
            )}

            {activeTab === 'delivery' && (
              <div className="delivery-content">
                <h3>배송 안내</h3>
                <ul>
                  <li>배송비: 3,000원 (50,000원 이상 구매 시 무료)</li>
                  <li>배송 기간: 평균 2-3일 (영업일 기준)</li>
                  <li>제주/도서산간 지역: 추가 배송비 발생</li>
                </ul>
                <h3>교환/반품 안내</h3>
                <ul>
                  <li>상품 수령 후 14일 이내 교환/반품 가능</li>
                  <li>단순 변심의 경우 왕복 배송비 고객 부담</li>
                  <li>상품 하자 시 무료 교환/반품</li>
                </ul>
              </div>
            )}

            {activeTab === 'review' && (
              <div className="review-content">
                <p className="no-review">아직 작성된 후기가 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetailPage;