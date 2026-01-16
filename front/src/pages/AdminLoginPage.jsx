import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AuthPages.css';

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await axios.post(
        'http://192.168.0.219:5000/api/admin/login',
        { email, password }
      );

      // 토큰 저장
      localStorage.setItem('adminToken', res.data.token);

      // 관리자 대시보드로 이동
      alert('관리자 로그인 성공!');
      navigate('/admin/dashboard');

    } catch (err) {
      setError(
        err.response?.data?.message || '로그인에 실패했습니다.'
      );
    }
  };

  return (
    <div className="auth-page admin-page">
      <div className="auth-container">

        <div className="admin-badge">
          ADMIN
        </div>

        <h1 className="auth-title">ADMIN LOGIN</h1>
        <p className="auth-subtitle">
          관리자 계정으로 로그인하세요
        </p>

        {error && <div className="error-message">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label>비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 입력"
              required
            />
          </div>

          <button type="submit" className="btn-full">
            로그인
          </button>
        </form>

      </div>
    </div>
  );
};

export default AdminLoginPage;