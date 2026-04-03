import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './AuthPages.css';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await axios.post('http://192.168.0.225:5000/api/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || '이메일 전송에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1 className="auth-title">비밀번호 찾기</h1>
        <p className="auth-subtitle">가입하신 이메일로 재설정 링크를 보내드립니다</p>

        {success ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '16px'
            }}>✉️</div>
            <p style={{ fontSize: '15px', color: '#1a1a1a', fontWeight: '600', marginBottom: '8px' }}>
              이메일을 전송했습니다
            </p>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '30px' }}>
              <strong>{email}</strong>으로 재설정 링크를 보냈습니다.<br />
              링크는 30분간 유효합니다.
            </p>
            <Link to="/login" className="btn btn-primary btn-full" style={{
              display: 'block',
              textAlign: 'center',
              padding: '16px',
              backgroundColor: '#1a1a1a',
              color: '#fff',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '15px'
            }}>
              로그인으로 돌아가기
            </Link>
          </div>
        ) : (
          <>
            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="email">이메일</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="가입하신 이메일을 입력하세요"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={loading}
              >
                {loading ? '전송 중...' : '재설정 링크 전송'}
              </button>
            </form>

            <div className="auth-links">
              <p>
                <Link to="/login">로그인으로 돌아가기</Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
