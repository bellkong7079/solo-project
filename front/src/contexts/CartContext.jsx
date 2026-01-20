// front/src/contexts/CartContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import axios from '../utils/axios';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // 장바구니 개수 조회
  const fetchCartCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setCartCount(0);
        return;
      }

      const response = await axios.get('/cart');
      const items = response.data.items || [];
      
      // 총 상품 개수 계산 (각 아이템의 quantity 합산)
      const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(totalCount);
    } catch (error) {
      console.error('장바구니 개수 조회 실패:', error);
      setCartCount(0);
    }
  };

  // 장바구니에 상품 추가
  const addToCart = async (productId, optionId, quantity = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('로그인이 필요합니다.');
      }

      await axios.post('/cart', {
        product_id: productId,
        option_id: optionId,
        quantity: quantity
      });

      // 장바구니 개수 새로고침
      await fetchCartCount();
      
      return { success: true };
    } catch (error) {
      console.error('장바구니 추가 실패:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || '장바구니 추가에 실패했습니다.' 
      };
    } finally {
      setLoading(false);
    }
  };

  // 장바구니 상품 수량 변경
  const updateCartItem = async (cartId, quantity) => {
    try {
      await axios.put(`/cart/${cartId}`, { quantity });
      await fetchCartCount();
      return { success: true };
    } catch (error) {
      console.error('수량 변경 실패:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || '수량 변경에 실패했습니다.' 
      };
    }
  };

  // 장바구니 상품 삭제
  const removeFromCart = async (cartId) => {
    try {
      await axios.delete(`/cart/${cartId}`);
      await fetchCartCount();
      return { success: true };
    } catch (error) {
      console.error('장바구니 삭제 실패:', error);
      return { 
        success: false, 
        message: '삭제에 실패했습니다.' 
      };
    }
  };

  // 장바구니 비우기
  const clearCart = () => {
    setCartCount(0);
  };

  // 컴포넌트 마운트 시 장바구니 개수 조회
  useEffect(() => {
    fetchCartCount();
  }, []);

  const value = {
    cartCount,
    loading,
    fetchCartCount,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};