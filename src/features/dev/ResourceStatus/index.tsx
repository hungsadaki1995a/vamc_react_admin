import { useState } from 'react';
import { Row, Col, Card, Progress, Statistic } from 'antd';
import { UserOutlined } from '@ant-design/icons';

interface ResourceStatus {
  id: string;
  name: string;
  department: string;
  utilizationRate: number;
  currentProjects: number;
}

const mockData: ResourceStatus[] = [
  { id: '1', name: '김철수', department: '개발팀', utilizationRate: 100, currentProjects: 1 },
  { id: '2', name: '이영희', department: '개발팀', utilizationRate: 80, currentProjects: 1 },
  { id: '3', name: '박지성', department: 'QA팀', utilizationRate: 100, currentProjects: 1 },
  { id: '4', name: '최민수', department: '디자인팀', utilizationRate: 60, currentProjects: 1 },
  { id: '5', name: '정수진', department: '개발팀', utilizationRate: 50, currentProjects: 1 },
  { id: '6', name: '강동원', department: 'QA팀', utilizationRate: 100, currentProjects: 1 },
  { id: '7', name: '윤서연', department: '기획팀', utilizationRate: 40, currentProjects: 1 },
  { id: '8', name: '임하늘', department: '디자인팀', utilizationRate: 80, currentProjects: 1 },
  { id: '9', name: '송민호', department: '개발팀', utilizationRate: 100, currentProjects: 1 },
  { id: '10', name: '한지민', department: '기획팀', utilizationRate: 30, currentProjects: 1 },
];

export default function ResourceStatus() {
  const [data] = useState<ResourceStatus[]>(mockData);

  const getProgressColor = (rate: number) => {
    if (rate >= 100) return '#ff4d4f';
    if (rate >= 80) return '#faad14';
    return '#52c41a';
  };

  const averageUtilization = Math.round(
    data.reduce((sum, item) => sum + item.utilizationRate, 0) / data.length
  );

  const overloadedCount = data.filter(item => item.utilizationRate >= 100).length;
  const availableCount = data.filter(item => item.utilizationRate < 80).length;

  return (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="평균 가동률"
              value={averageUtilization}
              suffix="%"
              styles={{ content: { color: '#1890ff' } }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="초과 배정"
              value={overloadedCount}
              suffix="명"
              styles={{ content: { color: '#ff4d4f' } }}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="여유 인력"
              value={availableCount}
              suffix="명"
              styles={{ content: { color: '#52c41a' } }}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {data.map(resource => (
          <Col key={resource.id} xs={24} sm={12} md={8} lg={6}>
            <Card>
              <div style={{ marginBottom: 8 }}>
                <strong>{resource.name}</strong>
                <span style={{ marginLeft: 8, color: '#888', fontSize: '12px' }}>
                  {resource.department}
                </span>
              </div>
              <Progress
                percent={resource.utilizationRate}
                strokeColor={getProgressColor(resource.utilizationRate)}
                status={resource.utilizationRate >= 100 ? 'exception' : 'normal'}
              />
              <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                진행 프로젝트: {resource.currentProjects}개
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </>
  );
}
