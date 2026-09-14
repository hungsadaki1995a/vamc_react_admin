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

// Business domains — one per top-level group in the menu IA (7 of them).
// The folder name (lowercase) matches the 3-letter screen-ID prefix (uppercase), so the two cannot drift apart.
//   src/features/sys/SYS030101SC/  <->  menu code A06020100
//
// `auth` (login and other off-menu screens) and `dashboard` (a static menu) are not covered by the
// screen-ID numbering rule, so they are excluded. Demos and guides live in src/dev/pages/, not features,
// so they are not offered here either.
const DOMAIN_OPTIONS = [
  { value: 'mbr', label: 'mbr — Member management (A01)' },
  { value: 'trd', label: 'trd — Trade management (A02)' },
  { value: 'npl', label: 'npl — NPL information (A03)' },
  { value: 'cnt', label: 'cnt — Content management (A04)' },
  { value: 'stt', label: 'stt — Statistics (A05)' },
  { value: 'sys', label: 'sys — System operations (A06)' },
  { value: 'auc', label: 'auc — Auction management (A07)' },
];

/** Screen-ID format — {domain3}{group2}{subgroup2}{seq2}{type2}. Type is SC (screen) or 1P/2P (popup). */
const SCREEN_ID_PATTERN = /^[A-Z]{3}\d{6}(SC|\dP)$/;

/** Menu-code format — MENU_MNG.MENU_CD. 1 letter for the top group + 8 digits (e.g. A06020100). */
const MENU_CD_PATTERN = /^[A-Z]\d{8}$/;

const LAYOUT_OPTIONS: { value: LayoutKind; label: string; desc: string }[] = [
  { value: 'grid-list', label: 'List', desc: 'FilterPanel + GridTable' },
  { value: 'grid-form', label: 'Grid-form', desc: 'GridTable + FormPanel' },
  { value: 'master-detail', label: 'Master-detail', desc: 'SplitPanel left/right' },
  { value: 'dashboard', label: 'Dashboard', desc: 'Card grid + charts' },
];

/**
 * Screen generator — a skeleton.
 *
 * The goal is to take the inputs and scaffold `src/features/{domain}/{screenId}/index.tsx`.
 * Only the input form exists today; the generation logic is not implemented yet.
 *
 * Note: screens opened from a server menu do NOT go into `menuConfig` — put the screen ID in
 *    `MENU_MNG.MENU_URL_ADDR` and `componentRegistry` discovers the folder automatically.
 *    `menuConfig` only holds static menus (dashboard, dev tools).
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
        message="Skeleton screen"
        description="Only the input form is built so far. The scaffold generation logic (file output / clipboard copy) is not implemented."
      />

      <Row gutter={12}>
        <Col xs={24} xl={14}>
          <Card size="small" title="Screen information">
            <Form<BuilderForm>
              form={form}
              layout="vertical"
              size="small"
              initialValues={{ layout: 'grid-list', domain: 'sys' }}
            >
              <Form.Item
                name="screenId"
                label="Screen ID (folder name = componentPath = MENU_URL_ADDR = sceId)"
                extra="{domain3}{group2}{subgroup2}{seq2}{type2} — 11 characters. Type is SC (screen) or 1P/2P (popup). Immutable once assigned."
                rules={[
                  { required: true },
                  { pattern: SCREEN_ID_PATTERN, message: 'Invalid format (e.g. NPL010101SC)' },
                ]}
              >
                <Input placeholder="e.g. NPL010101SC" style={{ textTransform: 'uppercase' }} />
              </Form.Item>
              <Form.Item name="screenName" label="Screen name" rules={[{ required: true }]}>
                <Input placeholder="e.g. Debt list" />
              </Form.Item>
              <Form.Item name="domain" label="Domain (folder under src/features)">
                <Select options={DOMAIN_OPTIONS} />
              </Form.Item>
              <Form.Item
                name="menuKey"
                label="Menu code (MENU_MNG.MENU_CD)"
                extra="Put the screen ID above into this menu's MENU_URL_ADDR for the screen to open. The label key is lbl.menu.{menuCode}."
                rules={[{ pattern: MENU_CD_PATTERN, message: 'Invalid format (e.g. A03010100)' }]}
              >
                <Input placeholder="e.g. A03010100" style={{ textTransform: 'uppercase' }} />
              </Form.Item>
              <Form.Item name="layout" label="Layout pattern">
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
                  Reset
                </ActionButton>
                <ActionButton
                  action="saveChanges"
                  onClick={() => toast.info('The scaffold generation logic is not implemented yet.')}
                >
                  Generate
                </ActionButton>
              </ActionButtonGroup>
            </Form>
          </Card>
        </Col>

        <Col xs={24} xl={10}>
          <Card size="small" title="Preview">
            <Text type="secondary" style={{ fontSize: 12 }}>
              A preview of the component layout for the selected pattern will appear here. (Not implemented)
            </Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
