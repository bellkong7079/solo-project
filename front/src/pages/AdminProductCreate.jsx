import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminProductForm.css';

function AdminProductCreate() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    discount_price: '',
    category_id: '',
    gender: 'unisex',  // ⭐ 추가
    status: 'active'
  });

  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [options, setOptions] = useState([
    { option_name: 'SIZE', option_value: 'S', stock: 0, additional_price: 0 },
    { option_name: 'SIZE', option_value: 'M', stock: 0, additional_price: 0 },
    { option_name: 'SIZE', option_value: 'L', stock: 0, additional_price: 0 }
  ]);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      alert('관리자 로그인이 필요합니다.');
      navigate('/admin/login');
      return;
    }
    fetchCategories();
  }, [navigate]);

  useEffect(() => {
    return () => {
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('http://192.168.0.219:5000/api/admin/categories', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(response.data.categories);
      if (response.data.categories.length > 0) {
        setFormData(prev => ({ ...prev, category_id: response.data.categories[0].category_id }));
      }
    } catch (error) {
      console.error('카테고리 조회 실패:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length > 5) {
      alert('이미지는 최대 5장까지만 업로드 가능합니다.');
      e.target.value = '';
      return;
    }
    
    const imageFiles = [];
    let hasInvalidFile = false;
    
    for (const file of files) {
      const ext = file.name.toLowerCase().split('.').pop();
      const allowedExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'jfif'];
      
      const isValidType = file.type.startsWith('image/') || allowedExts.includes(ext);
      
      if (!isValidType) {
        hasInvalidFile = true;
        alert(`${file.name}은(는) 지원하지 않는 파일 형식입니다.\n지원 형식: jpg, jpeg, png, gif, webp, jfif`);
        break;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        hasInvalidFile = true;
        alert(`${file.name}의 크기가 너무 큽니다. (최대 5MB)`);
        break;
      }
      
      imageFiles.push(file);
    }
    
    if (hasInvalidFile) {
      e.target.value = '';
      return;
    }
    
    imagePreviews.forEach(url => URL.revokeObjectURL(url));
    
    setImages(imageFiles);
    const previews = imageFiles.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const handleOptionChange = (index, field, value) => {
    const newOptions = [...options];
    newOptions[index][field] = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    setOptions([...options, { option_name: 'SIZE', option_value: '', stock: 0, additional_price: 0 }]);
  };

  const removeOption = (index) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.category_id) {
      alert('필수 항목을 입력해주세요.');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('adminToken');
      const formDataToSend = new FormData();

      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('discount_price', formData.discount_price || '');
      formDataToSend.append('category_id', formData.category_id);
      formDataToSend.append('gender', formData.gender);  // ⭐ 추가
      formDataToSend.append('status', formData.status);

      images.forEach(image => {
        formDataToSend.append('images', image);
      });

      formDataToSend.append('options', JSON.stringify(options));

      await axios.post('http://192.168.0.219:5000/api/admin/products', formDataToSend, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      alert('상품이 등록되었습니다!');
      navigate('/admin/products');

    } catch (error) {
      console.error('상품 등록 실패:', error);
      alert(error.response?.data?.message || '상품 등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-product-form">
      <div className="form-header">
        <h1>상품 등록</h1>
        <button className="btn-back" onClick={() => navigate('/admin/products')}>
          ← 목록으로
        </button>
      </div>

      <form onSubmit={handleSubmit} className="product-form">
        <div className="form-section">
          <h2>기본 정보</h2>
          
          <div className="form-group">
            <label>상품명 *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="상품명을 입력하세요"
              required
            />
          </div>

          <div className="form-group">
            <label>상품 설명</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="상품 설명을 입력하세요"
              rows="5"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>판매가 *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="판매가"
                required
              />
            </div>

            <div className="form-group">
              <label>할인가</label>
              <input
                type="number"
                name="discount_price"
                value={formData.discount_price}
                onChange={handleChange}
                placeholder="할인가 (선택)"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>카테고리 *</label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                required
              >
                <option value="">카테고리 선택</option>
                {categories.map(cat => (
                  <option key={cat.category_id} value={cat.category_id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* ⭐ 성별 선택 추가 */}
            <div className="form-group">
              <label>성별 *</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
              >
                <option value="male">남성</option>
                <option value="female">여성</option>
                <option value="unisex">유니섹스</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>상태</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="active">판매중</option>
              <option value="inactive">판매중지</option>
            </select>
          </div>
        </div>

        <div className="form-section">
          <h2>상품 이미지</h2>
          <div className="form-group">
            <label>이미지 업로드 (최대 5장)</label>
            <input
              type="file"
              accept="image/*,.jfif"
              multiple
              onChange={handleImageChange}
              className="file-input"
            />
            <p className="form-hint">
              첫 번째 이미지가 대표 이미지로 설정됩니다.<br/>
              지원 형식: jpg, jpeg, png, gif, webp, jfif
            </p>
            {images.length > 0 && (
              <p className="selected-files">{images.length}개 파일 선택됨</p>
            )}
          </div>

          {imagePreviews.length > 0 && (
            <div className="image-preview-container">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="image-preview">
                  <img src={preview} alt={`미리보기 ${index + 1}`} />
                  <span className="preview-label">
                    {index === 0 ? '대표 이미지' : `이미지 ${index + 1}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-section">
          <h2>상품 옵션</h2>
          
          {options.map((option, index) => (
            <div key={index} className="option-row">
              <div className="form-group">
                <label>옵션명</label>
                <input
                  type="text"
                  value={option.option_name}
                  onChange={(e) => handleOptionChange(index, 'option_name', e.target.value)}
                  placeholder="예: SIZE, COLOR"
                />
              </div>

              <div className="form-group">
                <label>옵션값</label>
                <input
                  type="text"
                  value={option.option_value}
                  onChange={(e) => handleOptionChange(index, 'option_value', e.target.value)}
                  placeholder="예: S, M, L"
                />
              </div>

              <div className="form-group">
                <label>재고</label>
                <input
                  type="number"
                  value={option.stock}
                  onChange={(e) => handleOptionChange(index, 'stock', e.target.value)}
                  placeholder="재고"
                />
              </div>

              <div className="form-group">
                <label>추가금액</label>
                <input
                  type="number"
                  value={option.additional_price}
                  onChange={(e) => handleOptionChange(index, 'additional_price', e.target.value)}
                  placeholder="0"
                />
              </div>

              <button
                type="button"
                className="btn-remove"
                onClick={() => removeOption(index)}
              >
                삭제
              </button>
            </div>
          ))}

          <button type="button" className="btn-add-option" onClick={addOption}>
            + 옵션 추가
          </button>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={() => navigate('/admin/products')}>
            취소
          </button>
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? '등록 중...' : '상품 등록'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdminProductCreate;