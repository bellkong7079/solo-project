// front/src/components/ReviewForm.jsx

import { useState } from 'react';
import axios from 'axios';
import './ReviewForm.css';

const API_URL = 'http://192.168.0.219:5000/api';

function ReviewForm({ productId, orderId, onSuccess, onCancel }) {
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (images.length + files.length > 5) {
      alert('이미지는 최대 5장까지 업로드 가능합니다.');
      return;
    }

    setImages([...images, ...files]);

    // 미리보기
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews([...previews, ...newPreviews]);
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    
    // 메모리 해제
    URL.revokeObjectURL(previews[index]);
    
    setImages(newImages);
    setPreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (content.trim().length < 10) {
      alert('리뷰는 최소 10자 이상 작성해주세요.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요합니다.');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('product_id', productId);
      formData.append('order_id', orderId);
      formData.append('rating', rating);
      formData.append('content', content);

      images.forEach(image => {
        formData.append('images', image);
      });

      await axios.post(`${API_URL}/reviews`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      alert('리뷰가 등록되었습니다!');
      onSuccess();
    } catch (error) {
      console.error('리뷰 등록 실패:', error);
      alert(error.response?.data?.message || '리뷰 등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="review-form-container">
      <h3>리뷰 작성</h3>
      
      <form onSubmit={handleSubmit} className="review-form">
        {/* 별점 */}
        <div className="form-group">
          <label>별점</label>
          <div className="star-rating">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                className={`star ${star <= rating ? 'active' : ''}`}
                onClick={() => setRating(star)}
              >
                ★
              </button>
            ))}
            <span className="rating-text">{rating}점</span>
          </div>
        </div>

        {/* 리뷰 내용 */}
        <div className="form-group">
          <label>리뷰 내용 *</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="상품에 대한 솔직한 리뷰를 남겨주세요. (최소 10자)"
            rows="6"
            required
          />
          <div className="char-count">
            {content.length}자 {content.length < 10 && `(최소 10자)`}
          </div>
        </div>

        {/* 이미지 업로드 */}
        <div className="form-group">
          <label>사진 첨부 (선택, 최대 5장)</label>
          
          <div className="image-upload-area">
            {previews.map((preview, index) => (
              <div key={index} className="image-preview">
                <img src={preview} alt={`미리보기 ${index + 1}`} />
                <button
                  type="button"
                  className="remove-image"
                  onClick={() => removeImage(index)}
                >
                  ✕
                </button>
              </div>
            ))}

            {images.length < 5 && (
              <label className="image-upload-btn">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
                <div className="upload-placeholder">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                  <span>사진 추가</span>
                </div>
              </label>
            )}
          </div>
        </div>

        {/* 버튼 */}
        <div className="form-actions">
          <button
            type="button"
            className="btn-cancel"
            onClick={onCancel}
            disabled={loading}
          >
            취소
          </button>
          <button
            type="submit"
            className="btn-submit"
            disabled={loading || content.trim().length < 10}
          >
            {loading ? '등록 중...' : '리뷰 등록'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ReviewForm;