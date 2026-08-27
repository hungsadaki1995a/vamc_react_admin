import { Button, Card, Divider, Space } from 'antd';
import { Typography } from 'antd';
import { useNotify } from '@/hooks/useNotify';

const { Text } = Typography;

export default function NotifyDemo() {
  const { toast, notify, dialog } = useNotify();

  return (
    <div className="page-container page-scrollable">
      <div className="ds-section-header">
        <h2>useNotify</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '4px 0 0' }}>
          antd <Text code>message</Text> / <Text code>notification</Text> / <Text code>modal</Text>을
          하나의 훅으로 제공합니다.
          <br />
          <strong>dialog</strong>는 타입별 i18n 기본값(title · okText · cancelText · danger)이 자동 적용되며, 호출 시 개별 오버라이드 가능합니다.
        </p>
      </div>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Divider titlePlacement="left" styles={{ content: { margin: 0 } }} style={{ fontSize: 13 }}>toast — 자동 사라지는 메시지</Divider>
        <Space wrap style={{ marginBottom: 12 }}>
          <Button size="small" type="primary" onClick={() => toast.success('저장됐습니다.')}>success</Button>
          <Button size="small" danger         onClick={() => toast.error('오류가 발생했습니다.')}>error</Button>
          <Button size="small"                onClick={() => toast.warning('주의가 필요합니다.')}>warning</Button>
          <Button size="small"                onClick={() => toast.info('참고 안내입니다.')}>info</Button>
          <Button size="small"                onClick={() => toast.loading('처리 중...')}>loading</Button>
        </Space>

        <Divider titlePlacement="left" styles={{ content: { margin: 0 } }} style={{ fontSize: 13 }}>notify — 우측 알림 패널</Divider>
        <Space wrap style={{ marginBottom: 12 }}>
          <Button size="small" type="primary"
            onClick={() => notify.success('변경 사항이 저장됐습니다.')}>
            string (title 자동)
          </Button>
          <Button size="small" danger
            onClick={() => notify.error({ title: '커스텀 제목', description: '서버 오류가 발생했습니다.', placement: 'topRight' })}>
            object (직접 지정)
          </Button>
          <Button size="small" onClick={() => notify.warning('권한이 곧 만료됩니다.')}>warning</Button>
          <Button size="small" onClick={() => notify.info('새 공지사항이 등록됐습니다.')}>info</Button>
        </Space>

        <Divider titlePlacement="left" styles={{ content: { margin: 0 } }} style={{ fontSize: 13 }}>dialog — 모달 (i18n 기본값 자동 적용)</Divider>
        <Space wrap>
          <Button size="small"
            onClick={() => dialog.confirm({ content: '저장하시겠습니까?', onOk: () => toast.success('저장됐습니다.') })}>
            confirm
          </Button>
          <Button size="small"
            onClick={() => dialog.info({ content: '이것은 정보 다이얼로그입니다.' })}>
            info
          </Button>
          <Button size="small"
            onClick={() => dialog.warning({ content: '이 작업은 되돌릴 수 없습니다.', onOk: () => toast.warning('계속 진행합니다.') })}>
            warning
          </Button>
          <Button size="small" danger
            onClick={() => dialog.error({ content: '서버 오류가 발생했습니다.' })}>
            error
          </Button>
          <Button size="small"
            onClick={() => dialog.warning({ title: '데이터 삭제', content: '삭제 후 복구할 수 없습니다.', okText: '삭제', onOk: () => toast.success('삭제됐습니다.') })}>
            title · okText 오버라이드
          </Button>
        </Space>
      </Card>
    </div>
  );
}
