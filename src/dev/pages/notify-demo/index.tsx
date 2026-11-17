import { Button, Card, Divider, Space } from 'antd';
import { useNotify } from '@/hooks/useNotify';
import DevPageHeader from '@/dev/DevPageHeader';

export default function NotifyDemo() {
  const { toast, notify, dialog } = useNotify();

  return (
    <div className="page-container page-scrollable">
      <DevPageHeader page="NotifyDemo" />

      <Card size="small" style={{ marginBottom: 16 }}>
        <Divider titlePlacement="left" styles={{ content: { margin: 0 } }} style={{ fontSize: 13 }}>toast — auto-dismissing message</Divider>
        <Space wrap style={{ marginBottom: 12 }}>
          <Button size="small" type="primary" onClick={() => toast.success('Saved.')}>success</Button>
          <Button size="small" danger         onClick={() => toast.error('An error occurred.')}>error</Button>
          <Button size="small"                onClick={() => toast.warning('This needs your attention.')}>warning</Button>
          <Button size="small"                onClick={() => toast.info('For your information.')}>info</Button>
          <Button size="small"                onClick={() => toast.loading('Processing...')}>loading</Button>
        </Space>

        <Divider titlePlacement="left" styles={{ content: { margin: 0 } }} style={{ fontSize: 13 }}>notify — notification panel on the right</Divider>
        <Space wrap style={{ marginBottom: 12 }}>
          <Button size="small" type="primary"
            onClick={() => notify.success('Your changes have been saved.')}>
            string (auto title)
          </Button>
          <Button size="small" danger
            onClick={() => notify.error({ title: 'Custom title', description: 'A server error occurred.', placement: 'topRight' })}>
            object (explicit)
          </Button>
          <Button size="small" onClick={() => notify.warning('Your permission expires soon.')}>warning</Button>
          <Button size="small" onClick={() => notify.info('A new notice has been posted.')}>info</Button>
        </Space>

        <Divider titlePlacement="left" styles={{ content: { margin: 0 } }} style={{ fontSize: 13 }}>dialog — modal (i18n defaults applied automatically)</Divider>
        <Space wrap>
          <Button size="small"
            onClick={() => dialog.confirm({ content: 'Save the changes?', onOk: () => toast.success('Saved.') })}>
            confirm
          </Button>
          <Button size="small"
            onClick={() => dialog.info({ content: 'This is an informational dialog.' })}>
            info
          </Button>
          <Button size="small"
            onClick={() => dialog.warning({ content: 'This action cannot be undone.', onOk: () => toast.warning('Proceeding.') })}>
            warning
          </Button>
          <Button size="small" danger
            onClick={() => dialog.error({ content: 'A server error occurred.' })}>
            error
          </Button>
          <Button size="small"
            onClick={() => dialog.warning({ title: 'Delete data', content: 'Deleted data cannot be recovered.', okText: 'Delete', onOk: () => toast.success('Deleted.') })}>
            title / okText override
          </Button>
        </Space>
      </Card>
    </div>
  );
}
