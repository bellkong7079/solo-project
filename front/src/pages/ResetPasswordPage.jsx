import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import './AuthPages.css';

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('유효하지 않은 링크입니다.');
    }
  }, [token]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.newPassword !== formData.confirmPassword) {
      return setError('비밀번호가 일치하지 않습니다.');
    }

    if (formData.newPassword.length < 6) {
      return setError('비밀번호는 6자 이상이어야 합니다.');
    }

    setLoading(true);

    try {
      await axios.post('http://192.168.0.225:5000/api/auth/reset-password', {
        token,
        newPassword: formData.newPassword
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || '비밀번호 변경에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <h1 className="auth-title">오류</h1>
          <div className="error-message">유효하지 않은 링크입니다.</div>
          <div className="auth-links">
            <p><Link to="/forgot-password">비밀번호 찾기로 돌아가기</Link></p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1 className="auth-title">새 비밀번호 설정</h1>
        <p className="auth-subtitle">새로운 비밀번호를 입력해 주세요</p>

        {success ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
            <p style={{ fontSize: '15px', color: '#1a1a1a', fontWeight: '600', marginBottom: '8px' }}>
              비밀번호가 변경되었습니다
            </p>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '30px' }}>
              3초 후 로그인 페이지로 이동합니다.
            </p>
            <Link to="/login" style={{
              display: 'block',
              textAlign: 'center',
              padding: '16px',
              backgroundColor: '#1a1a1a',
              color: '#fff',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '15px'
            }}>
              로그인하러 가기
            </Link>
          </div>
        ) : (
          <>
            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="newPassword">새 비밀번호</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="6자 이상 입력하세요"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">새 비밀번호 확인</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="비밀번호를 다시 입력하세요"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={loading}
              >
                {loading ? '변경 중...' : '비밀번호 변경'}
              </button>
            </form>

            <div className="auth-links">
              <p><Link to="/login">로그인으로 돌아가기</Link></p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ResetPasswordPage;
