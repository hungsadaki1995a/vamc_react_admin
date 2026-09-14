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
import ActionButton from '@/components/common/ActionButton';
import ActionButtonGroup from '@/components/common/ActionButtonGroup';
import AppModal from '@/components/common/AppModal';
import ModalInfoFields from '@/components/common/ModalInfoFields';
import styles from './index.module.css';
import DevPageHeader from '@/dev/DevPageHeader';

const actionButtonCode = `import ActionButton from '@/components/common/ActionButton';
import ActionButtonGroup from '@/components/common/ActionButtonGroup';
import { useMenuPermission } from '@/hooks/useMenuPermission';

const { canWrite } = useMenuPermission();

<ActionButtonGroup preset="gridEdit" canWrite={canWrite}>
  <ActionButton action="excelDownload">Excel download</ActionButton>
  <ActionButton action="addRow">Add row</ActionButton>
  <ActionButton action="deleteRow">Delete row</ActionButton>
  <ActionButton action="saveChanges">Save</ActionButton>
</ActionButtonGroup>`;

const appModalCode = `import AppModal from '@/components/common/AppModal';
import ModalInfoFields from '@/components/common/ModalInfoFields';

<AppModal
  open={open}
  title="Details"
  resizable                 // resize with the bottom-right handle
  showFullscreenToggle      // fullscreen toggle button
  onCancel={() => setOpen(false)}
  footer={null}
  width={560}
>
  <ModalInfoFields
    columns={2}
    items={[
      { key: 'no', label: 'Debt number', value: 'NPL-2026-0001' },
      { key: 'debtor', label: 'Debtor', value: 'J** Doe' },
      { key: 'status', label: 'Status', value: 'In progress' },
    ]}
  />
</AppModal>`;

/* ─── Code snippets ─── */
const formPanelCode = `import FormPanel from '@/components/layout/FormPanel';

const [isEditMode, setIsEditMode] = useState(false);
const [formCollapsed, setFormCollapsed] = useState(false);

<FormPanel
  title="Input"
  editMode={isEditMode}          // edit mode -> blue bottom border
  collapsed={formCollapsed}      // controlled collapse
  onCollapsedChange={setFormCollapsed}
  actions={
    <>
      <Button onClick={handleReset}>Reset</Button>
      <Divider orientation="vertical" />
      <Button type="primary" onClick={handleSave}>Save</Button>
      <Button danger disabled={!isEditMode} onClick={handleDelete}>Delete</Button>
      <Divider orientation="vertical" />
    </>
  }
>
  <Form layout="horizontal" labelCol={{ style: { width: 80 } }}>
    <Form.Item label="Name"><Input /></Form.Item>
    <Form.Item label="Email"><Input /></Form.Item>
  </Form>
</FormPanel>`;

const filterPanelCode = `import FilterPanel from '@/components/layout/FilterPanel';

const [statusFilter, setStatusFilter] = useState('all');
const activeFilterCount = [statusFilter !== 'all'].filter(Boolean).length;

<FilterPanel
  activeFilterCount={activeFilterCount}
  onSearch={() => { /* search */ }}
  onReset={() => setStatusFilter('all')}
>
  <div className="ds-filter-field">
    <span className="ds-filter-field-label">Status</span>
    <Select value={statusFilter} onChange={setStatusFilter}
      style={{ width: '100%' }} size="small"
      options={[
        { label: 'All', value: 'all' },
        { label: 'In progress', value: 'active' },
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
  <div>Left (primary) panel</div>
  <div>Right (secondary) panel</div>
</SplitPanel>`;

const detailPanelCode = `import DetailPanel from '@/components/layout/DetailPanel';

const [visible, setVisible] = useState(false);

<DetailPanel
  visible={visible}
  title={<span>Details</span>}
  defaultHeight={280}
  minHeight={150}
  maxHeight={500}
  onClose={() => setVisible(false)}
  tabs={[
    { key: 'info', label: 'Basic info', children: <div>Content</div> },
    { key: 'history', label: 'History', badge: 3, children: <div>History</div> },
  ]}
/>`;

