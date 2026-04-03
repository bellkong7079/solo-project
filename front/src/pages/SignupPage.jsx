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
    phone: '', // 🆕 전화번호 추가
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // 🆕 전화번호 자동 포맷팅 (010-1234-5678)
  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/[^0-9]/g, ''); // 숫자만 추출
    
    if (value.length <= 3) {
      value = value;
    } else if (value.length <= 7) {
      value = value.slice(0, 3) + '-' + value.slice(3);
    } else if (value.length <= 11) {
      value = value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7);
    } else {
      value = value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7, 11);
    }
    
    setForm((prev) => ({ ...prev, phone: value }));
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

    // 🆕 전화번호 유효성 검사 (선택사항)
    if (form.phone && !/^010-\d{4}-\d{4}$/.test(form.phone)) {
      setError('올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)');
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post('http://192.168.0.225:5000/api/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone, // 🆕 전화번호 전송
      });

      if (res.data?.token) {
        localStorage.setItem('token', res.data.token);
      }

      alert('회원가입 완료!');
      navigate('/login');
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

          {/* 🆕 전화번호 입력란 */}
          <div className="form-group">
            <label>전화번호</label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handlePhoneChange}
              placeholder="010-1234-5678"
              maxLength="13"
            />
            <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
              선택사항 (자동으로 하이픈이 추가됩니다)
            </small>
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