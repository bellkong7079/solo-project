import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import './ProductDetailPage.css';
import { useCart } from '../contexts/CartContext';
import ReviewForm from '../components/ReviewForm';  // 🆕 추가
import ReviewList from '../components/ReviewList';  // 🆕 추가

function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('detail');
  
  // 🆕 리뷰 관련 state 추가
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [canReviewData, setCanReviewData] = useState(null);
  const [reviewListKey, setReviewListKey] = useState(0); // 🔥 리뷰 목록 새로고침용

  useEffect(() => {
    fetchProduct();
  }, [id]);

  // 🆕 리뷰 작성 가능 여부 확인
  useEffect(() => {
    if (id) {
      checkCanReview();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await axios.get(`/products/${id}`);
      setProduct(response.data.product);
      
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

  // 🆕 리뷰 작성 가능 여부 확인 함수
  const checkCanReview = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await axios.get(
        `/reviews/can-review/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.canReview) {
        setCanReviewData(response.data);
      }
    } catch (error) {
      console.error('리뷰 작성 가능 여부 확인 실패:', error);
    }
  };

  // 🆕 리뷰 작성 성공 핸들러
  const handleReviewSuccess = async () => {
    setShowReviewForm(false);
    setReviewListKey(prev => prev + 1); // 🔥 리뷰 목록 새로고침!
    
    // 🔥 버튼 즉시 숨김
    setCanReviewData(null);
    
    // 🔥 DB 커밋 완료를 기다린 후 체크 (1초 딜레이)
    setTimeout(() => {
      checkCanReview();
    }, 1000);
  };

  // ✅ 장바구니 담기 (기존 코드 그대로)
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

    const result = await addToCart(product.product_id, selectedOption, quantity);
    
    if (result.success) {
      if (window.confirm('장바구니에 추가되었습니다. 장바구니로 이동하시겠습니까?')) {
        navigate('/cart');
      }
    } else {
      alert(result.message);
    }
  };

  // ✅ 바로 구매 (기존 코드 그대로)
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

    const result = await addToCart(product.product_id, selectedOption, quantity);
    
    if (result.success) {
      navigate('/checkout');
    } else {
      alert(result.message);
    }
  };

  const getSelectedOptionInfo = () => {
    if (!selectedOption || !product.options) return null;
    return product.options.find(opt => opt.option_id === selectedOption);
  };

  const getTotalPrice = () => {
    const basePrice = Number(product.discount_price) || Number(product.price) || 0;
    const optionInfo = getSelectedOptionInfo();
    const additionalPrice = Number(optionInfo?.additional_price) || 0;
    return (basePrice + additionalPrice) * quantity;
  };

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  if (!product) {
    return <div className="error">상품을 찾을 수 없습니다.</div>;
  }

  const images = product.images?.length > 0 
    ? product.images.map(img => ({
        ...img,
        image_url: img.image_url.startsWith('http') 
          ? img.image_url 
          : `http://192.168.0.225:5000${img.image_url}`
      }))
    : [{ 
        image_url: product.thumbnail 
          ? `http://192.168.0.225:5000${product.thumbnail}`
          : 'https://via.placeholder.com/600' 
      }];

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

            {/* 🆕 리뷰 탭 - 완전히 새로운 내용 */}
            {activeTab === 'review' && (
              <div className="review-content">
                {/* 리뷰 작성 버튼 */}
                {canReviewData && !showReviewForm && (
                  <div className="write-review-container">
                    <button 
                      className="write-review-btn"
                      onClick={() => setShowReviewForm(true)}
                    >
                      ✍️ 리뷰 작성하기
                    </button>
                    <p className="review-notice">
                      구매하신 상품에 대한 솔직한 리뷰를 남겨주세요!
                    </p>
                  </div>
                )}

                {/* 리뷰 작성 폼 */}
                {showReviewForm && canReviewData && (
                  <ReviewForm
                    productId={id}
                    orderId={canReviewData.orderId}
                    onSuccess={handleReviewSuccess}
                    onCancel={() => setShowReviewForm(false)}
                  />
                )}

                {/* 리뷰 목록 */}
                <ReviewList key={reviewListKey} productId={id} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetailPage;