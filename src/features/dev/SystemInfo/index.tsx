import { Typography, Card, Row, Col, Tag, Table, Divider } from 'antd';
import type { TableColumnsType } from 'antd';
import { menuConfig } from '@/config/menuConfig';
import type { MenuItem } from '@/types/menu';

const { Text } = Typography;

function countMenus(items: MenuItem[]): { total: number; leaf: number } {
  let total = 0;
  let leaf = 0;
  for (const item of items) {
    total++;
    if (!item.children) {
      leaf++;
    } else {
      const child = countMenus(item.children);
      total += child.total;
      leaf += child.leaf;
    }
  }
  return { total, leaf };
}

const menuCounts = countMenus(menuConfig);

const depInfo = [
  { name: 'React', version: '19.x', type: 'prod' },
  { name: 'TypeScript', version: '5.x', type: 'dev' },
  { name: 'Vite', version: '7.x', type: 'dev' },
  { name: 'Ant Design', version: '6.x', type: 'prod' },
  { name: 'Zustand', version: '5.x', type: 'prod' },
  { name: '@tanstack/react-query', version: '5.x', type: 'prod' },
  { name: 'AG Grid Community', version: '35.x', type: 'prod' },
  { name: 'TipTap', version: '3.x', type: 'prod' },
  { name: 'Monaco Editor', version: '0.x', type: 'prod' },
  { name: 'frappe-gantt', version: '1.2.2', type: 'prod' },
  { name: 'Chart.js', version: '4.x', type: 'prod' },
  { name: 'dayjs', version: '1.x', type: 'prod' },
  { name: 'Lodash', version: '4.x', type: 'prod' },
  { name: 'Axios', version: '1.x', type: 'prod' },
];

const columns: TableColumnsType<(typeof depInfo)[0]> = [
  { title: '패키지', dataIndex: 'name', key: 'name', render: (v) => <Text code>{v}</Text> },
  { title: '버전', dataIndex: 'version', key: 'version' },
  { title: '종류', dataIndex: 'type', key: 'type', render: (v) => <Tag color={v === 'prod' ? 'blue' : 'default'}>{v}</Tag> },
];

export default function SystemInfo() {
  return (
    <>
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card size="small" title="프론트엔드">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                ['앱 이름', 'VAMC NPL ADMIN'],
                ['빌드 도구', 'Vite 7'],
                ['런타임', 'React 19 + TypeScript'],
                ['상태관리', 'Zustand + React Query'],
                ['UI 라이브러리', 'Ant Design 6'],
                ['아키텍처', 'Tab-driven SPA'],
                ['개발 서버 포트', '5173'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', gap: 8, fontSize: 13 }}>
                  <Text style={{ width: 130, flexShrink: 0, color: '#555', fontWeight: 500 }}>{k}</Text>
                  <Text>{v}</Text>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        <Col span={12}>
          <Card size="small" title="백엔드">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                ['프레임워크', 'Spring Boot 3.5.6'],
                ['언어', 'Java 21'],
                ['ORM', 'MyBatis'],
                ['DB', 'MariaDB'],
                ['인증', 'JWT (Access + Refresh)'],
                ['API 포트 (local)', '8180'],
                ['빌드', 'Maven (WAR)'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', gap: 8, fontSize: 13 }}>
                  <Text style={{ width: 130, flexShrink: 0, color: '#555', fontWeight: 500 }}>{k}</Text>
                  <Text>{v}</Text>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        <Col span={8}>
          <Card size="small" title="메뉴 통계">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">전체 메뉴</Text><Text strong>{menuCounts.total}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">페이지 메뉴</Text><Text strong>{menuCounts.leaf}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">1단계 그룹</Text><Text strong>{menuConfig.length}</Text>
              </div>
            </div>
          </Card>
        </Col>

        <Col span={8}>
          <Card size="small" title="환경">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
              {[
                ['NODE_ENV', import.meta.env.MODE],
                ['API Base URL', import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8180'],
                ['Base URL', import.meta.env.BASE_URL ?? '/'],
              ].map(([k, v]) => (
                <div key={k}>
                  <Text type="secondary" style={{ fontSize: 12 }}>{k}</Text>
                  <br />
                  <Text code style={{ fontSize: 11 }}>{v}</Text>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        <Col span={8}>
          <Card size="small" title="빌드 정보">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
              {[
                ['빌드 일시', new Date().toLocaleDateString('ko-KR')],
                ['플랫폼', navigator.platform],
                ['User Agent', navigator.userAgent.split(' ')[0]],
              ].map(([k, v]) => (
                <div key={k}>
                  <Text type="secondary" style={{ fontSize: 12 }}>{k}</Text>
                  <br />
                  <Text style={{ fontSize: 12 }}>{v}</Text>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      <Divider titlePlacement="left" style={{ marginTop: 24 }}>주요 의존성</Divider>
      <Table
        dataSource={depInfo.map((d, i) => ({ ...d, key: i }))}
        columns={columns}
        size="small"
        pagination={false}
        style={{ maxWidth: 500 }}
      />
    </>
  );
}
