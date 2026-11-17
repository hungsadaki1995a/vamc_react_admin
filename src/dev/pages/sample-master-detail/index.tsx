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
  { id: 'P001', name: 'Digital transformation platform', status: 'active', manager: 'John Doe', startDate: '2025-01-01', endDate: '2025-12-31', description: 'Platform build-out for the digital transformation of internal corporate systems.', budget: 'KRW 500M' },
  { id: 'P002', name: 'Mobile app development', status: 'active', manager: 'Michael Chen', startDate: '2025-03-01', endDate: '2025-09-30', description: 'New customer-facing mobile app development project.', budget: 'KRW 200M' },
  { id: 'P003', name: 'ERP enhancement', status: 'pending', manager: 'Emily Park', startDate: '2025-04-01', endDate: '2026-03-31', description: 'Feature enhancements and performance work on the ERP system.', budget: 'KRW 800M' },
  { id: 'P004', name: 'Security hardening', status: 'done', manager: 'David Kim', startDate: '2024-09-01', endDate: '2025-02-28', description: 'Company-wide strengthening of the security framework.', budget: 'KRW 150M' },
  { id: 'P005', name: 'Big data analytics platform', status: 'pending', manager: 'Sarah Lee', startDate: '2025-05-01', endDate: '2026-04-30', description: 'Analytics platform supporting data-driven decision making.', budget: 'KRW 600M' },
  { id: 'P006', name: 'Cloud migration', status: 'active', manager: 'Jacob Lim', startDate: '2025-02-01', endDate: '2025-10-31', description: 'Migrating on-premises infrastructure to AWS in stages.', budget: 'KRW 400M' },
  { id: 'P007', name: 'AI chatbot rollout', status: 'active', manager: 'Andrew Jung', startDate: '2025-04-01', endDate: '2025-11-30', description: 'Introducing an AI chatbot to automate customer service.', budget: 'KRW 150M' },
  { id: 'P008', name: 'HR self-service portal', status: 'pending', manager: 'Hannah Oh', startDate: '2025-04-15', endDate: '2025-11-30', description: 'Self-service portal where employees handle their own HR tasks.', budget: 'KRW 120M' },
  { id: 'P009', name: 'E-approval system upgrade', status: 'active', manager: 'Michelle Lee', startDate: '2025-03-01', endDate: '2025-08-31', description: 'Feature improvements and mobile support for the existing e-approval system.', budget: 'KRW 180M' },
  { id: 'P010', name: 'CRM system build', status: 'done', manager: 'Paul Park', startDate: '2024-06-01', endDate: '2025-01-31', description: 'Built a new CRM system for customer relationship management.', budget: 'KRW 250M' },
  { id: 'P011', name: 'Website revamp', status: 'done', manager: 'Jane Han', startDate: '2024-09-01', endDate: '2025-02-28', description: 'Completed a full redesign of the corporate website with a responsive UI.', budget: 'KRW 80M' },
  { id: 'P012', name: 'BI reporting upgrade', status: 'active', manager: 'Steve Kim', startDate: '2025-01-20', endDate: '2025-07-31', description: 'Executive dashboard and automation of the monthly BI report.', budget: 'KRW 160M' },
];

const statusColors: Record<string, string> = { active: 'green', pending: 'orange', done: 'default' };
const statusLabels: Record<string, string> = { active: 'In progress', pending: 'Preparing', done: 'Completed' };

export default function SampleMasterDetail() {
  const [selected, setSelected] = useState<Project>(sampleProjects[0]);
  const [search, setSearch] = useState('');

  const filtered = sampleProjects.filter((p) =>
    p.name.includes(search) || p.manager.includes(search),
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <GridToolbar
        left="Project management (master-detail sample)"
        actions={<Button size="small" icon={<PlusOutlined />} type="primary">New</Button>}
      />
      <div className={styles['sample-master-detail']}>
        {/* Left: master list */}
        <div className={styles['sample-left-panel']}>
          <div style={{ padding: '6px 8px', borderBottom: '1px solid #f0f0f0' }}>
            <Input
              size="small"
              placeholder="Search"
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
                    <Button size="small" type="primary">Save</Button>
                    <Button size="small">Delete</Button>
                  </Space>
                }
              />
              <div className={styles['sample-detail-content']}>
                {[
                  ['Project ID', selected.id],
                  ['Project name', selected.name],
                  ['Status', <Tag color={statusColors[selected.status]}>{statusLabels[selected.status]}</Tag>],
                  ['PM', selected.manager],
                  ['Start date', selected.startDate],
                  ['End date', selected.endDate],
                  ['Budget', selected.budget],
                  ['Description', selected.description],
                ].map(([label, value]) => (
                  <div key={String(label)} className={styles['sample-field-row']}>
                    <span className={styles['sample-field-label']}>{label}</span>
                    <span className={styles['sample-field-value']}>{value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <Empty description="Select an item" style={{ margin: 'auto', padding: 40 }} />
          )}
        </div>
      </div>
    </div>
  );
}
