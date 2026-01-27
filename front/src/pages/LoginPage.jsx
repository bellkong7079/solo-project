import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../contexts/CartContext'; // 🆕 추가
import './AuthPages.css';

function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { fetchCartCount } = useCart(); // 🆕 장바구니 새로고침 함수

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://192.168.0.219:5000/api/auth/login', formData);
      
      // 토큰 저장
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      console.log('로그인 성공:', response.data);
      
      // 🆕 로그인 성공 후 장바구니 개수 새로고침
      await fetchCartCount();
      
      // 메인 페이지로 이동
      navigate('/');
      
    } catch (err) {
      setError(err.response?.data?.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1 className="auth-title">로그인</h1>
        <p className="auth-subtitle">계절에 오신 것을 환영합니다</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">이메일</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="example@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="비밀번호를 입력하세요"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="auth-links">
          <p>
            아직 회원이 아니신가요? 
            <Link to="/signup"> 회원가입</Link>
          </p>
          <p>
            <Link to="/admin/login">관리자 로그인</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;