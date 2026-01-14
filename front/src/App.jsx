import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import AdminLoginPage from './pages/AdminLoginPage';
import CartPage from './pages/CartPage';
import ProductDetailPage from './pages/ProductDetailPage';
import ProductListPage from './pages/ProductListPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminProductCreate from './pages/AdminProductCreate';
import AdminProductList from './pages/AdminProductList';

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
        <Route path="/cart" element={<CartPage />} />
        <Route path="/products" element={<ProductListPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        
        {/* 관리자 페이지 */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/products" element={<AdminProductList />} />
        <Route path="/admin/products/create" element={<AdminProductCreate />} />
      </Routes>
      
      {/* 관리자 페이지가 아닐 때만 Footer 표시 */}
      {!isAdminPage && <Footer />}
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;