import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminProductList.css';


function AdminProductList() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      alert('관리자 로그인이 필요합니다.');
      navigate('/admin/login');
      return;
    }
    fetchProducts();
  }, [navigate]);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('http://localhost:5000/api/admin/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data.products);
    } catch (error) {
      console.error('상품 조회 실패:', error);
      alert('상품 목록을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId, productName) => {
    if (!window.confirm(`"${productName}" 상품을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`http://localhost:5000/api/admin/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('상품이 삭제되었습니다.');
      fetchProducts();
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('상품 삭제에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="admin-product-list">
        <div className="loading">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="admin-product-list">
      <div className="list-header">
        <h1>상품 관리</h1>
        <div className="header-actions">
          <button className="btn-back" onClick={() => navigate('/admin/dashboard')}>
            ← 대시보드
          </button>
          <Link to="/admin/products/create" className="btn-create">
            + 상품 등록
          </Link>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
          <h3>등록된 상품이 없습니다</h3>
          <p>상품을 등록하여 판매를 시작하세요!</p>
          <Link to="/admin/products/create" className="btn-primary">
            첫 상품 등록하기
          </Link>
        </div>
      ) : (
        <div className="product-table-container">
          <div className="table-info">
            <span>총 {products.length}개의 상품</span>
          </div>
          
          <table className="product-table">
            <thead>
              <tr>
                <th>이미지</th>
                <th>상품명</th>
                <th>카테고리</th>
                <th>가격</th>
                <th>할인가</th>
                <th>상태</th>
                <th>등록일</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.product_id}>
                  <td>
                    <div className="product-thumbnail">
                     <img 
                    src={product.thumbnail 
                    ? `http://localhost:5000${product.thumbnail}` 
                    : 'https://via.placeholder.com/400'
                  } 
                    alt={product.name} 
                    />
                    </div>
                  </td>
                  <td>
                    <Link 
                      to={`/products/${product.product_id}`} 
                      className="product-name-link"
                      target="_blank"
                    >
                      {product.name}
                    </Link>
                  </td>
                  <td>{product.category_name || '-'}</td>
                  <td>{product.price.toLocaleString()}원</td>
                  <td>
                    {product.discount_price 
                      ? `${product.discount_price.toLocaleString()}원`
                      : '-'
                    }
                  </td>
                  <td>
                    <span className={`status-badge ${product.status}`}>
                      {product.status === 'active' ? '판매중' : '판매중지'}
                    </span>
                  </td>
                  <td>{new Date(product.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                       className="btn-edit"
  onClick={() => navigate(`/admin/products/${product.product_id}/edit`)}
>
  수정
</button>
                      <button 
                        className="btn-delete"
                        onClick={() => handleDelete(product.product_id, product.name)}
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminProductList;