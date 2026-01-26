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
    weekdaySales: [],
    monthlyGrowth: []
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
      const response = await axios.get('http://192.168.0.219:5000/api/admin/analytics/sales', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSalesData(response.data);
    } catch (error) {
      console.error('매출 데이터 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 📈 월별 매출 추이 (12개월)
  const monthlyChartData = {
    labels: salesData.monthlySales?.map(d => d.month) || ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
    datasets: [
      {
        label: '월별 매출',
        data: salesData.monthlySales?.map(d => d.total) || [4500000, 5200000, 6100000, 5800000, 7200000, 8500000, 9200000, 8800000, 9500000, 10200000, 11500000, 12800000],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  // 📊 일별 매출 (최근 30일)
  const dailyChartData = {
    labels: salesData.dailySales?.map(d => d.date) || Array.from({length: 30}, (_, i) => `${i+1}일`),
    datasets: [
      {
        label: '일별 매출',
        data: salesData.dailySales?.map(d => d.total) || Array.from({length: 30}, () => Math.floor(Math.random() * 500000) + 200000),
        backgroundColor: 'rgba(16, 185, 129, 0.8)'
      }
    ]
  };

  // ⏰ 시간대별 주문량
  const hourlyChartData = {
    labels: ['0시', '3시', '6시', '9시', '12시', '15시', '18시', '21시'],
    datasets: [
      {
        label: '시간대별 주문 건수',
        data: salesData.hourlySales?.map(d => d.count) || [5, 2, 8, 45, 89, 123, 156, 98],
        borderColor: 'rgb(245, 158, 11)',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  // 📅 요일별 매출
  const weekdayChartData = {
    labels: ['월', '화', '수', '목', '금', '토', '일'],
    datasets: [
      {
        label: '요일별 평균 매출',
        data: salesData.weekdaySales?.map(d => d.total) || [850000, 920000, 980000, 1050000, 1200000, 1850000, 1650000],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(239, 68, 68, 0.8)',
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
          <p className="summary-value">12,800,000원</p>
          <span className="summary-change positive">↑ 11.3%</span>
        </div>
        <div className="summary-card">
          <h3>오늘 매출</h3>
          <p className="summary-value">420,000원</p>
          <span className="summary-change positive">↑ 5.2%</span>
        </div>
        <div className="summary-card">
          <h3>평균 객단가</h3>
          <p className="summary-value">85,000원</p>
          <span className="summary-change negative">↓ 2.1%</span>
        </div>
        <div className="summary-card">
          <h3>이번 주 주문</h3>
          <p className="summary-value">148건</p>
          <span className="summary-change positive">↑ 8.7%</span>
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