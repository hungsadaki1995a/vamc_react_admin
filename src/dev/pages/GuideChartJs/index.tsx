import { useEffect, useRef } from 'react';
import { Typography, Card, Divider, Row, Col } from 'antd';
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  DoughnutController,
  ArcElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
} from 'chart.js';
import DevPageHeader from '@/dev/DevPageHeader';

const { Paragraph, Text } = Typography;

Chart.register(
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  DoughnutController,
  ArcElement,
  ChartTitle,
  Tooltip,
  Legend,
);

function BarChartExample() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels: ['1월', '2월', '3월', '4월', '5월', '6월'],
        datasets: [{
          label: '완료 태스크',
          data: [12, 19, 8, 15, 22, 17],
          backgroundColor: 'rgba(59, 130, 246, 0.7)',
        }],
      },
      options: { responsive: true, plugins: { legend: { position: 'top' } } },
    });
    return () => { chartRef.current?.destroy(); };
  }, []);

  return <canvas ref={canvasRef} />;
}

function LineChartExample() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels: ['월', '화', '수', '목', '금'],
        datasets: [
          { label: '신규', data: [3, 5, 2, 8, 4], borderColor: '#3b82f6', tension: 0.3 },
          { label: '완료', data: [1, 4, 3, 6, 5], borderColor: '#10b981', tension: 0.3 },
        ],
      },
      options: { responsive: true },
    });
    return () => { chartRef.current?.destroy(); };
  }, []);

  return <canvas ref={canvasRef} />;
}

function DoughnutChartExample() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new Chart(canvasRef.current, {
      type: 'doughnut',
      data: {
        labels: ['진행중', '완료', '지연', '대기'],
        datasets: [{
          data: [45, 30, 15, 10],
          backgroundColor: ['#3b82f6', '#10b981', '#ef4444', '#f59e0b'],
        }],
      },
      options: { responsive: true },
    });
    return () => { chartRef.current?.destroy(); };
  }, []);

  return <canvas ref={canvasRef} />;
}

export default function GuideChartJs() {
  return (
    <div style={{ padding: 24 }}>
      <DevPageHeader page="GuideChartJs" />
      <Paragraph>Chart.js는 HTML5 Canvas 기반의 차트 라이브러리입니다. 반드시 필요한 컴포넌트를 <Text code>Chart.register()</Text>로 등록해야 합니다.</Paragraph>

      <Divider titlePlacement="left">차트 예제</Divider>
      <Row gutter={16}>
        <Col span={12}>
          <Card title="Bar Chart — 월별 완료 태스크" size="small">
            <BarChartExample />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Doughnut Chart — 태스크 현황" size="small">
            <DoughnutChartExample />
          </Card>
        </Col>
      </Row>
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="Line Chart — 주간 태스크 추이" size="small">
            <LineChartExample />
          </Card>
        </Col>
      </Row>

      <Divider titlePlacement="left">기본 사용 패턴</Divider>
      <Card>
        <pre style={{ margin: 0, fontSize: 13 }}>{`import { Chart, CategoryScale, LinearScale, BarElement } from 'chart.js';

// 필요한 컴포넌트 등록
Chart.register(CategoryScale, LinearScale, BarElement);

// useEffect에서 생성
useEffect(() => {
  const chart = new Chart(canvasRef.current, {
    type: 'bar',
    data: { labels: [...], datasets: [{ label: '...', data: [...] }] },
    options: { responsive: true },
  });
  // cleanup
  return () => chart.destroy();
}, [data]);`}</pre>
      </Card>
    </div>
  );
}
