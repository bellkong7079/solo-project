import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import { useCart } from '../contexts/CartContext'; // 🆕 추가
import './CartPage.css';

function CartPage() {
  const [cartItems, setCartItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  const { fetchCartCount, updateCartItem, removeFromCart } = useCart(); // 🆕 Context 함수 가져오기

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get('/cart');
      setCartItems(response.data.items);
      setTotalPrice(response.data.totalPrice);
    } catch (error) {
      console.error('장바구니 조회 실패:', error);
      if (error.response?.status === 401) {
        alert('로그인이 필요합니다.');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (cartId, newQuantity) => {
    if (newQuantity < 1) return;

    try {
      // 🆕 Context의 updateCartItem 사용
      const result = await updateCartItem(cartId, newQuantity);
      
      if (result.success) {
        fetchCart(); // 장바구니 새로고침
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert('수량 변경에 실패했습니다.');
    }
  };

  const removeItem = async (cartId) => {
    if (!window.confirm('장바구니에서 삭제하시겠습니까?')) return;

    try {
      // 🆕 Context의 removeFromCart 사용
      const result = await removeFromCart(cartId);
      
      if (result.success) {
        fetchCart(); // 장바구니 새로고침
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert('삭제에 실패했습니다.');
    }
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert('장바구니가 비어있습니다.');
      return;
    }
    navigate('/checkout');
  };

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  if (cartItems.length === 0) {
    return (
      <div className="empty-cart">
        <div className="container">
          <h2>장바구니가 비어있습니다</h2>
          <p>원하시는 상품을 담아보세요!</p>
          <Link to="/products" className="btn btn-primary">
            쇼핑 계속하기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        <h1 className="page-title">장바구니</h1>

        <div className="cart-layout">
          {/* 장바구니 아이템 목록 */}
          <div className="cart-items">
            {cartItems.map((item) => (
              <div key={item.cart_id} className="cart-item">
                <Link to={`/products/${item.product_id}`} className="item-image">
                  <img 
                    src={item.thumbnail 
                      ? `http://192.168.0.219:5000${item.thumbnail}` 
                      : 'https://via.placeholder.com/120'
                    } 
                    alt={item.name} 
                  />
                </Link>

                <div className="item-info">
                  <Link to={`/products/${item.product_id}`} className="item-name">
                    {item.name}
                  </Link>
                  {item.option_value && (
                    <p className="item-option">
                      {item.option_name}: {item.option_value}
                    </p>
                  )}
                  <p className="item-price">
                    {(item.itemPrice || 0).toLocaleString()}원
                  </p>
                </div>

                <div className="item-quantity">
                  <button
                    className="qty-btn"
                    onClick={() => updateQuantity(item.cart_id, item.quantity - 1)}
                  >
                    -
                  </button>
                  <span className="qty-value">{item.quantity}</span>
                  <button
                    className="qty-btn"
                    onClick={() => updateQuantity(item.cart_id, item.quantity + 1)}
                  >
                    +
                  </button>
                </div>

                <div className="item-total">
                  {(item.itemTotal || 0).toLocaleString()}원
                </div>

                <button
                  className="item-remove"
                  onClick={() => removeItem(item.cart_id)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* 주문 요약 */}
          <div className="order-summary">
            <h3>주문 요약</h3>
            <div className="summary-row">
              <span>상품 금액</span>
              <span>{(totalPrice || 0).toLocaleString()}원</span>
            </div>
            <div className="summary-row">
              <span>배송비</span>
              <span>{totalPrice >= 50000 ? '무료' : '3,000원'}</span>
            </div>
            <div className="summary-divider"></div>
            <div className="summary-row total">
              <span>총 결제금액</span>
              <span className="total-price">
                {((totalPrice || 0) + (totalPrice >= 50000 ? 0 : 3000)).toLocaleString()}원
              </span>
            </div>

            <button className="btn btn-primary btn-full" onClick={handleCheckout}>
              주문하기
            </button>

            <Link to="/products" className="continue-shopping">
              쇼핑 계속하기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartPage;