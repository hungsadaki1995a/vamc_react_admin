import { useState } from 'react';
import { Tabs, Button, Input, Select, Tag, Descriptions, Space, Divider, Form } from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
} from '@ant-design/icons';
import FilterPanel from '@/components/layout/FilterPanel';
import GridToolbar from '@/components/layout/GridToolbar';
import FormPanel from '@/components/layout/FormPanel';
import SplitPanel from '@/components/layout/SplitPanel';
import DetailPanel from '@/components/layout/DetailPanel';
import CodeSnippet from '@/components/common/CodeSnippet';
import styles from './index.module.css';

/* ─── Code snippets ─── */
const formPanelCode = `import FormPanel from '@/components/layout/FormPanel';

const [isEditMode, setIsEditMode] = useState(false);
const [formCollapsed, setFormCollapsed] = useState(false);

<FormPanel
  title="입력"
  editMode={isEditMode}          // 수정 모드 → 하단 보더 파란색
  collapsed={formCollapsed}      // controlled 접힘
  onCollapsedChange={setFormCollapsed}
  actions={
    <>
      <Button onClick={handleReset}>초기화</Button>
      <Divider orientation="vertical" />
      <Button type="primary" onClick={handleSave}>저장</Button>
      <Button danger disabled={!isEditMode} onClick={handleDelete}>삭제</Button>
      <Divider orientation="vertical" />
    </>
  }
>
  <Form layout="horizontal" labelCol={{ style: { width: 80 } }}>
    <Form.Item label="이름"><Input /></Form.Item>
    <Form.Item label="이메일"><Input /></Form.Item>
  </Form>
</FormPanel>`;

const filterPanelCode = `import FilterPanel from '@/components/layout/FilterPanel';

const [statusFilter, setStatusFilter] = useState('all');
const activeFilterCount = [statusFilter !== 'all'].filter(Boolean).length;

<FilterPanel
  activeFilterCount={activeFilterCount}
  onSearch={() => { /* 검색 */ }}
  onReset={() => setStatusFilter('all')}
>
  <div className="ds-filter-field">
    <span className="ds-filter-field-label">상태</span>
    <Select value={statusFilter} onChange={setStatusFilter}
      style={{ width: '100%' }} size="small"
      options={[
        { label: '전체', value: 'all' },
        { label: '진행중', value: 'active' },
      ]}
    />
  </div>
</FilterPanel>`;

const splitPanelCode = `import SplitPanel from '@/components/layout/SplitPanel';

<SplitPanel
  direction="horizontal"  // 'horizontal' | 'vertical'
  defaultSize={350}
  primaryMinSize={200}
  secondaryMinSize={200}
  secondaryVisible={true}
>
  <div>좌측(Primary) 패널</div>
  <div>우측(Secondary) 패널</div>
</SplitPanel>`;

const detailPanelCode = `import DetailPanel from '@/components/layout/DetailPanel';

const [visible, setVisible] = useState(false);

<DetailPanel
  visible={visible}
  title={<span>상세 정보</span>}
  defaultHeight={280}
  minHeight={150}
  maxHeight={500}
  onClose={() => setVisible(false)}
  tabs={[
    { key: 'info', label: '기본정보', children: <div>내용</div> },
    { key: 'history', label: '이력', badge: 3, children: <div>이력</div> },
  ]}
/>`;

/* ─── Demo data ─── */
const demoItems = [
  { id: 1, name: '요구사항 분석', status: 'completed', assignee: '김영수' },
  { id: 2, name: 'DB 설계', status: 'in_progress', assignee: '이미영' },
  { id: 3, name: 'API 서버 개발', status: 'planned', assignee: '박지성' },
  { id: 4, name: '프론트엔드 개발', status: 'planned', assignee: '송태현' },
];

const statusMap: Record<string, { label: string; color: string }> = {
  planned: { label: '계획', color: 'default' },
  in_progress: { label: '진행중', color: 'processing' },
  completed: { label: '완료', color: 'success' },
};

