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
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'Completed tasks',
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
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        datasets: [
          { label: 'New', data: [3, 5, 2, 8, 4], borderColor: '#3b82f6', tension: 0.3 },
          { label: 'Done', data: [1, 4, 3, 6, 5], borderColor: '#10b981', tension: 0.3 },
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
        labels: ['In progress', 'Done', 'Delayed', 'Pending'],
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
      <Paragraph>Chart.js is a charting library built on the HTML5 canvas. Every component you use must be registered with <Text code>Chart.register()</Text>.</Paragraph>

      <Divider titlePlacement="left">Chart examples</Divider>
      <Row gutter={16}>
        <Col span={12}>
          <Card title="Bar chart — completed tasks per month" size="small">
            <BarChartExample />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Doughnut chart — task status" size="small">
            <DoughnutChartExample />
          </Card>
        </Col>
      </Row>
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="Line chart — weekly task trend" size="small">
            <LineChartExample />
          </Card>
        </Col>
      </Row>

      <Divider titlePlacement="left">Basic usage pattern</Divider>
      <Card>
        <pre style={{ margin: 0, fontSize: 13 }}>{`import { Chart, CategoryScale, LinearScale, BarElement } from 'chart.js';

// Register the components you need
Chart.register(CategoryScale, LinearScale, BarElement);

// Create it inside useEffect
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
