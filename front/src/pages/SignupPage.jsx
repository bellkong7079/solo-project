import { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import './AuthPages.css';

const SignupPage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (form.password.length < 6) {
      setError('비밀번호는 6자 이상으로 설정하세요.');
      return;
    }

    setLoading(true);

    try {
      // ✅ 백엔드 회원가입 엔드포인트 (필요하면 여기만 수정)
      const res = await axios.post('http://192.168.0.219:5000/api/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
      });

      // (선택) 서버가 토큰을 주면 저장
      if (res.data?.token) {
        localStorage.setItem('token', res.data.token);
      }

      alert('회원가입 완료!');
      navigate('/login'); // or '/' 원하는 곳으로
    } catch (err) {
      setError(err.response?.data?.message || '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1 className="auth-title">SIGN UP</h1>
        <p className="auth-subtitle">새 계정을 만들어 쇼핑을 시작하세요</p>

        {error && <div className="error-message">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>이름</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={onChange}
              placeholder="이름 입력"
              required
            />
          </div>

          <div className="form-group">
            <label>이메일</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              placeholder="email@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label>비밀번호</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={onChange}
              placeholder="비밀번호 (6자 이상)"
              required
            />
          </div>

          <div className="form-group">
            <label>비밀번호 확인</label>
            <input
              type="password"
              name="passwordConfirm"
              value={form.passwordConfirm}
              onChange={onChange}
              placeholder="비밀번호 다시 입력"
              required
            />
          </div>

          <button className="btn-full" type="submit" disabled={loading}>
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <div className="auth-links">
          <p>이미 계정이 있나요?</p>
          <Link to="/login">로그인으로 이동</Link>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
