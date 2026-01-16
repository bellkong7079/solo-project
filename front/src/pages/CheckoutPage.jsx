import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import './CheckoutPage.css';

// 다음 우편번호 스크립트 로드
const loadDaumPostcode = () => {
  return new Promise((resolve) => {
    if (window.daum && window.daum.Postcode) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
};

function CheckoutPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    recipient_name: '',
    recipient_phone: '',
    postal_code: '',
    address: '',
    detail_address: '',
    message: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }
    fetchCart();
  }, [navigate]);

  const fetchCart = async () => {
    try {
      const response = await axios.get('/cart');
      if (response.data.items.length === 0) {
        alert('장바구니가 비어있습니다.');
        navigate('/cart');
        return;
      }
      setCartItems(response.data.items);
    } catch (error) {
      console.error('장바구니 조회 실패:', error);
      alert('주문 정보를 불러올 수 없습니다.');
      navigate('/cart');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddressSearch = async () => {
    await loadDaumPostcode();
    
    new window.daum.Postcode({
      oncomplete: function(data) {
        // 도로명 주소 또는 지번 주소
        const fullAddress = data.roadAddress || data.jibunAddress;
        
        setFormData(prev => ({
          ...prev,
          postal_code: data.zonecode,
          address: fullAddress
        }));
        
        // 상세주소 입력란으로 포커스 이동
        document.querySelector('input[name="detail_address"]')?.focus();
      }
    }).open();
  };

  const calculateTotal = () => {
    let itemsTotal = 0;
    
    cartItems.forEach(item => {
      const price = Number(item.itemTotal) || (Number(item.itemPrice) * Number(item.quantity)) || 0;
      itemsTotal += price;
    });
    
    const shippingFee = itemsTotal >= 50000 ? 0 : 3000;
    
    return {
      itemsTotal: itemsTotal,
      shippingFee: shippingFee,
      total: itemsTotal + shippingFee
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 필수 입력 확인
    if (!formData.recipient_name || !formData.recipient_phone || !formData.address) {
      alert('배송 정보를 모두 입력해주세요.');
      return;
    }

    if (!window.confirm('주문하시겠습니까?')) {
      return;
    }

    setSubmitting(true);

    try {
      const { total } = calculateTotal();
      
      const orderData = {
        ...formData,
        total_price: total,
        items: cartItems.map(item => ({
          product_id: item.product_id,
          option_id: item.option_id,
          quantity: item.quantity,
          price: item.itemPrice
        }))
      };

      // 주문 API 호출 (백엔드에 만들어야 함)
      const response = await axios.post('/orders', orderData);

      alert('주문이 완료되었습니다!');
      navigate(`/order-complete/${response.data.order_id}`);

    } catch (error) {
      console.error('주문 실패:', error);
      alert(error.response?.data?.message || '주문에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  if (cartItems.length === 0) {
    return (
      <div className="loading">
        <p>장바구니가 비어있습니다.</p>
        <button onClick={() => navigate('/products')} className="btn btn-primary">
          쇼핑하러 가기
        </button>
      </div>
    );
  }

  const { itemsTotal, shippingFee, total } = calculateTotal();

  // 디버깅용 콘솔
  console.log('장바구니 아이템:', cartItems);
  console.log('계산된 금액:', { itemsTotal, shippingFee, total });

  return (
    <div className="checkout-page">
      <div className="container">
        <h1 className="page-title">주문/결제</h1>

        <form onSubmit={handleSubmit} className="checkout-form">
          <div className="checkout-layout">
            {/* 왼쪽: 배송 정보 */}
            <div className="checkout-main">
              <section className="checkout-section">
                <h2>배송 정보</h2>
                
                <div className="form-group">
                  <label>받는 사람 *</label>
                  <input
                    type="text"
                    name="recipient_name"
                    value={formData.recipient_name}
                    onChange={handleChange}
                    placeholder="이름을 입력하세요"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>연락처 *</label>
                  <input
                    type="tel"
                    name="recipient_phone"
                    value={formData.recipient_phone}
                    onChange={handleChange}
                    placeholder="010-1234-5678"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>우편번호 *</label>
                  <div className="address-search-group">
                    <input
                      type="text"
                      name="postal_code"
                      value={formData.postal_code}
                      placeholder="우편번호"
                      readOnly
                      required
                    />
                    <button 
                      type="button" 
                      className="btn-address-search"
                      onClick={handleAddressSearch}
                    >
                      주소 찾기
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>주소 *</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    placeholder="주소 찾기 버튼을 클릭하세요"
                    readOnly
                    required
                  />
                </div>

                <div className="form-group">
                  <label>상세주소</label>
                  <input
                    type="text"
                    name="detail_address"
                    value={formData.detail_address}
                    onChange={handleChange}
                    placeholder="아파트 동/호수, 건물명 등"
                  />
                </div>

                <div className="form-group">
                  <label>배송 메시지</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="배송 시 요청사항을 입력하세요"
                    rows="3"
                  />
                </div>
              </section>

              {/* 주문 상품 */}
              <section className="checkout-section">
                <h2>주문 상품 ({cartItems.length}개)</h2>
                <div className="order-items">
                  {cartItems.map(item => (
                    <div key={item.cart_id} className="order-item">
                      <img 
                        src={item.thumbnail 
                          ? `http://192.168.0.219:5000${item.thumbnail}`
                          : 'https://via.placeholder.com/80'
                        } 
                        alt={item.name || '상품'} 
                      />
                      <div className="item-info">
                        <h4>{item.name || '상품명 없음'}</h4>
                        {item.option_value && (
                          <p className="item-option">
                            {item.option_name}: {item.option_value}
                          </p>
                        )}
                        <p className="item-quantity">수량: {item.quantity || 1}개</p>
                      </div>
                      <div className="item-price">
                        {((item.itemTotal || item.itemPrice * item.quantity) || 0).toLocaleString()}원
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* 오른쪽: 결제 정보 */}
            <aside className="checkout-sidebar">
              <div className="payment-summary">
                <h3>결제 정보</h3>
                
                <div className="summary-row">
                  <span>상품 금액</span>
                  <span>{(itemsTotal || 0).toLocaleString()}원</span>
                </div>

                <div className="summary-row">
                  <span>배송비</span>
                  <span>{shippingFee === 0 ? '무료' : `${shippingFee.toLocaleString()}원`}</span>
                </div>

                <div className="summary-divider"></div>

                <div className="summary-row total">
                  <span>총 결제금액</span>
                  <span className="total-price">{(total || 0).toLocaleString()}원</span>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary btn-full"
                  disabled={submitting}
                >
                  {submitting ? '주문 중...' : `${(total || 0).toLocaleString()}원 결제하기`}
                </button>

                <p className="payment-notice">
                  * 주문 완료 후 배송 준비 단계에서는 취소가 불가능합니다.
                </p>
              </div>
            </aside>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CheckoutPage;