export default function LayoutComponentsDemo() {
  // FilterPanel demo state
  const [statusFilter, setStatusFilter] = useState('all');
  const [nameSearch, setNameSearch] = useState('');
  const activeFilterCount = [statusFilter !== 'all', nameSearch.length > 0].filter(Boolean).length;

  // DetailPanel demo state
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(demoItems[0]);

  // FormPanel demo state
  const [formCollapsed, setFormCollapsed] = useState(false);
  const [isFormEditMode, setIsFormEditMode] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');

  // SplitPanel demo direction
  const [splitDir, setSplitDir] = useState<'horizontal' | 'vertical'>('horizontal');

  const filtered = demoItems.filter((d) => {
    if (statusFilter !== 'all' && d.status !== statusFilter) return false;
    if (nameSearch && !d.name.includes(nameSearch)) return false;
    return true;
  });

  return (
    <div className="page-container page-scrollable">
      <div className="ds-section-header">
        <h2>레이아웃 컴포넌트</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '4px 0 0' }}>
          DS PMS에서 제공하는 레이아웃 공통 컴포넌트의 사용 예시입니다.
        </p>
      </div>

      <Tabs
        defaultActiveKey="filter"
        items={[
          /* ── FilterPanel ── */
          {
            key: 'filter',
            label: 'FilterPanel',
            children: (
              <div className={styles.demoSection}>
                <div className={styles.demoDesc}>
                  <h3>FilterPanel</h3>
                  <p>접기/펼치기가 가능한 검색 필터 패널입니다. 접힌 상태에서 활성 필터 수가 배지로 표시됩니다.</p>
                  <table className={styles.demoPropsTable}>
                    <thead><tr><th>Prop</th><th>타입</th><th>설명</th></tr></thead>
                    <tbody>
                      <tr><td><code>collapsed</code></td><td>boolean</td><td>접힘 상태 (controlled)</td></tr>
                      <tr><td><code>onCollapsedChange</code></td><td>(v: boolean) =&gt; void</td><td>접힘 토글 콜백</td></tr>
                      <tr><td><code>activeFilterCount</code></td><td>number</td><td>활성 필터 수 (배지)</td></tr>
                      <tr><td><code>onSearch</code></td><td>() =&gt; void</td><td>검색 버튼</td></tr>
                      <tr><td><code>onReset</code></td><td>() =&gt; void</td><td>초기화 버튼</td></tr>
                      <tr><td><code>children</code></td><td>ReactNode</td><td>필터 필드들</td></tr>
                    </tbody>
                  </table>
                </div>
                <div className={styles.demoPreview}>
                  <FilterPanel
                    activeFilterCount={activeFilterCount}
                    onSearch={() => {}}
                    onReset={() => { setStatusFilter('all'); setNameSearch(''); }}
                  >
                    <div className="ds-filter-field">
                      <span className="ds-filter-field-label">상태</span>
                      <Select
                        value={statusFilter}
                        onChange={setStatusFilter}
                        style={{ width: '100%' }}
                        options={[
                          { label: '전체', value: 'all' },
                          { label: '계획', value: 'planned' },
                          { label: '진행중', value: 'in_progress' },
                          { label: '완료', value: 'completed' },
                        ]}
                      />
                    </div>
                    <div className="ds-filter-field">
                      <span className="ds-filter-field-label">업무명</span>
                      <Input
                        value={nameSearch}
                        onChange={(e) => setNameSearch(e.target.value)}
                        placeholder="업무명 검색"
                        allowClear
                      />
                    </div>
                  </FilterPanel>
                  <GridToolbar totalCount={filtered.length} />
                  <div className={styles.demoList}>
                    {filtered.map((item) => (
                      <div key={item.id} className={styles.demoListItem}>
                        <Tag color={statusMap[item.status].color}>{statusMap[item.status].label}</Tag>
                        <span>{item.name}</span>
                        <span style={{ color: 'var(--text-secondary)', marginLeft: 'auto', fontSize: 12 }}>{item.assignee}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <CodeSnippet code={filterPanelCode} />
              </div>
            ),
          },

          /* ── FormPanel ── */
          {
            key: 'form',
            label: 'FormPanel',
            children: (
              <div className={styles.demoSection}>
                <div className={styles.demoDesc}>
                  <h3>FormPanel</h3>
                  <p>CRUD 화면의 하단 입력 영역 패널입니다. 헤더(타이틀 + 액션 버튼 + 접기 토글)와 폼 바디로 구성됩니다.</p>
                  <table className={styles.demoPropsTable}>
                    <thead><tr><th>Prop</th><th>타입</th><th>설명</th></tr></thead>
                    <tbody>
                      <tr><td><code>title</code></td><td>ReactNode</td><td>헤더 좌측 제목</td></tr>
                      <tr><td><code>actions</code></td><td>ReactNode</td><td>헤더 우측 버튼 그룹 (접기 버튼 왼쪽)</td></tr>
                      <tr><td><code>editMode</code></td><td>boolean</td><td>수정 모드 — 하단 보더 파란색 표시</td></tr>
                      <tr><td><code>collapsed</code></td><td>boolean</td><td>접힘 상태 (controlled)</td></tr>
                      <tr><td><code>onCollapsedChange</code></td><td>(v: boolean) =&gt; void</td><td>접힘 토글 콜백</td></tr>
                      <tr><td><code>children</code></td><td>ReactNode</td><td>폼 내용</td></tr>
                    </tbody>
                  </table>
                </div>
                <div className={styles.demoPreview}>
                  <div style={{ marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>모드 전환:</span>
                    <Button
                      size="small"
                      type={!isFormEditMode ? 'primary' : 'default'}
                      icon={<PlusOutlined />}
                      onClick={() => { setIsFormEditMode(false); setFormName(''); setFormEmail(''); setFormCollapsed(false); }}
                    >
                      신규
                    </Button>
                    <Button
                      size="small"
                      type={isFormEditMode ? 'primary' : 'default'}
                      icon={<EditOutlined />}
                      onClick={() => { setIsFormEditMode(true); setFormName('김영수'); setFormEmail('kim@shinhan.com'); setFormCollapsed(false); }}
                    >
                      수정 (행 클릭 시뮬레이션)
                    </Button>
                  </div>
                  <FormPanel
                    title="입력"
                    editMode={isFormEditMode}
                    collapsed={formCollapsed}
                    onCollapsedChange={setFormCollapsed}
                    actions={
                      <Space size={4}>
                        <Button size="middle" onClick={() => { setIsFormEditMode(false); setFormName(''); setFormEmail(''); }}>
                          초기화
                        </Button>
                        <Divider orientation="vertical" />
                        <Button size="middle" type="primary">저장</Button>
                        <Button size="middle" danger disabled={!isFormEditMode} icon={<DeleteOutlined />}>
                          삭제
                        </Button>
                        <Divider orientation="vertical" />
                      </Space>
                    }
                  >
                    <Form layout="horizontal" labelCol={{ style: { width: 80, textAlign: 'right' } }} wrapperCol={{ style: { flex: 1 } }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
                        <Form.Item label="이름" style={{ margin: '0 0 8px' }}>
                          <Input value={formName} onChange={(e) => setFormName(e.target.value)} />
                        </Form.Item>
                        <Form.Item label="이메일" style={{ margin: '0 0 8px' }}>
                          <Input value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="example@shinhan.com" />
                        </Form.Item>
                      </div>
                    </Form>
                  </FormPanel>
                  <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                    {isFormEditMode
                      ? '✅ 수정 모드 — 하단 보더가 파란색으로 표시됩니다'
                      : '⬜ 신규 모드 — 보더가 기본 색입니다'}
                  </div>
                </div>
                <CodeSnippet code={formPanelCode} />
              </div>
            ),
          },

          /* ── SplitPanel ── */
          {
            key: 'split',
            label: 'SplitPanel',
            children: (
              <div className={styles.demoSection}>
                <div className={styles.demoDesc}>
                  <h3>SplitPanel</h3>
                  <p>드래그 리사이즈 가능한 2영역 분할 패널입니다. 좌우(horizontal) 또는 상하(vertical)를 지원합니다.</p>
                  <table className={styles.demoPropsTable}>
                    <thead><tr><th>Prop</th><th>타입</th><th>설명</th></tr></thead>
                    <tbody>
                      <tr><td><code>direction</code></td><td>'horizontal' | 'vertical'</td><td>분할 방향</td></tr>
                      <tr><td><code>defaultSize</code></td><td>number</td><td>primary 패널 초기 크기(px)</td></tr>
                      <tr><td><code>primaryMinSize</code></td><td>number</td><td>최소 크기 (기본 200)</td></tr>
                      <tr><td><code>secondaryMinSize</code></td><td>number</td><td>secondary 최소 크기 (기본 200)</td></tr>
                      <tr><td><code>secondaryVisible</code></td><td>boolean</td><td>secondary 패널 표시 여부</td></tr>
                      <tr><td><code>children</code></td><td>[ReactNode, ReactNode]</td><td>2개 자식 요소 (튜플)</td></tr>
                    </tbody>
                  </table>
                </div>
                <div className={styles.demoPreview}>
                  <Space style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: 13 }}>방향:</span>
                    <Select
                      value={splitDir}
                      onChange={setSplitDir}
                      size="small"
                      style={{ width: 140 }}
                      options={[
                        { label: 'Horizontal (좌우)', value: 'horizontal' },
                        { label: 'Vertical (상하)', value: 'vertical' },
                      ]}
                    />
                  </Space>
                  <div style={{ height: 300, border: '1px solid var(--border-color)', borderRadius: 6 }}>
                    <SplitPanel direction={splitDir} defaultSize={280} primaryMinSize={150} secondaryMinSize={150}>
                      <div className={styles.demoSplitPane} style={{ background: 'var(--primary-light)' }}>
                        <strong>Primary</strong>
                        <p>좌측(또는 상단) 패널</p>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>드래그 핸들을 잡고 리사이즈 해보세요</p>
                      </div>
                      <div className={styles.demoSplitPane}>
                        <strong>Secondary</strong>
                        <p>우측(또는 하단) 패널</p>
                      </div>
                    </SplitPanel>
                  </div>
                </div>
                <CodeSnippet code={splitPanelCode} />
              </div>
            ),
          },

          /* ── DetailPanel ── */
          {
            key: 'detail',
            label: 'DetailPanel',
            children: (
              <div className={styles.demoSection}>
                <div className={styles.demoDesc}>
                  <h3>DetailPanel</h3>
                  <p>하단에 표시되는 접이식 상세 패널입니다. 탭과 배지를 지원하며, 드래그로 높이를 조절할 수 있습니다.</p>
                  <table className={styles.demoPropsTable}>
                    <thead><tr><th>Prop</th><th>타입</th><th>설명</th></tr></thead>
                    <tbody>
                      <tr><td><code>visible</code></td><td>boolean</td><td>패널 표시 여부</td></tr>
                      <tr><td><code>title</code></td><td>ReactNode</td><td>제목</td></tr>
                      <tr><td><code>defaultHeight</code></td><td>number</td><td>초기 높이 (기본 300)</td></tr>
                      <tr><td><code>minHeight / maxHeight</code></td><td>number</td><td>최소/최대 높이</td></tr>
                      <tr><td><code>onClose</code></td><td>() =&gt; void</td><td>닫기 콜백</td></tr>
                      <tr><td><code>tabs</code></td><td>DetailPanelTab[]</td><td>탭 배열 (key, label, badge, children)</td></tr>
                    </tbody>
                  </table>
                </div>
                <div className={styles.demoPreview} style={{ position: 'relative', minHeight: 400, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ flex: 1, padding: 12, border: '1px solid var(--border-color)', borderRadius: '6px 6px 0 0', background: 'var(--content-bg)' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 8 }}>아래 항목을 클릭하면 하단 DetailPanel이 열립니다.</p>
                    {demoItems.map((item) => (
                      <div
                        key={item.id}
                        className={[styles.demoListItem, styles.clickable, selectedItem?.id === item.id ? styles.selected : ''].filter(Boolean).join(' ')}
                        onClick={() => { setSelectedItem(item); setDetailVisible(true); }}
                      >
                        <Tag color={statusMap[item.status].color}>{statusMap[item.status].label}</Tag>
                        <span>{item.name}</span>
                        <span style={{ color: 'var(--text-secondary)', marginLeft: 'auto', fontSize: 12 }}>{item.assignee}</span>
                      </div>
                    ))}
                  </div>
                  <DetailPanel
                    visible={detailVisible}
                    title={
                      <Space>
                        <Tag color={statusMap[selectedItem.status].color}>{statusMap[selectedItem.status].label}</Tag>
                        {selectedItem.name}
                      </Space>
                    }
                    defaultHeight={220}
                    minHeight={120}
                    maxHeight={350}
                    onClose={() => setDetailVisible(false)}
                    tabs={[
                      {
                        key: 'info',
                        label: '기본정보',
                        children: (
                          <Descriptions column={2} size="small" bordered>
                            <Descriptions.Item label="업무명">{selectedItem.name}</Descriptions.Item>
                            <Descriptions.Item label="담당자">{selectedItem.assignee}</Descriptions.Item>
                            <Descriptions.Item label="상태">
                              <Tag color={statusMap[selectedItem.status].color}>{statusMap[selectedItem.status].label}</Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="ID">{selectedItem.id}</Descriptions.Item>
                          </Descriptions>
                        ),
                      },
                      {
                        key: 'history',
                        label: '이력',
                        badge: 2,
                        children: (
                          <div style={{ padding: '8px 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                            <p>2025-03-01 상태 변경: 계획 → 진행중</p>
                            <p>2025-02-28 담당자 배정: {selectedItem.assignee}</p>
                          </div>
                        ),
                      },
                    ]}
                  />
                </div>
                <CodeSnippet code={detailPanelCode} />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