/* ─── Demo data ─── */
const demoItems = [
  { id: 1, name: 'Requirements analysis', status: 'completed', assignee: 'Steve Kim' },
  { id: 2, name: 'Database design', status: 'in_progress', assignee: 'Michelle Lee' },
  { id: 3, name: 'API server development', status: 'planned', assignee: 'Jason Park' },
  { id: 4, name: 'Front-end development', status: 'planned', assignee: 'Thomas Song' },
];

const statusMap: Record<string, { label: string; color: string }> = {
  planned: { label: 'Planned', color: 'default' },
  in_progress: { label: 'In progress', color: 'processing' },
  completed: { label: 'Completed', color: 'success' },
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

  // AppModal demo
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = demoItems.filter((d) => {
    if (statusFilter !== 'all' && d.status !== statusFilter) return false;
    if (nameSearch && !d.name.includes(nameSearch)) return false;
    return true;
  });

  return (
    <div className="page-container page-scrollable">
      <DevPageHeader page="LayoutComponentsDemo" />

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
                  <p>A collapsible search filter panel. When collapsed, a badge shows how many filters are active.</p>
                  <table className={styles.demoPropsTable}>
                    <thead><tr><th>Prop</th><th>Type</th><th>Description</th></tr></thead>
                    <tbody>
                      <tr><td><code>collapsed</code></td><td>boolean</td><td>Collapsed state (controlled)</td></tr>
                      <tr><td><code>onCollapsedChange</code></td><td>(v: boolean) =&gt; void</td><td>Collapse toggle callback</td></tr>
                      <tr><td><code>activeFilterCount</code></td><td>number</td><td>Number of active filters (badge)</td></tr>
                      <tr><td><code>onSearch</code></td><td>() =&gt; void</td><td>Search button</td></tr>
                      <tr><td><code>onReset</code></td><td>() =&gt; void</td><td>Reset button</td></tr>
                      <tr><td><code>children</code></td><td>ReactNode</td><td>The filter fields</td></tr>
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
                      <span className="ds-filter-field-label">Status</span>
                      <Select
                        value={statusFilter}
                        onChange={setStatusFilter}
                        style={{ width: '100%' }}
                        options={[
                          { label: 'All', value: 'all' },
                          { label: 'Planned', value: 'planned' },
                          { label: 'In progress', value: 'in_progress' },
                          { label: 'Completed', value: 'completed' },
                        ]}
                      />
                    </div>
                    <div className="ds-filter-field">
                      <span className="ds-filter-field-label">Task name</span>
                      <Input
                        value={nameSearch}
                        onChange={(e) => setNameSearch(e.target.value)}
                        placeholder="Search task name"
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
                  <p>The input panel at the bottom of a CRUD screen. It has a header (title, action buttons, collapse toggle) and a form body.</p>
                  <table className={styles.demoPropsTable}>
                    <thead><tr><th>Prop</th><th>Type</th><th>Description</th></tr></thead>
                    <tbody>
                      <tr><td><code>title</code></td><td>ReactNode</td><td>Title on the left of the header</td></tr>
                      <tr><td><code>actions</code></td><td>ReactNode</td><td>Button group on the right of the header (left of the collapse button)</td></tr>
                      <tr><td><code>editMode</code></td><td>boolean</td><td>Edit mode — the bottom border turns blue</td></tr>
                      <tr><td><code>collapsed</code></td><td>boolean</td><td>Collapsed state (controlled)</td></tr>
                      <tr><td><code>onCollapsedChange</code></td><td>(v: boolean) =&gt; void</td><td>Collapse toggle callback</td></tr>
                      <tr><td><code>children</code></td><td>ReactNode</td><td>Form content</td></tr>
                    </tbody>
                  </table>
                </div>
                <div className={styles.demoPreview}>
                  <div style={{ marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Switch mode:</span>
                    <Button
                      size="small"
                      type={!isFormEditMode ? 'primary' : 'default'}
                      icon={<PlusOutlined />}
                      onClick={() => { setIsFormEditMode(false); setFormName(''); setFormEmail(''); setFormCollapsed(false); }}
                    >
                      New
                    </Button>
                    <Button
                      size="small"
                      type={isFormEditMode ? 'primary' : 'default'}
                      icon={<EditOutlined />}
                      onClick={() => { setIsFormEditMode(true); setFormName('Steve Kim'); setFormEmail('kim@example.com'); setFormCollapsed(false); }}
                    >
                      Edit (simulates a row click)
                    </Button>
                  </div>
                  <FormPanel
                    title="Input"
                    editMode={isFormEditMode}
                    collapsed={formCollapsed}
                    onCollapsedChange={setFormCollapsed}
                    actions={
                      <Space size={4}>
                        <Button size="middle" onClick={() => { setIsFormEditMode(false); setFormName(''); setFormEmail(''); }}>
                          Reset
                        </Button>
                        <Divider orientation="vertical" />
                        <Button size="middle" type="primary">Save</Button>
                        <Button size="middle" danger disabled={!isFormEditMode} icon={<DeleteOutlined />}>
                          Delete
                        </Button>
                        <Divider orientation="vertical" />
                      </Space>
                    }
                  >
                    <Form layout="horizontal" labelCol={{ style: { width: 80, textAlign: 'right' } }} wrapperCol={{ style: { flex: 1 } }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
                        <Form.Item label="Name" style={{ margin: '0 0 8px' }}>
                          <Input value={formName} onChange={(e) => setFormName(e.target.value)} />
                        </Form.Item>
                        <Form.Item label="Email" style={{ margin: '0 0 8px' }}>
                          <Input value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="example@shinhan.com" />
                        </Form.Item>
                      </div>
                    </Form>
                  </FormPanel>
                  <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                    {isFormEditMode
                      ? 'Edit mode — the bottom border is blue'
                      : 'New mode — the border keeps its default color'}
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
                  <p>A two-pane split panel you can resize by dragging. Supports horizontal (left/right) and vertical (top/bottom).</p>
                  <table className={styles.demoPropsTable}>
                    <thead><tr><th>Prop</th><th>Type</th><th>Description</th></tr></thead>
                    <tbody>
                      <tr><td><code>direction</code></td><td>'horizontal' | 'vertical'</td><td>Split direction</td></tr>
                      <tr><td><code>defaultSize</code></td><td>number</td><td>Initial size of the primary panel (px)</td></tr>
                      <tr><td><code>primaryMinSize</code></td><td>number</td><td>Minimum size (default 200)</td></tr>
                      <tr><td><code>secondaryMinSize</code></td><td>number</td><td>Minimum size of the secondary panel (default 200)</td></tr>
                      <tr><td><code>secondaryVisible</code></td><td>boolean</td><td>Whether the secondary panel is shown</td></tr>
                      <tr><td><code>children</code></td><td>[ReactNode, ReactNode]</td><td>Exactly two children (a tuple)</td></tr>
                    </tbody>
                  </table>
                </div>
                <div className={styles.demoPreview}>
                  <Space style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: 13 }}>Direction:</span>
                    <Select
                      value={splitDir}
                      onChange={setSplitDir}
                      size="small"
                      style={{ width: 140 }}
                      options={[
                        { label: 'Horizontal (left/right)', value: 'horizontal' },
                        { label: 'Vertical (top/bottom)', value: 'vertical' },
                      ]}
                    />
                  </Space>
                  <div style={{ height: 300, border: '1px solid var(--border-color)', borderRadius: 6 }}>
                    <SplitPanel direction={splitDir} defaultSize={280} primaryMinSize={150} secondaryMinSize={150}>
                      <div className={styles.demoSplitPane} style={{ background: 'var(--primary-light)' }}>
                        <strong>Primary</strong>
                        <p>Left (or top) panel</p>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Grab the drag handle and resize it</p>
                      </div>
                      <div className={styles.demoSplitPane}>
                        <strong>Secondary</strong>
                        <p>Right (or bottom) panel</p>
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
                  <p>A collapsible detail panel docked at the bottom. It supports tabs and badges, and its height can be dragged.</p>
                  <table className={styles.demoPropsTable}>
                    <thead><tr><th>Prop</th><th>Type</th><th>Description</th></tr></thead>
                    <tbody>
                      <tr><td><code>visible</code></td><td>boolean</td><td>Whether the panel is shown</td></tr>
                      <tr><td><code>title</code></td><td>ReactNode</td><td>Title</td></tr>
                      <tr><td><code>defaultHeight</code></td><td>number</td><td>Initial height (default 300)</td></tr>
                      <tr><td><code>minHeight / maxHeight</code></td><td>number</td><td>Minimum / maximum height</td></tr>
                      <tr><td><code>onClose</code></td><td>() =&gt; void</td><td>Close callback</td></tr>
                      <tr><td><code>tabs</code></td><td>DetailPanelTab[]</td><td>Tab array (key, label, badge, children)</td></tr>
                    </tbody>
                  </table>
                </div>
                <div className={styles.demoPreview} style={{ position: 'relative', minHeight: 400, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ flex: 1, padding: 12, border: '1px solid var(--border-color)', borderRadius: '6px 6px 0 0', background: 'var(--content-bg)' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 8 }}>Click an item below to open the DetailPanel at the bottom.</p>
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
                        label: 'Basic info',
                        children: (
                          <Descriptions column={2} size="small" bordered>
                            <Descriptions.Item label="Task name">{selectedItem.name}</Descriptions.Item>
                            <Descriptions.Item label="Assignee">{selectedItem.assignee}</Descriptions.Item>
                            <Descriptions.Item label="Status">
                              <Tag color={statusMap[selectedItem.status].color}>{statusMap[selectedItem.status].label}</Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="ID">{selectedItem.id}</Descriptions.Item>
                          </Descriptions>
                        ),
                      },
                      {
                        key: 'history',
                        label: 'History',
                        badge: 2,
                        children: (
                          <div style={{ padding: '8px 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                            <p>2025-03-01 status changed: Planned → In progress</p>
                            <p>2025-02-28 assignee set: {selectedItem.assignee}</p>
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

          /* ── ActionButton ── */
          {
            key: 'actionButton',
            label: 'ActionButton',
            children: (
              <div className={styles.demoSection}>
                <div className={styles.demoDesc}>
                  <h3>ActionButton / ActionButtonGroup</h3>
                  <p>
                    Standard action buttons (search, save, delete, Excel, …) plus preset-ordered groups.
                    When <code>canWrite</code> is false, write buttons are disabled automatically.
                  </p>
                </div>
                <div className={styles.demoPreview}>
                  <Space orientation="vertical" size={16} style={{ width: '100%' }}>
                    <ActionButtonGroup preset="search" justify="start">
                      <ActionButton action="reset">Reset</ActionButton>
                      <ActionButton action="search">Search</ActionButton>
                    </ActionButtonGroup>
                    <ActionButtonGroup preset="gridEdit">
                      <ActionButton action="excelDownload">Excel download</ActionButton>
                      <ActionButton action="addRow">Add row</ActionButton>
                      <ActionButton action="deleteRow">Delete row</ActionButton>
                      <ActionButton action="saveChanges">Save</ActionButton>
                    </ActionButtonGroup>
                    <div>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 8px' }}>canWrite=false (read-only screen)</p>
                      <ActionButtonGroup preset="gridEdit" canWrite={false}>
                        <ActionButton action="excelDownload">Excel download</ActionButton>
                        <ActionButton action="addRow">Add row</ActionButton>
                        <ActionButton action="deleteRow">Delete row</ActionButton>
                        <ActionButton action="saveChanges">Save</ActionButton>
                      </ActionButtonGroup>
                    </div>
                  </Space>
                </div>
                <CodeSnippet code={actionButtonCode} />
              </div>
            ),
          },

          /* ── AppModal ── */
          {
            key: 'appModal',
            label: 'AppModal',
            children: (
              <div className={styles.demoSection}>
                <div className={styles.demoDesc}>
                  <h3>AppModal / ModalInfoFields</h3>
                  <p>
                    A standard modal with resize and fullscreen toggle, plus a label-value field grid.
                  </p>
                </div>
                <div className={styles.demoPreview}>
                  <Button type="primary" onClick={() => setModalOpen(true)}>Open modal</Button>
                  <AppModal
                    open={modalOpen}
                    title="Details"
                    resizable
                    onCancel={() => setModalOpen(false)}
                    footer={null}
                    width={560}
                  >
                    <ModalInfoFields
                      columns={2}
                      items={[
                        { key: 'no', label: 'Debt number', value: 'NPL-2026-0001' },
                        { key: 'debtor', label: 'Debtor', value: 'J** Doe' },
                        { key: 'status', label: 'Status', value: 'In progress' },
                        { key: 'amount', label: 'Debt amount', value: '1,200,000,000 VND' },
                      ]}
                    />
                  </AppModal>
                </div>
                <CodeSnippet code={appModalCode} />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
