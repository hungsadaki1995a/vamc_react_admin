import { useState } from 'react';
import { Card, Divider, Switch, Table, Typography } from 'antd';
import ActionButton from '@/components/common/ActionButton';
import ActionButtonGroup from '@/components/common/ActionButtonGroup';
import CodeSnippet from '@/components/common/CodeSnippet';
import { useNotify } from '@/hooks/useNotify';

const { Text } = Typography;

interface PropRow {
  prop: string;
  type: string;
  desc: string;
}

const BUTTON_PROPS: PropRow[] = [
  { prop: 'action', type: "'search' | 'reset' | 'addRow' | 'deleteRow' | 'saveChanges' | ...", desc: '액션 프리셋 — 기본 아이콘/intent 자동 적용' },
  { prop: 'intent', type: "'default' | 'primary' | 'danger' | 'excel' | 'text' | 'icon'", desc: '스타일 의도 (action 기본값 덮어쓰기)' },
  { prop: '...ButtonProps', type: 'antd ButtonProps', desc: 'onClick, disabled, size 등 antd Button props 그대로 전달' },
];

const GROUP_PROPS: PropRow[] = [
  { prop: 'preset', type: "'search' | 'gridEdit' | 'formEdit' | 'modal' | 'excelRegister'", desc: '프리셋별 표준 버튼 정렬 순서 적용' },
  { prop: 'items', type: 'ActionButtonGroupItem[]', desc: '선언형 버튼 목록 (key, action, label, hidden, order)' },
  { prop: 'justify', type: "'start' | 'center' | 'end' | 'between'", desc: '정렬' },
  { prop: 'canWrite', type: 'boolean', desc: 'false면 쓰기 계열(addRow/deleteRow/saveChanges/register/excelUpload/upload) 자동 비활성' },
];

const PROP_COLUMNS = [
  { title: 'Prop', dataIndex: 'prop', width: 160, render: (v: string) => <Text code>{v}</Text> },
  { title: '타입', dataIndex: 'type', width: 320 },
  { title: '설명', dataIndex: 'desc' },
];

const USAGE = `import ActionButton from '@/components/common/ActionButton';
import ActionButtonGroup from '@/components/common/ActionButtonGroup';
import { useMenuPermission } from '@/hooks/useMenuPermission';

const { canWrite } = useMenuPermission();

// 1) 단일 버튼 — action 프리셋이 아이콘/스타일을 결정
<ActionButton action="search" onClick={handleSearch}>조회</ActionButton>

// 2) 선언형 그룹 — preset이 버튼 정렬 순서를 결정
<ActionButtonGroup
  preset="gridEdit"
  canWrite={canWrite}
  items={[
    { key: 'add',  action: 'addRow',       label: '행 추가', onClick: handleAdd },
    { key: 'del',  action: 'deleteRow',    label: '행 삭제', onClick: handleDelete },
    { key: 'save', action: 'saveChanges',  label: '저장',   onClick: handleSave },
  ]}
/>`;

export default function ActionButtonDemo() {
  const { toast } = useNotify();
  const [canWrite, setCanWrite] = useState(true);

  return (
    <div className="page-container page-scrollable">
      <div className="ds-section-header">
        <h2>ActionButton</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '4px 0 0' }}>
          화면 전반의 액션 버튼 표준. <Text code>action</Text> 프리셋으로 아이콘·스타일을 통일하고,
          <Text code>ActionButtonGroup</Text>의 <Text code>preset</Text>으로 버튼 정렬 순서를,
          <Text code>canWrite</Text>로 쓰기 권한 연동을 처리합니다.
        </p>
      </div>

      <Card size="small" title="ActionButton Props" style={{ marginBottom: 16 }}>
        <Table<PropRow>
          size="small"
          rowKey="prop"
          pagination={false}
          columns={PROP_COLUMNS}
          dataSource={BUTTON_PROPS}
        />
      </Card>

      <Card size="small" title="ActionButtonGroup Props" style={{ marginBottom: 16 }}>
        <Table<PropRow>
          size="small"
          rowKey="prop"
          pagination={false}
          columns={PROP_COLUMNS}
          dataSource={GROUP_PROPS}
        />
      </Card>

      <Card size="small" title="라이브 데모" style={{ marginBottom: 16 }}>
        <Divider titlePlacement="left" styles={{ content: { margin: 0 } }} style={{ fontSize: 13 }}>
          단일 버튼 (action 프리셋)
        </Divider>
        <div style={{ marginBottom: 12 }}>
          <ActionButtonGroup>
            <ActionButton action="search" onClick={() => toast.info('조회')}>조회</ActionButton>
            <ActionButton action="reset" onClick={() => toast.info('초기화')}>초기화</ActionButton>
            <ActionButton action="saveChanges" onClick={() => toast.success('저장됐습니다.')}>저장</ActionButton>
            <ActionButton action="deleteRow" onClick={() => toast.warning('삭제')}>삭제</ActionButton>
            <ActionButton action="excelDownload" onClick={() => toast.info('엑셀 다운로드')}>엑셀 다운로드</ActionButton>
          </ActionButtonGroup>
        </div>

        <Divider titlePlacement="left" styles={{ content: { margin: 0 } }} style={{ fontSize: 13 }}>
          preset="gridEdit" + canWrite 연동
        </Divider>
        <div style={{ marginBottom: 8 }}>
          <Switch size="small" checked={canWrite} onChange={setCanWrite} />{' '}
          <Text type="secondary" style={{ fontSize: 12 }}>
            canWrite = {String(canWrite)} — false면 쓰기 계열 버튼이 자동 비활성화됩니다.
          </Text>
        </div>
        <ActionButtonGroup
          preset="gridEdit"
          canWrite={canWrite}
          justify="end"
          items={[
            { key: 'excelDown', action: 'excelDownload', label: '엑셀 다운로드', onClick: () => toast.info('다운로드') },
            { key: 'excelUp', action: 'excelUpload', label: '엑셀 업로드', onClick: () => toast.info('업로드') },
            { key: 'add', action: 'addRow', label: '행 추가', onClick: () => toast.info('행 추가') },
            { key: 'del', action: 'deleteRow', label: '행 삭제', onClick: () => toast.warning('행 삭제') },
            { key: 'save', action: 'saveChanges', label: '저장', onClick: () => toast.success('저장됐습니다.') },
          ]}
        />
      </Card>

      <CodeSnippet code={USAGE} />
    </div>
  );
}
