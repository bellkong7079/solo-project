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

function InventoryManagement() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [inventoryData, setInventoryData] = useState({
    stockByCategory: [],
    stockStatus: [],
    turnoverRate: [],
    slowMoving: []
  });

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      alert('관리자 로그인이 필요합니다.');
      navigate('/admin/login');
      return;
    }

    fetchInventoryData(token);
  }, [navigate]);

  const fetchInventoryData = async (token) => {
    try {
      const response = await axios.get('http://192.168.0.219:5000/api/admin/inventory', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setInventoryData(response.data);
    } catch (error) {
      console.error('재고 데이터 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 📦 카테고리별 재고 현황
  const stockChartData = {
    labels: inventoryData.stockByCategory?.map(c => c.name) || ['상의', '하의', '아우터', '신발', '악세서리'],
    datasets: [
      {
        label: '재고 수량',
        data: inventoryData.stockByCategory?.map(c => c.stock) || [850, 720, 620, 450, 280],
        backgroundColor: 'rgba(59, 130, 246, 0.8)'
      }
    ]
  };

  // 🎯 재고 상태 분포
  const statusChartData = {
    labels: ['정상 (50개 이상)', '주의 (20-49개)', '부족 (10-19개)', '긴급 (10개 미만)'],
    datasets: [
      {
        data: inventoryData.stockStatus?.map(s => s.count) || [156, 58, 23, 12],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ]
      }
    ]
  };

  // 📊 판매 속도별 분류
  const turnoverChartData = {
    labels: ['빠름 (주 10개 이상)', '보통 (주 5-9개)', '느림 (주 1-4개)', '매우 느림 (주 1개 미만)'],
    datasets: [
      {
        label: '상품 수',
        data: inventoryData.turnoverRate?.map(t => t.count) || [45, 85, 72, 43],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ]
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
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
        <h1>📦 재고 관리</h1>
        <p>재고 현황 및 회전율 분석</p>
      </div>

      {/* 요약 통계 */}
      <div className="analytics-summary">
        <div className="summary-card">
          <h3>전체 재고</h3>
          <p className="summary-value">2,920개</p>
        </div>
        <div className="summary-card warning">
          <h3>재고 부족</h3>
          <p className="summary-value">35개 상품</p>
          <span className="summary-change">⚠️ 조치 필요</span>
        </div>
        <div className="summary-card">
          <h3>평균 회전율</h3>
          <p className="summary-value">주 6.2개</p>
          <span className="summary-change positive">↑ 양호</span>
        </div>
        <div className="summary-card">
          <h3>재고 총액</h3>
          <p className="summary-value">148,500,000원</p>
        </div>
      </div>

      {/* 차트 영역 */}
      <div className="charts-grid">
        {/* 카테고리별 재고 */}
        <div className="chart-card">
          <h3>📦 카테고리별 재고 현황</h3>
          <div className="chart-container">
            <Bar data={stockChartData} options={chartOptions} />
          </div>
        </div>

        {/* 재고 상태 분포 */}
        <div className="chart-card">
          <h3>🎯 재고 상태 분포</h3>
          <div className="chart-container">
            <Doughnut data={statusChartData} options={doughnutOptions} />
          </div>
        </div>

        {/* 판매 속도별 분류 */}
        <div className="chart-card full-width">
          <h3>📊 판매 속도별 상품 분류</h3>
          <div className="chart-container">
            <Bar data={turnoverChartData} options={chartOptions} />
          </div>
        </div>

        {/* 재고 부족 상품 */}
        <div className="chart-card full-width">
          <h3>🚨 긴급 재고 부족 상품 (10개 미만)</h3>
          <div className="inventory-table">
            <table>
              <thead>
                <tr>
                  <th>상품명</th>
                  <th>옵션</th>
                  <th>현재 재고</th>
                  <th>일 판매량</th>
                  <th>재고 소진 예상</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                <tr className="critical">
                  <td>린넨 셔츠</td>
                  <td>화이트 / L</td>
                  <td className="stock-value">3개</td>
                  <td>1.2개/일</td>
                  <td className="danger">2-3일</td>
                  <td><span className="badge danger">긴급</span></td>
                </tr>
                <tr className="critical">
                  <td>슬림 진</td>
                  <td>블루 / 30</td>
                  <td className="stock-value">5개</td>
                  <td>0.8개/일</td>
                  <td className="danger">6일</td>
                  <td><span className="badge danger">긴급</span></td>
                </tr>
                <tr className="warning">
                  <td>후드 티셔츠</td>
                  <td>블랙 / M</td>
                  <td className="stock-value">8개</td>
                  <td>0.6개/일</td>
                  <td className="warning">13일</td>
                  <td><span className="badge warning">주의</span></td>
                </tr>
                <tr className="warning">
                  <td>맨투맨</td>
                  <td>그레이 / L</td>
                  <td className="stock-value">7개</td>
                  <td>0.5개/일</td>
                  <td className="warning">14일</td>
                  <td><span className="badge warning">주의</span></td>
                </tr>
                <tr className="warning">
                  <td>스니커즈</td>
                  <td>화이트 / 270</td>
                  <td className="stock-value">6개</td>
                  <td>0.4개/일</td>
                  <td className="warning">15일</td>
                  <td><span className="badge warning">주의</span></td>
                </tr>
                <tr className="warning">
                  <td>가디건</td>
                  <td>베이지 / M</td>
                  <td className="stock-value">9개</td>
                  <td>0.5개/일</td>
                  <td className="warning">18일</td>
                  <td><span className="badge warning">주의</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 장기 미판매 상품 */}
        <div className="chart-card full-width">
          <h3>🐢 장기 미판매 상품 (60일 이상)</h3>
          <div className="inventory-table">
            <table>
              <thead>
                <tr>
                  <th>상품명</th>
                  <th>옵션</th>
                  <th>재고</th>
                  <th>마지막 판매일</th>
                  <th>미판매 기간</th>
                  <th>권장 조치</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>체크 셔츠</td>
                  <td>레드 / XL</td>
                  <td>42개</td>
                  <td>2025-10-15</td>
                  <td>103일</td>
                  <td><span className="badge info">할인 진행</span></td>
                </tr>
                <tr>
                  <td>카고 팬츠</td>
                  <td>카키 / 34</td>
                  <td>38개</td>
                  <td>2025-10-28</td>
                  <td>90일</td>
                  <td><span className="badge info">할인 검토</span></td>
                </tr>
                <tr>
                  <td>플리스 집업</td>
                  <td>네이비 / L</td>
                  <td>35개</td>
                  <td>2025-11-05</td>
                  <td>82일</td>
                  <td><span className="badge info">프로모션</span></td>
                </tr>
                <tr>
                  <td>와이드 팬츠</td>
                  <td>블랙 / L</td>
                  <td>32개</td>
                  <td>2025-11-12</td>
                  <td>75일</td>
                  <td><span className="badge info">재고 정리</span></td>
                </tr>
                <tr>
                  <td>니트 조끼</td>
                  <td>브라운 / M</td>
                  <td>28개</td>
                  <td>2025-11-18</td>
                  <td>69일</td>
                  <td><span className="badge info">번들 판매</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default InventoryManagement;