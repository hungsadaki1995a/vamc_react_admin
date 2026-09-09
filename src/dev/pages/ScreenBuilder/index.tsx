import { Alert, Card, Col, Form, Input, Radio, Row, Select, Typography } from 'antd';
import ActionButton from '@/components/common/ActionButton';
import ActionButtonGroup from '@/components/common/ActionButtonGroup';
import { useNotify } from '@/hooks/useNotify';
import DevPageHeader from '@/dev/DevPageHeader';

const { Text } = Typography;

type LayoutKind = 'grid-list' | 'grid-form' | 'master-detail' | 'dashboard';

interface BuilderForm {
  screenId: string;
  screenName: string;
  domain: string;
  layout: LayoutKind;
  menuKey: string;
}

// 업무 도메인 — 메뉴 IA 의 대분류 7개와 1:1 이다.
// 폴더명(소문자)이 화면ID 접두 3자(대문자)와 같은 값이라 둘이 어긋날 일이 없다.
//   src/features/sys/SYS030101SC/  ←→  메뉴코드 A06030100
//
// `auth`(로그인 등 메뉴 밖 화면)와 `dashboard`(정적 메뉴)는 화면ID 채번 규칙 대상이 아니라 뺐다.
// 데모·가이드는 features 가 아니라 src/dev/pages/ 에 있으므로 역시 선택지에 없다.
const DOMAIN_OPTIONS = [
  { value: 'mbr', label: 'mbr — 회원 관리 (A01)' },
  { value: 'trd', label: 'trd — 거래 관리 (A02)' },
  { value: 'npl', label: 'npl — NPL정보 관리 (A03)' },
  { value: 'cnt', label: 'cnt — 컨텐츠 관리 (A04)' },
  { value: 'stt', label: 'stt — 통계 (A05)' },
  { value: 'sys', label: 'sys — 시스템 운영 관리 (A06)' },
  { value: 'auc', label: 'auc — 경매 관리 (A07)' },
];

/** 화면ID 형식 — {도메인3}{중분류2}{소분류2}{일련2}{유형2}. 유형은 SC(화면) / 1P·2P(팝업) */
const SCREEN_ID_PATTERN = /^[A-Z]{3}\d{6}(SC|\dP)$/;

/** 메뉴코드 형식 — MENU_MNG.MENU_CD. 대분류 1자 + 숫자 8자 (예: A06030100) */
const MENU_CD_PATTERN = /^[A-Z]\d{8}$/;

const LAYOUT_OPTIONS: { value: LayoutKind; label: string; desc: string }[] = [
  { value: 'grid-list', label: '목록', desc: 'FilterPanel + GridTable' },
  { value: 'grid-form', label: '그리드-폼', desc: 'GridTable + FormPanel' },
  { value: 'master-detail', label: '마스터-디테일', desc: 'SplitPanel 좌/우' },
  { value: 'dashboard', label: '대시보드', desc: 'Card 그리드 + 차트' },
];

/**
 * 화면 생성기 — 뼈대(skeleton).
 *
 * 입력값을 받아 `src/features/{domain}/{화면ID}/index.tsx` 스캐폴드를 만드는 것이 목표.
 * 현재는 UI 폼만 배치돼 있고 실제 생성 로직은 미구현입니다.
 *
 * ⚠️ 서버 메뉴로 여는 화면은 `menuConfig` 에 넣지 않는다 — `MENU_MNG.MENU_URL_ADDR` 에
 *    화면ID를 넣으면 `componentRegistry` 가 폴더를 자동 발견한다. `menuConfig` 는
 *    정적 메뉴(대시보드·개발 도구)만 담는다.
 */
export default function ScreenBuilder() {
  const { toast } = useNotify();
  const [form] = Form.useForm<BuilderForm>();

  return (
    <div className="page-container page-scrollable">
      <DevPageHeader page="ScreenBuilder" />

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
              initialValues={{ layout: 'grid-list', domain: 'sys' }}
            >
              <Form.Item
                name="screenId"
                label="화면 ID (폴더명 = componentPath = MENU_URL_ADDR = sceId)"
                extra="{도메인3}{중분류2}{소분류2}{일련2}{유형2} — 11자. 유형은 SC(화면) / 1P·2P(팝업). 한 번 부여하면 불변."
                rules={[
                  { required: true },
                  { pattern: SCREEN_ID_PATTERN, message: '형식이 맞지 않습니다 (예: NPL010101SC)' },
                ]}
              >
                <Input placeholder="예: NPL010101SC" style={{ textTransform: 'uppercase' }} />
              </Form.Item>
              <Form.Item name="screenName" label="화면명" rules={[{ required: true }]}>
                <Input placeholder="예: 채권 목록" />
              </Form.Item>
              <Form.Item name="domain" label="도메인 (src/features 하위 폴더)">
                <Select options={DOMAIN_OPTIONS} />
              </Form.Item>
              <Form.Item
                name="menuKey"
                label="메뉴 코드 (MENU_MNG.MENU_CD)"
                extra="이 메뉴의 MENU_URL_ADDR 에 위 화면ID를 넣어야 화면이 열린다. 라벨 키는 lbl.menu.{메뉴코드}."
                rules={[{ pattern: MENU_CD_PATTERN, message: '형식이 맞지 않습니다 (예: A03010100)' }]}
              >
                <Input placeholder="예: A03010100" style={{ textTransform: 'uppercase' }} />
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
