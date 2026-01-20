// front/src/pages/AdminCategoryPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminCategoryPage.css';
import AdminLayout from '../components/AdminLayout';

const API_URL = 'http://192.168.0.219:5000/api';

function AdminCategoryPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [flatCategories, setFlatCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    parent_id: '',
    display_order: '',
    slug: '',
    is_active: 1
  });

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      alert('관리자 로그인이 필요합니다.');
      navigate('/admin/login');
      return;
    }

    fetchCategories();
  }, [navigate]);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/categories/admin/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setCategories(response.data.categories);
      setFlatCategories(response.data.flatCategories);
    } catch (error) {
      console.error('카테고리 조회 실패:', error);
      if (error.response?.status === 401) {
        alert('로그인이 만료되었습니다.');
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        parent_id: category.parent_id || '',
        display_order: category.display_order,
        slug: category.slug,
        is_active: category.is_active
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        parent_id: '',
        display_order: '',
        slug: '',
        is_active: 1
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      parent_id: '',
      display_order: '',
      slug: '',
      is_active: 1
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.slug.trim()) {
      alert('카테고리 이름과 슬러그는 필수입니다.');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      
      if (editingCategory) {
        await axios.put(
          `${API_URL}/categories/admin/${editingCategory.category_id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('카테고리가 수정되었습니다.');
      } else {
        await axios.post(
          `${API_URL}/categories/admin`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('카테고리가 생성되었습니다.');
      }

      handleCloseModal();
      fetchCategories();

    } catch (error) {
      console.error('카테고리 저장 실패:', error);
      alert(error.response?.data?.message || '카테고리 저장에 실패했습니다.');
    }
  };

  const handleDelete = async (categoryId, categoryName) => {
    if (!window.confirm(`"${categoryName}" 카테고리를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${API_URL}/categories/admin/${categoryId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('카테고리가 삭제되었습니다.');
      fetchCategories();

    } catch (error) {
      console.error('카테고리 삭제 실패:', error);
      alert(error.response?.data?.message || '카테고리 삭제에 실패했습니다.');
    }
  };

  const handleToggleActive = async (category) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(
        `${API_URL}/categories/admin/${category.category_id}`,
        { is_active: category.is_active === 1 ? 0 : 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      fetchCategories();

    } catch (error) {
      console.error('상태 변경 실패:', error);
      alert('상태 변경에 실패했습니다.');
    }
  };

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9가-힣-]/g, '');
  };

  const handleNameChange = (value) => {
    setFormData(prev => ({
      ...prev,
      name: value,
      slug: generateSlug(value)
    }));
  };

  const parentCategories = flatCategories.filter(cat => !cat.parent_id);

  const renderCategoryRow = (category, level = 0) => {
    return (
      <div key={category.category_id}>
        <div className="category-row">
          <div className="category-info" style={{ paddingLeft: `${level * 30}px` }}>
            {level > 0 && <span className="tree-icon">└─</span>}
            <span className="category-name">{category.name}</span>
            <span className="category-slug">/{category.slug}</span>
          </div>
          
          <div className="category-meta">
            <span className="badge">{category.depth === 0 ? '대분류' : '소분류'}</span>
            <span className="product-count">상품: {category.product_count || 0}</span>
            <span className="display-order">순서: {category.display_order}</span>
          </div>

          <div className="category-status">
            <button
              className={`status-toggle ${category.is_active ? 'active' : 'inactive'}`}
              onClick={() => handleToggleActive(category)}
            >
              {category.is_active ? '활성' : '비활성'}
            </button>
          </div>

          <div className="category-actions">
            <button 
              className="btn-edit"
              onClick={() => handleOpenModal(category)}
            >
              수정
            </button>
            <button 
              className="btn-delete"
              onClick={() => handleDelete(category.category_id, category.name)}
            >
              삭제
            </button>
          </div>
        </div>

        {category.children && category.children.map(child => 
          renderCategoryRow(child, level + 1)
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="loading">로딩 중...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-header">
        <div>
          <h1>📁 카테고리 관리</h1>
          <p>상품 카테고리를 관리합니다</p>
        </div>
        <button className="btn-add-category" onClick={() => handleOpenModal()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          카테고리 추가
        </button>
      </div>

      <div className="category-container">
        <div className="category-stats">
          <div className="stat-item">
            <span className="stat-label">전체 카테고리</span>
            <span className="stat-value">{flatCategories.length}개</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">대분류</span>
            <span className="stat-value">{parentCategories.length}개</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">소분류</span>
            <span className="stat-value">{flatCategories.length - parentCategories.length}개</span>
          </div>
        </div>

        <div className="category-list">
          <div className="category-header">
            <div className="header-col">카테고리</div>
            <div className="header-col">정보</div>
            <div className="header-col">상태</div>
            <div className="header-col">작업</div>
          </div>

          {categories.length === 0 ? (
            <div className="no-categories">
              <p>등록된 카테고리가 없습니다.</p>
            </div>
          ) : (
            <div className="category-rows">
              {categories.map(category => renderCategoryRow(category))}
            </div>
          )}
        </div>
      </div>

      {/* 카테고리 추가/수정 모달 */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingCategory ? '카테고리 수정' : '카테고리 추가'}</h2>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>카테고리 이름 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="예: 상의"
                  required
                />
              </div>

              <div className="form-group">
                <label>슬러그 (URL) *</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="예: tops"
                  required
                />
                <small>영문, 숫자, 하이픈(-), 한글만 사용 가능</small>
              </div>

              <div className="form-group">
                <label>상위 카테고리</label>
                <select
                  value={formData.parent_id}
                  onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                >
                  <option value="">없음 (대분류)</option>
                  {parentCategories.map(cat => (
                    <option 
                      key={cat.category_id} 
                      value={cat.category_id}
                      disabled={editingCategory?.category_id === cat.category_id}
                    >
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>표시 순서</label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                  placeholder="숫자가 작을수록 먼저 표시됩니다"
                  min="1"
                />
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.is_active === 1}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })}
                  />
                  <span>활성화</span>
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                  취소
                </button>
                <button type="submit" className="btn-submit">
                  {editingCategory ? '수정' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminCategoryPage;