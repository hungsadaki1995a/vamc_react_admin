import { Alert, Card, Col, Form, Input, Radio, Row, Select, Typography } from 'antd';
import ActionButton from '@/components/common/ActionButton';
import ActionButtonGroup from '@/components/common/ActionButtonGroup';
import { useNotify } from '@/hooks/useNotify';

const { Text } = Typography;

type LayoutKind = 'grid-list' | 'grid-form' | 'master-detail' | 'dashboard';

interface BuilderForm {
  screenId: string;
  screenName: string;
  domain: string;
  layout: LayoutKind;
  menuKey: string;
}

// src/features/ 하위 실제 도메인 폴더 — 새 폴더를 만들면 여기에 추가한다.
// 데모·가이드·이관 샘플은 features 가 아니라 src/dev/pages/ 에 있으므로 선택지에서 뺐다.
const DOMAIN_OPTIONS = [
  { value: 'admin', label: 'admin — 어드민/시스템 관리' },
  { value: 'cco', label: 'cco — 공통 업무 화면' },
  { value: 'dashboard', label: 'dashboard — 대시보드' },
];

const LAYOUT_OPTIONS: { value: LayoutKind; label: string; desc: string }[] = [
  { value: 'grid-list', label: '목록', desc: 'FilterPanel + GridTable' },
  { value: 'grid-form', label: '그리드-폼', desc: 'GridTable + FormPanel' },
  { value: 'master-detail', label: '마스터-디테일', desc: 'SplitPanel 좌/우' },
  { value: 'dashboard', label: '대시보드', desc: 'Card 그리드 + 차트' },
];

/**
 * 화면 생성기 — 뼈대(skeleton).
 * 입력값을 받아 `src/features/{domain}/{ScreenId}/index.tsx` 스캐폴드와
 * `menuConfig` 항목을 생성하는 것이 목표. 현재는 UI 폼만 배치돼 있고
 * 실제 생성 로직은 미구현입니다.
 */
export default function ScreenBuilder() {
  const { toast } = useNotify();
  const [form] = Form.useForm<BuilderForm>();

  return (
    <div className="page-container page-scrollable">
      <div className="ds-section-header">
        <h2>화면 생성기</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '4px 0 0' }}>
          레이아웃 패턴을 선택해 화면 컴포넌트와 <Text code>menuConfig</Text> 항목의 스캐폴드를 생성합니다.
        </p>
      </div>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="뼈대 화면"
        description="현재는 입력 폼만 구성돼 있습니다. 스캐폴드 생성 로직(파일 출력 / 클립보드 복사)은 미구현입니다."
      />

      <Row gutter={12}>
        <Col xs={24} xl={14}>
          <Card size="small" title="화면 정보">
            <Form<BuilderForm>
              form={form}
              layout="vertical"
              size="small"
              initialValues={{ layout: 'grid-list', domain: 'cco' }}
            >
              <Form.Item name="screenId" label="화면 ID (컴포넌트 폴더명)" rules={[{ required: true }]}>
                <Input placeholder="예: AdminMenuManagement" />
              </Form.Item>
              <Form.Item name="screenName" label="화면명" rules={[{ required: true }]}>
                <Input placeholder="예: 채권 목록" />
              </Form.Item>
              <Form.Item name="domain" label="도메인 (src/features 하위 폴더)">
                <Select options={DOMAIN_OPTIONS} />
              </Form.Item>
              <Form.Item name="menuKey" label="메뉴 키">
                <Input placeholder="예: admin.system.menu" />
              </Form.Item>
              <Form.Item name="layout" label="레이아웃 패턴">
                <Radio.Group>
                  {LAYOUT_OPTIONS.map((o) => (
                    <Radio.Button key={o.value} value={o.value}>
                      {o.label}
                    </Radio.Button>
                  ))}
                </Radio.Group>
              </Form.Item>

              <ActionButtonGroup justify="end">
                <ActionButton action="reset" onClick={() => form.resetFields()}>
                  초기화
                </ActionButton>
                <ActionButton
                  action="saveChanges"
                  onClick={() => toast.info('스캐폴드 생성 로직은 아직 구현되지 않았습니다.')}
                >
                  생성
                </ActionButton>
              </ActionButtonGroup>
            </Form>
          </Card>
        </Col>

        <Col xs={24} xl={10}>
          <Card size="small" title="미리보기">
            <Text type="secondary" style={{ fontSize: 12 }}>
              선택한 레이아웃에 따른 컴포넌트 구성 미리보기가 여기에 표시됩니다. (미구현)
            </Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
