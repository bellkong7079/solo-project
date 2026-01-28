// front/src/components/ReviewList.jsx

import { useState, useEffect } from 'react';
import axios from 'axios';
import './ReviewList.css';

const API_URL = 'http://192.168.0.219:5000/api';

function ReviewList({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    avgRating: 0,
    totalReviews: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('latest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchReviews();
  }, [productId, sortBy, page]);

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`${API_URL}/reviews/product/${productId}`, {
        params: { sort: sortBy, page, limit: 10 }
      });

      setReviews(response.data.reviews);
      setStats({
        avgRating: response.data.avgRating,
        totalReviews: response.data.total,
        ratingDistribution: response.data.ratingDistribution
      });
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('리뷰 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleHelpful = async (reviewId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      await axios.post(`${API_URL}/reviews/${reviewId}/helpful`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // 리뷰 목록 새로고침
      fetchReviews();
    } catch (error) {
      console.error('도움돼요 실패:', error);
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="star-display">
        {[1, 2, 3, 4, 5].map(star => (
          <span key={star} className={star <= rating ? 'star filled' : 'star'}>
            ★
          </span>
        ))}
      </div>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const maskEmail = (email) => {
    if (!email) return '';
    const [local, domain] = email.split('@');
    return `${local[0]}${'*'.repeat(local.length - 1)}@${domain}`;
  };

  if (loading) {
    return <div className="loading">리뷰를 불러오는 중...</div>;
  }

  return (
    <div className="review-list-container">
      {/* 리뷰 통계 */}
      <div className="review-stats">
        <div className="avg-rating">
          <div className="rating-number">{stats.avgRating}</div>
          {renderStars(Math.round(stats.avgRating))}
          <div className="total-reviews">{stats.totalReviews}개의 리뷰</div>
        </div>

        <div className="rating-distribution">
          {[5, 4, 3, 2, 1].map(rating => {
            const count = stats.ratingDistribution[rating] || 0;
            const percentage = stats.totalReviews > 0 
              ? (count / stats.totalReviews) * 100 
              : 0;

            return (
              <div key={rating} className="rating-bar">
                <span className="rating-label">{rating}점</span>
                <div className="bar-container">
                  <div 
                    className="bar-fill" 
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="rating-count">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 정렬 옵션 */}
      <div className="review-controls">
        <select 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value)}
          className="sort-select"
        >
          <option value="latest">최신순</option>
          <option value="helpful">도움순</option>
          <option value="rating_high">별점 높은순</option>
          <option value="rating_low">별점 낮은순</option>
        </select>
      </div>

      {/* 리뷰 목록 */}
      {reviews.length === 0 ? (
        <div className="no-reviews">
          <p>아직 작성된 리뷰가 없습니다.</p>
          <p>첫 리뷰를 작성해보세요!</p>
        </div>
      ) : (
        <>
          <div className="reviews-list">
            {reviews.map(review => (
              <div key={review.review_id} className={`review-item ${review.is_best ? 'best' : ''}`}>
                {review.is_best && (
                  <div className="best-badge">베스트 리뷰</div>
                )}

                <div className="review-header">
                  <div className="reviewer-info">
                    <span className="reviewer-name">{review.user_name}</span>
                    <span className="reviewer-email">{maskEmail(review.user_email)}</span>
                  </div>
                  <div className="review-date">{formatDate(review.created_at)}</div>
                </div>

                <div className="review-rating">
                  {renderStars(review.rating)}
                </div>

                <div className="review-content">
                  {review.content}
                </div>

                {review.images && review.images.length > 0 && (
                  <div className="review-images">
                    {review.images.map((image, index) => (
                      <img
                        key={index}
                        src={`${API_URL.replace('/api', '')}${image}`}
                        alt={`리뷰 이미지 ${index + 1}`}
                        className="review-image"
                      />
                    ))}
                  </div>
                )}

                <div className="review-actions">
                  <button
                    className="helpful-btn"
                    onClick={() => handleHelpful(review.review_id)}
                  >
                    👍 도움돼요 {review.helpful_count > 0 && `(${review.helpful_count})`}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="page-btn"
              >
                이전
              </button>

              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index + 1}
                  onClick={() => setPage(index + 1)}
                  className={`page-btn ${page === index + 1 ? 'active' : ''}`}
                >
                  {index + 1}
                </button>
              ))}

              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="page-btn"
              >
                다음
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ReviewList;