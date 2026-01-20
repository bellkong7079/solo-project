import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import './ProfilePage.css';

function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get('/auth/me');
      setUser(response.data.user);
      setFormData({
        name: response.data.user.name || '',
        phone: response.data.user.phone || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('사용자 정보 조회 실패:', error);
      if (error.response?.status === 401) {
        alert('로그인이 필요합니다.');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  // 전화번호 자동 포맷팅
  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/[^0-9]/g, '');
    
    if (value.length <= 3) {
      value = value;
    } else if (value.length <= 7) {
      value = value.slice(0, 3) + '-' + value.slice(3);
    } else if (value.length <= 11) {
      value = value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7);
    } else {
      value = value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7, 11);
    }
    
    setFormData({ ...formData, phone: value });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // 비밀번호 변경을 원하는 경우
    if (formData.newPassword) {
      if (!formData.currentPassword) {
        setError('현재 비밀번호를 입력해주세요.');
        return;
      }

      if (formData.newPassword !== formData.confirmPassword) {
        setError('새 비밀번호가 일치하지 않습니다.');
        return;
      }

      if (formData.newPassword.length < 6) {
        setError('새 비밀번호는 6자 이상이어야 합니다.');
        return;
      }
    }

    setSaving(true);

    try {
      const updateData = {
        name: formData.name,
        phone: formData.phone
      };

      // 비밀번호 변경이 있는 경우만 추가
      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      const response = await axios.put('/auth/me', updateData);

      // localStorage의 user 정보 업데이트
      const updatedUser = response.data.user;
      localStorage.setItem('user', JSON.stringify(updatedUser));

      setSuccess('회원정보가 수정되었습니다!');
      setUser(updatedUser);
      
      // 비밀번호 필드 초기화
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      // 3초 후 성공 메시지 제거
      setTimeout(() => setSuccess(''), 3000);

    } catch (error) {
      setError(error.response?.data?.message || '회원정보 수정에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('정말로 회원 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    const password = prompt('비밀번호를 입력하세요:');
    if (!password) return;

    try {
      await axios.delete('/auth/me', {
        data: { password }
      });

      alert('회원 탈퇴가 완료되었습니다.');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/');
    } catch (error) {
      alert(error.response?.data?.message || '회원 탈퇴에 실패했습니다.');
    }
  };

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-container">
          <h1 className="page-title">회원정보 수정</h1>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <form onSubmit={handleSubmit} className="profile-form">
            {/* 이메일 (수정 불가) */}
            <div className="form-group">
              <label>이메일</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="disabled-input"
              />
              <small className="form-help">이메일은 변경할 수 없습니다.</small>
            </div>

            {/* 이름 */}
            <div className="form-group">
              <label>이름 *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="이름을 입력하세요"
                required
              />
            </div>

            {/* 전화번호 */}
            <div className="form-group">
              <label>전화번호</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handlePhoneChange}
                placeholder="010-1234-5678"
                maxLength="13"
              />
            </div>

            <div className="divider"></div>

            {/* 비밀번호 변경 섹션 */}
            <h3 className="section-title">비밀번호 변경 (선택사항)</h3>
            
            <div className="form-group">
              <label>현재 비밀번호</label>
              <input
                type="password"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                placeholder="현재 비밀번호"
              />
            </div>

            <div className="form-group">
              <label>새 비밀번호</label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="새 비밀번호 (6자 이상)"
              />
            </div>

            <div className="form-group">
              <label>새 비밀번호 확인</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="새 비밀번호 확인"
              />
            </div>

            {/* 버튼 */}
            <div className="button-group">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? '저장 중...' : '저장하기'}
              </button>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => navigate('/')}
              >
                취소
              </button>
            </div>
          </form>

          {/* 회원 탈퇴 */}
          <div className="danger-zone">
            <h3 className="danger-title">회원 탈퇴</h3>
            <p className="danger-description">
              회원 탈퇴 시 모든 정보가 삭제되며 복구할 수 없습니다.
            </p>
            <button 
              className="btn btn-danger"
              onClick={handleDeleteAccount}
            >
              회원 탈퇴
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;