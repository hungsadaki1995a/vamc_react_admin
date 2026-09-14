import { useState } from 'react';
import { Card, Divider, Switch, Table, Typography } from 'antd';
import ActionButton from '@/components/common/ActionButton';
import ActionButtonGroup from '@/components/common/ActionButtonGroup';
import CodeSnippet from '@/components/common/CodeSnippet';
import { useNotify } from '@/hooks/useNotify';
import DevPageHeader from '@/dev/DevPageHeader';

const { Text } = Typography;

interface PropRow {
  prop: string;
  type: string;
  desc: string;
}

const BUTTON_PROPS: PropRow[] = [
  { prop: 'action', type: "'search' | 'reset' | 'addRow' | 'deleteRow' | 'saveChanges' | ...", desc: 'Action preset — applies the default icon and intent' },
  { prop: 'intent', type: "'default' | 'primary' | 'danger' | 'excel' | 'text' | 'icon'", desc: 'Style intent (overrides the action default)' },
  { prop: '...ButtonProps', type: 'antd ButtonProps', desc: 'onClick, disabled, size and every other antd Button prop, passed through' },
];

const GROUP_PROPS: PropRow[] = [
  { prop: 'preset', type: "'search' | 'gridEdit' | 'formEdit' | 'modal' | 'excelRegister'", desc: 'Applies the standard button order for the preset' },
  { prop: 'items', type: 'ActionButtonGroupItem[]', desc: 'Declarative button list (key, action, label, hidden, order)' },
  { prop: 'justify', type: "'start' | 'center' | 'end' | 'between'", desc: 'Alignment' },
  { prop: 'canWrite', type: 'boolean', desc: 'When false, write actions (addRow/deleteRow/saveChanges/register/excelUpload/upload) are disabled automatically' },
];

const PROP_COLUMNS = [
  { title: 'Prop', dataIndex: 'prop', width: 160, render: (v: string) => <Text code>{v}</Text> },
  { title: 'Type', dataIndex: 'type', width: 320 },
  { title: 'Description', dataIndex: 'desc' },
];

const USAGE = `import ActionButton from '@/components/common/ActionButton';
import ActionButtonGroup from '@/components/common/ActionButtonGroup';
import { useMenuPermission } from '@/hooks/useMenuPermission';

const { canWrite } = useMenuPermission();

// 1) Single button — the action preset decides the icon and style
<ActionButton action="search" onClick={handleSearch}>Search</ActionButton>

// 2) Declarative group — the preset decides the button order
<ActionButtonGroup
  preset="gridEdit"
  canWrite={canWrite}
  items={[
    { key: 'add',  action: 'addRow',       label: 'Add row', onClick: handleAdd },
    { key: 'del',  action: 'deleteRow',    label: 'Delete row', onClick: handleDelete },
    { key: 'save', action: 'saveChanges',  label: 'Save',   onClick: handleSave },
  ]}
/>`;

export default function ActionButtonDemo() {
  const { toast } = useNotify();
  const [canWrite, setCanWrite] = useState(true);

  return (
    <div className="page-container page-scrollable">
      <DevPageHeader page="ActionButtonDemo" />

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

      <Card size="small" title="Live demo" style={{ marginBottom: 16 }}>
        <Divider titlePlacement="left" styles={{ content: { margin: 0 } }} style={{ fontSize: 13 }}>
          Single buttons (action presets)
        </Divider>
        <div style={{ marginBottom: 12 }}>
          <ActionButtonGroup>
            <ActionButton action="search" onClick={() => toast.info('Search')}>Search</ActionButton>
            <ActionButton action="reset" onClick={() => toast.info('Reset')}>Reset</ActionButton>
            <ActionButton action="saveChanges" onClick={() => toast.success('Saved.')}>Save</ActionButton>
            <ActionButton action="deleteRow" onClick={() => toast.warning('Delete')}>Delete</ActionButton>
            <ActionButton action="excelDownload" onClick={() => toast.info('Excel download')}>Excel download</ActionButton>
          </ActionButtonGroup>
        </div>

        <Divider titlePlacement="left" styles={{ content: { margin: 0 } }} style={{ fontSize: 13 }}>
          preset="gridEdit" wired to canWrite
        </Divider>
        <div style={{ marginBottom: 8 }}>
          <Switch size="small" checked={canWrite} onChange={setCanWrite} />{' '}
          <Text type="secondary" style={{ fontSize: 12 }}>
            canWrite = {String(canWrite)} — when false, write buttons are disabled automatically.
          </Text>
        </div>
        <ActionButtonGroup
          preset="gridEdit"
          canWrite={canWrite}
          justify="end"
          items={[
            { key: 'excelDown', action: 'excelDownload', label: 'Excel download', onClick: () => toast.info('Download') },
            { key: 'excelUp', action: 'excelUpload', label: 'Excel upload', onClick: () => toast.info('Upload') },
            { key: 'add', action: 'addRow', label: 'Add row', onClick: () => toast.info('Add row') },
            { key: 'del', action: 'deleteRow', label: 'Delete row', onClick: () => toast.warning('Delete row') },
            { key: 'save', action: 'saveChanges', label: 'Save', onClick: () => toast.success('Saved.') },
          ]}
        />
      </Card>

      <CodeSnippet code={USAGE} />
    </div>
  );
}
