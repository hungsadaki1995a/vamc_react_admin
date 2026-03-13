import { useState } from 'react';
import { Tag, Button, Space, Empty, Input } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import GridToolbar from '@/components/layout/GridToolbar';
import styles from './index.module.css';

interface Project {
  id: string;
  name: string;
  status: 'active' | 'pending' | 'done';
  manager: string;
  startDate: string;
  endDate: string;
  description: string;
  budget: string;
}

const sampleProjects: Project[] = [
  { id: 'P001', name: '디지털 전환 플랫폼', status: 'active', manager: '홍길동', startDate: '2025-01-01', endDate: '2025-12-31', description: '기업 내부 시스템의 디지털 전환을 위한 플랫폼 구축 프로젝트입니다.', budget: '5억원' },
  { id: 'P002', name: '모바일 앱 개발', status: 'active', manager: '김철수', startDate: '2025-03-01', endDate: '2025-09-30', description: '고객 대상 모바일 앱 신규 개발 프로젝트입니다.', budget: '2억원' },
  { id: 'P003', name: 'ERP 고도화', status: 'pending', manager: '이영희', startDate: '2025-04-01', endDate: '2026-03-31', description: 'ERP 시스템 기능 고도화 및 성능 개선 프로젝트입니다.', budget: '8억원' },
  { id: 'P004', name: '보안 강화 프로젝트', status: 'done', manager: '박민수', startDate: '2024-09-01', endDate: '2025-02-28', description: '전사 보안 체계 강화를 위한 프로젝트입니다.', budget: '1.5억원' },
  { id: 'P005', name: '빅데이터 분석 플랫폼', status: 'pending', manager: '최지영', startDate: '2025-05-01', endDate: '2026-04-30', description: '데이터 기반 의사결정을 위한 분석 플랫폼 구축입니다.', budget: '6억원' },
  { id: 'P006', name: '클라우드 마이그레이션', status: 'active', manager: '임재혁', startDate: '2025-02-01', endDate: '2025-10-31', description: '온프레미스 인프라를 AWS 클라우드로 단계적으로 전환합니다.', budget: '4억원' },
  { id: 'P007', name: 'AI 챗봇 도입', status: 'active', manager: '정민우', startDate: '2025-04-01', endDate: '2025-11-30', description: '고객 서비스 자동화를 위한 AI 기반 챗봇 시스템을 도입합니다.', budget: '1.5억원' },
  { id: 'P008', name: 'HR 셀프서비스 포털', status: 'pending', manager: '오하늘', startDate: '2025-04-15', endDate: '2025-11-30', description: '임직원이 HR 업무를 스스로 처리할 수 있는 셀프서비스 포털 구축입니다.', budget: '1.2억원' },
  { id: 'P009', name: '전자결재 시스템 고도화', status: 'active', manager: '이미영', startDate: '2025-03-01', endDate: '2025-08-31', description: '기존 전자결재 시스템의 기능 개선 및 모바일 지원을 추가합니다.', budget: '1.8억원' },
  { id: 'P010', name: 'CRM 시스템 구축', status: 'done', manager: '박정호', startDate: '2024-06-01', endDate: '2025-01-31', description: '고객 관계 관리를 위한 CRM 시스템을 신규 구축했습니다.', budget: '2.5억원' },
  { id: 'P011', name: '홈페이지 개편', status: 'done', manager: '한지은', startDate: '2024-09-01', endDate: '2025-02-28', description: '회사 홈페이지 전면 개편 및 반응형 UI 적용을 완료했습니다.', budget: '8000만원' },
  { id: 'P012', name: 'BI 리포팅 고도화', status: 'active', manager: '김영수', startDate: '2025-01-20', endDate: '2025-07-31', description: '경영진 대시보드 및 월간 BI 리포트 자동화 시스템을 구축합니다.', budget: '1.6억원' },
];

const statusColors: Record<string, string> = { active: 'green', pending: 'orange', done: 'default' };
const statusLabels: Record<string, string> = { active: '진행중', pending: '준비중', done: '완료' };

export default function SampleMasterDetail() {
  const [selected, setSelected] = useState<Project>(sampleProjects[0]);
  const [search, setSearch] = useState('');

  const filtered = sampleProjects.filter((p) =>
    p.name.includes(search) || p.manager.includes(search),
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <GridToolbar
        left="프로젝트 관리 (마스터-디테일 샘플)"
        actions={<Button size="small" icon={<PlusOutlined />} type="primary">신규</Button>}
      />
      <div className={styles['sample-master-detail']}>
        {/* Left: master list */}
        <div className={styles['sample-left-panel']}>
          <div style={{ padding: '6px 8px', borderBottom: '1px solid #f0f0f0' }}>
            <Input
              size="small"
              placeholder="검색"
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
            />
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            {filtered.map((p) => (
              <div
                key={p.id}
                className={`${styles['sample-list-item']} ${selected.id === p.id ? styles['sample-list-item-active'] : ''}`}
                onClick={() => setSelected(p)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 500, fontSize: 13 }}>{p.name}</span>
                  <Tag color={statusColors[p.status]} style={{ fontSize: 11 }}>{statusLabels[p.status]}</Tag>
                </div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{p.manager} · {p.startDate}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: detail panel */}
        <div className={styles['sample-right-panel']}>
          {selected ? (
            <>
              <GridToolbar
                left={<span style={{ fontWeight: 600 }}>{selected.name}</span>}
                actions={
                  <Space>
                    <Button size="small" type="primary">저장</Button>
                    <Button size="small">삭제</Button>
                  </Space>
                }
              />
              <div className={styles['sample-detail-content']}>
                {[
                  ['프로젝트 ID', selected.id],
                  ['프로젝트명', selected.name],
                  ['상태', <Tag color={statusColors[selected.status]}>{statusLabels[selected.status]}</Tag>],
                  ['PM', selected.manager],
                  ['시작일', selected.startDate],
                  ['종료일', selected.endDate],
                  ['예산', selected.budget],
                  ['설명', selected.description],
                ].map(([label, value]) => (
                  <div key={String(label)} className={styles['sample-field-row']}>
                    <span className={styles['sample-field-label']}>{label}</span>
                    <span className={styles['sample-field-value']}>{value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <Empty description="항목을 선택하세요" style={{ margin: 'auto', padding: 40 }} />
          )}
        </div>
      </div>
    </div>
  );
}
