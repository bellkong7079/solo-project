import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { CartProvider } from './contexts/CartContext';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProfilePage from './pages/ProfilePage';
import MyPage from './pages/MyPage'; // 🆕 추가
import OrderDetailPage from './pages/OrderDetailPage'; // 🆕 추가
import AdminLoginPage from './pages/AdminLoginPage';
import CartPage from './pages/CartPage';
import ProductDetailPage from './pages/ProductDetailPage';
import ProductListPage from './pages/ProductListPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminProductCreate from './pages/AdminProductCreate';
import AdminProductList from './pages/AdminProductList';
import CheckoutPage from './pages/CheckoutPage';
import OrderCompletePage from './pages/OrderCompletePage';
import AdminOrderList from './pages/AdminOrderList';
import AdminOrderDetail from './pages/AdminOrderDetail';
import AdminProductForm from './pages/AdminProductForm';
import FAQ from './pages/FAQ';
import ShippingGuide from './pages/ShippingGuide';
import ChatWidget from './components/ChatWidget';
import AdminChatPage from './pages/AdminChatPage';
import AdminCategoryPage from './pages/AdminCategoryPage';
import AdminUserList from './pages/AdminUserList';
import AdminUserDetail from './pages/AdminUserDetail';
import SalesAnalytics from './pages/SalesAnalytics';
import ProductAnalytics from './pages/ProductAnalytics';
import CustomerAnalytics from './pages/CustomerAnalytics';
import InventoryManagement from './pages/InventoryManagement';
import MembershipBenefits from './pages/MembershipBenefits';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

function AppContent() {
  const location = useLocation();
  
  // 관리자 페이지인지 확인
  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <>
      {/* 관리자 페이지가 아닐 때만 Header 표시 */}
      {!isAdminPage && <Header />}
      
      <Routes>
        {/* 일반 사용자 페이지 */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/mypage" element={<MyPage />} /> {/* 🆕 추가 */}
        <Route path="/orders/:orderId" element={<OrderDetailPage />} /> {/* 🆕 추가 */}
        <Route path="/cart" element={<CartPage />} />
        <Route path="/products" element={<ProductListPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order-complete/:orderId" element={<OrderCompletePage />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/shipping" element={<ShippingGuide />} />
        <Route path="/membership-benefits" element={<MembershipBenefits />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* 관리자 페이지 */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/products" element={<AdminProductList />} />
        <Route path="/admin/products/create" element={<AdminProductCreate />} />
        <Route path="/admin/products/:id/edit" element={<AdminProductForm />} />
        <Route path="/admin/orders" element={<AdminOrderList />} />
        <Route path="/admin/orders/:orderId" element={<AdminOrderDetail />} />
        <Route path="/admin/chat" element={<AdminChatPage />} />
        <Route path="/admin/categories" element={<AdminCategoryPage />} />
        <Route path="/admin/users" element={<AdminUserList />} />
        <Route path="/admin/users/:userId" element={<AdminUserDetail />} />
        <Route path="/admin/analytics/sales" element={<SalesAnalytics />} />
        <Route path="/admin/analytics/products" element={<ProductAnalytics />} />
        <Route path="/admin/analytics/customers" element={<CustomerAnalytics />} />
        <Route path="/admin/inventory" element={<InventoryManagement />} />
      </Routes>
      
      {/* 관리자 페이지가 아닐 때만 Footer 표시 */}
      {!isAdminPage && <Footer />}

      {/* ⭐ 채팅 위젯 - Routes 밖에, 항상 화면 오른쪽 하단에 표시 */}
      {!isAdminPage && <ChatWidget />}
    </>
  );
}

function App() {
  return (
    <Router>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </Router>
  );
}

export default App;