import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AdminLayout from '../components/AdminLayout';
import './AnalyticsPages.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

function ProductAnalytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [productData, setProductData] = useState({
    topProducts: [],
    categoryRevenue: [],
    lowStock: [],
    productPerformance: []
  });

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      alert('관리자 로그인이 필요합니다.');
      navigate('/admin/login');
      return;
    }

    fetchProductData(token);
  }, [navigate]);

  const fetchProductData = async (token) => {
    try {
      const response = await axios.get('http://192.168.0.219:5000/api/admin/analytics/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setProductData(response.data);
    } catch (error) {
      console.error('상품 데이터 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🏆 상품별 판매 순위 Top 20
  const topProductsChartData = {
    labels: productData.topProducts?.map(p => p.name) || [
      '린넨 셔츠', '슬림 진', '후드 티셔츠', '맨투맨', '스니커즈',
      '가디건', '청바지', '반팔티', '슬랙스', '롱코트',
      '니트', '블레이저', '원피스', '점퍼', '트레이닝복',
      '운동화', '구두', '벨트', '모자', '양말'
    ],
    datasets: [
      {
        label: '판매 수량',
        data: productData.topProducts?.map(p => p.sales) || [145, 132, 128, 115, 98, 87, 82, 78, 72, 68, 65, 58, 52, 48, 45, 42, 38, 35, 32, 28],
        backgroundColor: 'rgba(59, 130, 246, 0.8)'
      }
    ]
  };

  // 🥧 카테고리별 매출 비중
  const categoryChartData = {
    labels: productData.categoryRevenue?.map(c => c.name) || ['상의', '하의', '아우터', '신발', '악세서리'],
    datasets: [
      {
        data: productData.categoryRevenue?.map(c => c.revenue) || [4500000, 3800000, 5200000, 2100000, 890000],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)'
        ]
      }
    ]
  };

  // 📦 재고 현황 (신규 vs 구상품)
  const performanceChartData = {
    labels: ['신상품 (3개월 이내)', '일반상품', '구상품 (1년 이상)'],
    datasets: [
      {
        label: '판매량',
        data: productData.productPerformance?.map(p => p.sales) || [320, 580, 120],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ]
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: {
        display: false
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right'
      }
    }
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
      <div className="analytics-header">
        <h1>📦 상품 분석</h1>
        <p>상품별 판매 현황 및 재고 관리</p>
      </div>

      {/* 요약 통계 */}
      <div className="analytics-summary">
        <div className="summary-card">
          <h3>전체 상품</h3>
          <p className="summary-value">245개</p>
        </div>
        <div className="summary-card">
          <h3>재고 부족 상품</h3>
          <p className="summary-value warning">12개</p>
        </div>
        <div className="summary-card">
          <h3>베스트 상품</h3>
          <p className="summary-value">린넨 셔츠</p>
          <span className="summary-change">145개 판매</span>
        </div>
        <div className="summary-card">
          <h3>신상품</h3>
          <p className="summary-value">28개</p>
          <span className="summary-change positive">↑ 이번 달 추가</span>
        </div>
      </div>

      {/* 차트 영역 */}
      <div className="charts-grid">
        {/* 상품별 판매 순위 */}
        <div className="chart-card full-width">
          <h3>🏆 상품별 판매 순위 Top 20</h3>
          <div className="chart-container extra-large">
            <Bar data={topProductsChartData} options={chartOptions} />
          </div>
        </div>

        {/* 카테고리별 매출 */}
        <div className="chart-card">
          <h3>🥧 카테고리별 매출 비중</h3>
          <div className="chart-container">
            <Doughnut data={categoryChartData} options={doughnutOptions} />
          </div>
        </div>

        {/* 상품 연령별 판매 */}
        <div className="chart-card">
          <h3>📊 상품 연령별 판매 현황</h3>
          <div className="chart-container">
            <Bar data={performanceChartData} options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false
                }
              }
            }} />
          </div>
        </div>

        {/* 재고 부족 상품 알림 */}
        <div className="chart-card full-width">
          <h3>⚠️ 재고 부족 상품 (10개 이하)</h3>
          <div className="stock-alert-list">
            {productData.lowStock?.length > 0 ? (
              productData.lowStock.map((product, index) => (
                <div key={index} className="stock-alert-item">
                  <div className="stock-info">
                    <span className="product-name">{product.name}</span>
                    <span className="product-option">{product.option}</span>
                  </div>
                  <div className="stock-value">
                    <span className={product.stock <= 5 ? 'critical' : 'warning'}>
                      재고: {product.stock}개
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="stock-alert-list">
                <div className="stock-alert-item">
                  <div className="stock-info">
                    <span className="product-name">린넨 셔츠</span>
                    <span className="product-option">화이트 / L</span>
                  </div>
                  <div className="stock-value">
                    <span className="critical">재고: 3개</span>
                  </div>
                </div>
                <div className="stock-alert-item">
                  <div className="stock-info">
                    <span className="product-name">슬림 진</span>
                    <span className="product-option">블루 / 30</span>
                  </div>
                  <div className="stock-value">
                    <span className="critical">재고: 5개</span>
                  </div>
                </div>
                <div className="stock-alert-item">
                  <div className="stock-info">
                    <span className="product-name">후드 티셔츠</span>
                    <span className="product-option">블랙 / M</span>
                  </div>
                  <div className="stock-value">
                    <span className="warning">재고: 8개</span>
                  </div>
                </div>
                <div className="stock-alert-item">
                  <div className="stock-info">
                    <span className="product-name">맨투맨</span>
                    <span className="product-option">그레이 / L</span>
                  </div>
                  <div className="stock-value">
                    <span className="warning">재고: 7개</span>
                  </div>
                </div>
                <div className="stock-alert-item">
                  <div className="stock-info">
                    <span className="product-name">스니커즈</span>
                    <span className="product-option">화이트 / 270</span>
                  </div>
                  <div className="stock-value">
                    <span className="warning">재고: 6개</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default ProductAnalytics;