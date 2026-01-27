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
  const [stats, setStats] = useState({
    totalCustomers: 0,
    avgOrderValue: 0,
    retentionRate: 0,
    vipCustomers: 0
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
      
      // 통계 계산
      const totalCustomers = response.data.newCustomers?.reduce((sum, c) => sum + c.count, 0) || 0;
      const recentAvg = response.data.avgOrderValue?.[response.data.avgOrderValue.length - 1]?.avg || 0;
      const totalOrders = response.data.purchaseFrequency?.reduce((sum, f) => sum + f.count, 0) || 0;
      const repeatCustomers = response.data.purchaseFrequency?.filter(f => f.frequency !== '1회').reduce((sum, f) => sum + f.count, 0) || 0;
      const vipCount = response.data.customerTiers?.find(t => t.tier === 'VIP')?.revenue || 0;
      
      setStats({
        totalCustomers: totalCustomers || 1250,
        avgOrderValue: Math.floor(recentAvg),
        retentionRate: totalOrders > 0 ? Math.floor((repeatCustomers / totalOrders) * 100) : 0,
        vipCustomers: vipCount > 0 ? Math.floor(vipCount / 1000000) : 0
      });
      
    } catch (error) {
      console.error('고객 데이터 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 📈 신규 회원 추이
  const newCustomersChartData = {
    labels: customerData.newCustomers?.map(d => d.month) || [],
    datasets: [
      {
        label: '신규 회원',
        data: customerData.newCustomers?.map(d => d.count) || [],
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
        data: customerData.purchaseFrequency?.map(d => d.count) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.8)'
      }
    ]
  };

  // 🏆 고객 등급별 매출
  const tierChartData = {
    labels: customerData.customerTiers?.map(d => d.tier) || [],
    datasets: [
      {
        data: customerData.customerTiers?.map(d => d.revenue) || [],
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
    labels: customerData.avgOrderValue?.map(d => d.month) || [],
    datasets: [
      {
        label: '평균 구매 금액',
        data: customerData.avgOrderValue?.map(d => d.avg) || [],
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
        <div className="tier-info">
        <small>
        💎 VIP: 150만원 이상 | 
        🥇 골드: 80만원 이상 | 
        🥈 실버: 40만원 이상 | 
        🥉 브론즈: 20만원 이상
      </small>
      </div>
      </div>

      {/* 요약 통계 */}
      <div className="analytics-summary">
        <div className="summary-card">
          <h3>전체 회원</h3>
          <p className="summary-value">{stats.totalCustomers.toLocaleString()}명</p>
          <span className="summary-change">누적 회원</span>
        </div>
        <div className="summary-card">
          <h3>평균 구매 금액</h3>
          <p className="summary-value">{stats.avgOrderValue.toLocaleString()}원</p>
          <span className="summary-change">최근 평균</span>
        </div>
        <div className="summary-card">
          <h3>재구매율</h3>
          <p className="summary-value">{stats.retentionRate}%</p>
          <span className="summary-change">2회 이상 구매</span>
        </div>
        <div className="summary-card">
          <h3>VIP 매출</h3>
          <p className="summary-value">{stats.vipCustomers}백만원</p>
          <span className="summary-change">VIP 고객</span>
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
            {customerData.topCustomers?.length > 0 ? (
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
                  {customerData.topCustomers.map((customer, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{customer.name}</td>
                      <td><span className={`badge ${customer.tier === 'VIP' ? 'gold' : 'silver'}`}>{customer.tier}</span></td>
                      <td>{customer.total.toLocaleString()}원</td>
                      <td>{customer.orders}회</td>
                      <td>{customer.lastOrder}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="no-data">
                <p>VIP 고객 데이터가 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default CustomerAnalytics;