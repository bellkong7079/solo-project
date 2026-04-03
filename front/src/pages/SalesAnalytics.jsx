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
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function SalesAnalytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState({
    monthlySales: [],
    dailySales: [],
    hourlySales: [],
    weekdaySales: []
  });
  const [stats, setStats] = useState({
    thisMonthSales: 0,
    todaySales: 0,
    avgOrderValue: 0,
    thisWeekOrders: 0
  });

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      alert('관리자 로그인이 필요합니다.');
      navigate('/admin/login');
      return;
    }

    fetchSalesData(token);
  }, [navigate]);

  const fetchSalesData = async (token) => {
    try {
      const response = await axios.get('http://192.168.0.225:5000/api/admin/analytics/sales', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSalesData(response.data);
      
      // 통계 계산
      const thisMonth = response.data.monthlySales?.[response.data.monthlySales.length - 1]?.total || 0;
      const today = response.data.dailySales?.[response.data.dailySales.length - 1]?.total || 0;
      const recentOrders = response.data.dailySales?.slice(-7).reduce((sum, d) => sum + d.total, 0) || 0;
      const weekOrders = response.data.dailySales?.slice(-7).length || 0;
      
      setStats({
        thisMonthSales: thisMonth,
        todaySales: today,
        avgOrderValue: weekOrders > 0 ? Math.floor(recentOrders / weekOrders) : 0,
        thisWeekOrders: response.data.dailySales?.slice(-7).reduce((sum, d) => sum + 1, 0) || 0
      });
      
    } catch (error) {
      console.error('매출 데이터 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 📈 월별 매출 추이 (12개월)
  const monthlyChartData = {
    labels: salesData.monthlySales?.map(d => d.month) || [],
    datasets: [
      {
        label: '월별 매출',
        data: salesData.monthlySales?.map(d => d.total) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  // 📊 일별 매출 (최근 30일)
  const dailyChartData = {
    labels: salesData.dailySales?.map(d => d.date) || [],
    datasets: [
      {
        label: '일별 매출',
        data: salesData.dailySales?.map(d => d.total) || [],
        backgroundColor: 'rgba(16, 185, 129, 0.8)'
      }
    ]
  };

  // ⏰ 시간대별 주문량
  const hourlyChartData = {
    labels: salesData.hourlySales?.map(d => `${d.hour}시`) || [],
    datasets: [
      {
        label: '시간대별 주문 건수',
        data: salesData.hourlySales?.map(d => d.count) || [],
        borderColor: 'rgb(245, 158, 11)',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  // 📅 요일별 매출
  const weekdayChartData = {
    labels: ['일', '월', '화', '수', '목', '금', '토'],
    datasets: [
      {
        label: '요일별 평균 매출',
        data: salesData.weekdaySales?.map(d => d.total) || [],
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(251, 146, 60, 0.8)'
        ]
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
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return value.toLocaleString() + '원';
          }
        }
      }
    }
  };

  const countOptions = {
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
            return value + '건';
          }
        }
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
        <h1>💰 매출 분석</h1>
        <p>매출 추이 및 패턴 분석</p>
      </div>

      {/* 요약 통계 */}
      <div className="analytics-summary">
        <div className="summary-card">
          <h3>이번 달 매출</h3>
          <p className="summary-value">{stats.thisMonthSales.toLocaleString()}원</p>
          <span className="summary-change">월별 매출</span>
        </div>
        <div className="summary-card">
          <h3>오늘 매출</h3>
          <p className="summary-value">{stats.todaySales.toLocaleString()}원</p>
          <span className="summary-change">일일 매출</span>
        </div>
        <div className="summary-card">
          <h3>평균 객단가</h3>
          <p className="summary-value">{stats.avgOrderValue.toLocaleString()}원</p>
          <span className="summary-change">최근 7일 평균</span>
        </div>
        <div className="summary-card">
          <h3>이번 주 주문</h3>
          <p className="summary-value">{stats.thisWeekOrders}건</p>
          <span className="summary-change">최근 7일</span>
        </div>
      </div>

      {/* 차트 영역 */}
      <div className="charts-grid">
        {/* 월별 매출 추이 */}
        <div className="chart-card full-width">
          <h3>📈 월별 매출 추이 (12개월)</h3>
          <div className="chart-container large">
            <Line data={monthlyChartData} options={chartOptions} />
          </div>
        </div>

        {/* 일별 매출 */}
        <div className="chart-card">
          <h3>📊 최근 30일 매출</h3>
          <div className="chart-container">
            <Bar data={dailyChartData} options={chartOptions} />
          </div>
        </div>

        {/* 시간대별 주문 */}
        <div className="chart-card">
          <h3>⏰ 시간대별 주문량</h3>
          <div className="chart-container">
            <Line data={hourlyChartData} options={countOptions} />
          </div>
        </div>

        {/* 요일별 매출 */}
        <div className="chart-card full-width">
          <h3>📅 요일별 평균 매출</h3>
          <div className="chart-container">
            <Bar data={weekdayChartData} options={chartOptions} />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default SalesAnalytics;