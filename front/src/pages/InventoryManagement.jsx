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
  const [stats, setStats] = useState({
    totalStock: 0,
    lowStockCount: 0,
    avgTurnover: 0,
    totalValue: 0
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
      
      // 통계 계산 (숫자로 명확히 변환)
      const totalStock = response.data.stockByCategory?.reduce((sum, c) => sum + Number(c.stock || 0), 0) || 0;
      const lowStock = response.data.stockStatus?.find(s => s.status === 'critical')?.count || 0;
      const lowStockCount = response.data.lowStockItems?.length || 0;
      const normalTurnover = response.data.turnoverRate?.find(t => t.speed === 'normal')?.count || 0;
      const fastTurnover = response.data.turnoverRate?.find(t => t.speed === 'fast')?.count || 0;
      
      setStats({
        totalStock: totalStock,
        lowStockCount: lowStockCount,
        avgTurnover: Number(normalTurnover) + Number(fastTurnover),
        totalValue: totalStock * 50000  // Math.floor 제거
      });
      
    } catch (error) {
      console.error('재고 데이터 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 📦 카테고리별 재고 현황
  const stockChartData = {
    labels: inventoryData.stockByCategory?.map(c => c.name) || [],
    datasets: [
      {
        label: '재고 수량',
        data: inventoryData.stockByCategory?.map(c => c.stock) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.8)'
      }
    ]
  };

  // 🎯 재고 상태 분포
  const statusChartData = {
    labels: ['정상 (50개 이상)', '주의 (20-49개)', '부족 (10-19개)', '긴급 (10개 미만)'],
    datasets: [
      {
        data: inventoryData.stockStatus?.map(s => s.count) || [],
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
        data: inventoryData.turnoverRate?.map(t => t.count) || [],
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
          <p className="summary-value">{stats.totalStock.toLocaleString()}개</p>
        </div>
        <div className="summary-card warning">
          <h3>재고 부족</h3>
          <p className="summary-value">{stats.lowStockCount}개 상품</p>
          <span className="summary-change">⚠️ 조치 필요</span>
        </div>
        <div className="summary-card">
          <h3>정상 회전율</h3>
          <p className="summary-value">{stats.avgTurnover}개 상품</p>
          <span className="summary-change positive">↑ 양호</span>
        </div>
        <div className="summary-card">
          <h3>재고 총액</h3>
          <p className="summary-value">{stats.totalValue.toLocaleString()}원</p>
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
            {inventoryData.lowStockItems?.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>상품명</th>
                    <th>옵션</th>
                    <th>현재 재고</th>
                    <th>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryData.lowStockItems.map((item, index) => (
                    <tr key={index} className={item.stock <= 5 ? 'critical' : 'warning'}>
                      <td>{item.product_name}</td>
                      <td>{item.option_name}: {item.option_value}</td>
                      <td className="stock-value">{item.stock}개</td>
                      <td>
                        <span className={`badge ${item.stock <= 5 ? 'danger' : 'warning'}`}>
                          {item.stock <= 5 ? '긴급' : '주의'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="no-data">
                <p>재고 부족 상품이 없습니다.</p>
              </div>
            )}
          </div>
        </div>

        {/* 장기 미판매 상품 */}
        <div className="chart-card full-width">
          <h3>🐢 장기 미판매 상품 (60일 이상)</h3>
          <div className="inventory-table">
            {inventoryData.slowMoving?.length > 0 ? (
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
                  {inventoryData.slowMoving.map((item, index) => (
                    <tr key={index}>
                      <td>{item.name}</td>
                      <td>{item.option}</td>
                      <td>{item.stock}개</td>
                      <td>{item.last_sale_date ? new Date(item.last_sale_date).toLocaleDateString('ko-KR') : '판매 기록 없음'}</td>
                      <td>{item.days_since_sale || 'N/A'}일</td>
                      <td>
                        <span className="badge info">
                          {item.days_since_sale > 90 ? '할인 진행' : 
                           item.days_since_sale > 75 ? '할인 검토' : 
                           item.days_since_sale > 60 ? '프로모션' : '재고 정리'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="no-data">
                <p>장기 미판매 상품이 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default InventoryManagement;