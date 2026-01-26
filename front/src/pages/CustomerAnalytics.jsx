import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AdminLayout from '../components/AdminLayout';
import './AnalyticsPages.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function CustomerAnalytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [customerData, setCustomerData] = useState({
    newCustomers: [],
    purchaseFrequency: [],
    customerTiers: [],
    avgOrderValue: [],
    retentionRate: []
  });

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      alert('관리자 로그인이 필요합니다.');
      navigate('/admin/login');
      return;
    }

    fetchCustomerData(token);
  }, [navigate]);

  const fetchCustomerData = async (token) => {
    try {
      const response = await axios.get('http://192.168.0.219:5000/api/admin/analytics/customers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setCustomerData(response.data);
    } catch (error) {
      console.error('고객 데이터 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 📈 신규 회원 추이
  const newCustomersChartData = {
    labels: customerData.newCustomers?.map(d => d.month) || ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
    datasets: [
      {
        label: '신규 회원',
        data: customerData.newCustomers?.map(d => d.count) || [45, 52, 68, 58, 72, 85, 92, 88, 95, 108, 125, 142],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  // 📊 구매 빈도 분포
  const frequencyChartData = {
    labels: ['1회', '2회', '3-5회', '6-10회', '11회 이상'],
    datasets: [
      {
        label: '고객 수',
        data: customerData.purchaseFrequency?.map(d => d.count) || [580, 245, 182, 95, 48],
        backgroundColor: 'rgba(59, 130, 246, 0.8)'
      }
    ]
  };

  // 🏆 고객 등급별 매출
  const tierChartData = {
    labels: customerData.customerTiers?.map(d => d.tier) || ['VIP', '골드', '실버', '브론즈', '일반'],
    datasets: [
      {
        data: customerData.customerTiers?.map(d => d.revenue) || [8500000, 6200000, 4800000, 3200000, 2100000],
        backgroundColor: [
          'rgba(245, 158, 11, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(156, 163, 175, 0.8)',
          'rgba(217, 119, 6, 0.8)',
          'rgba(209, 213, 219, 0.8)'
        ]
      }
    ]
  };

  // 💰 평균 구매 금액 추이
  const avgOrderChartData = {
    labels: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
    datasets: [
      {
        label: '평균 구매 금액',
        data: customerData.avgOrderValue?.map(d => d.avg) || [78000, 82000, 85000, 79000, 88000, 92000, 95000, 91000, 89000, 94000, 98000, 102000],
        borderColor: 'rgb(139, 92, 246)',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  const moneyOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return value.toLocaleString() + '원';
          }
        }
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
        <h1>👥 고객 분석</h1>
        <p>고객 현황 및 구매 패턴 분석</p>
      </div>

      {/* 요약 통계 */}
      <div className="analytics-summary">
        <div className="summary-card">
          <h3>전체 회원</h3>
          <p className="summary-value">1,250명</p>
          <span className="summary-change positive">↑ 142명 (이번 달)</span>
        </div>
        <div className="summary-card">
          <h3>평균 구매 금액</h3>
          <p className="summary-value">102,000원</p>
          <span className="summary-change positive">↑ 4.1%</span>
        </div>
        <div className="summary-card">
          <h3>재구매율</h3>
          <p className="summary-value">42.5%</p>
          <span className="summary-change positive">↑ 2.3%</span>
        </div>
        <div className="summary-card">
          <h3>VIP 고객</h3>
          <p className="summary-value">48명</p>
          <span className="summary-change">총 매출의 34%</span>
        </div>
      </div>

      {/* 차트 영역 */}
      <div className="charts-grid">
        {/* 신규 회원 추이 */}
        <div className="chart-card full-width">
          <h3>📈 월별 신규 회원 추이</h3>
          <div className="chart-container">
            <Line data={newCustomersChartData} options={chartOptions} />
          </div>
        </div>

        {/* 구매 빈도 */}
        <div className="chart-card">
          <h3>📊 고객별 구매 빈도 분포</h3>
          <div className="chart-container">
            <Bar data={frequencyChartData} options={chartOptions} />
          </div>
        </div>

        {/* 고객 등급별 매출 */}
        <div className="chart-card">
          <h3>🏆 고객 등급별 매출 기여도</h3>
          <div className="chart-container">
            <Doughnut data={tierChartData} options={doughnutOptions} />
          </div>
        </div>

        {/* 평균 구매 금액 */}
        <div className="chart-card full-width">
          <h3>💰 월별 평균 구매 금액 추이</h3>
          <div className="chart-container">
            <Line data={avgOrderChartData} options={moneyOptions} />
          </div>
        </div>

        {/* VIP 고객 목록 */}
        <div className="chart-card full-width">
          <h3>⭐ VIP 고객 Top 10</h3>
          <div className="customer-list">
            <table>
              <thead>
                <tr>
                  <th>순위</th>
                  <th>고객명</th>
                  <th>등급</th>
                  <th>총 구매액</th>
                  <th>구매 횟수</th>
                  <th>최근 구매일</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1</td>
                  <td>김**</td>
                  <td><span className="badge gold">VIP</span></td>
                  <td>3,280,000원</td>
                  <td>24회</td>
                  <td>2026-01-25</td>
                </tr>
                <tr>
                  <td>2</td>
                  <td>이**</td>
                  <td><span className="badge gold">VIP</span></td>
                  <td>2,950,000원</td>
                  <td>21회</td>
                  <td>2026-01-23</td>
                </tr>
                <tr>
                  <td>3</td>
                  <td>박**</td>
                  <td><span className="badge gold">VIP</span></td>
                  <td>2,720,000원</td>
                  <td>19회</td>
                  <td>2026-01-26</td>
                </tr>
                <tr>
                  <td>4</td>
                  <td>최**</td>
                  <td><span className="badge gold">VIP</span></td>
                  <td>2,580,000원</td>
                  <td>18회</td>
                  <td>2026-01-22</td>
                </tr>
                <tr>
                  <td>5</td>
                  <td>정**</td>
                  <td><span className="badge gold">VIP</span></td>
                  <td>2,450,000원</td>
                  <td>17회</td>
                  <td>2026-01-24</td>
                </tr>
                <tr>
                  <td>6</td>
                  <td>강**</td>
                  <td><span className="badge gold">VIP</span></td>
                  <td>2,320,000원</td>
                  <td>16회</td>
                  <td>2026-01-21</td>
                </tr>
                <tr>
                  <td>7</td>
                  <td>조**</td>
                  <td><span className="badge silver">골드</span></td>
                  <td>2,180,000원</td>
                  <td>15회</td>
                  <td>2026-01-25</td>
                </tr>
                <tr>
                  <td>8</td>
                  <td>윤**</td>
                  <td><span className="badge silver">골드</span></td>
                  <td>2,050,000원</td>
                  <td>14회</td>
                  <td>2026-01-20</td>
                </tr>
                <tr>
                  <td>9</td>
                  <td>장**</td>
                  <td><span className="badge silver">골드</span></td>
                  <td>1,920,000원</td>
                  <td>13회</td>
                  <td>2026-01-23</td>
                </tr>
                <tr>
                  <td>10</td>
                  <td>임**</td>
                  <td><span className="badge silver">골드</span></td>
                  <td>1,850,000원</td>
                  <td>12회</td>
                  <td>2026-01-22</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default CustomerAnalytics;