import { useCallback } from 'react';
import { Card, Col, Row, Tag, Typography } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import { menuConfig } from '@/config/menuConfig';
import { findMenuByKey } from '@/utils/menuUtils';
import { useTabStore } from '@/stores/tabStore';
import { useMenuStore } from '@/stores/menuStore';
import type { MenuItem } from '@/types/menu';
import styles from './index.module.css';

const { Text } = Typography;

// 개발 도구 1단 하위 그룹 (자기 자신인 'dev.overview'는 제외)
const devMenu = findMenuByKey(menuConfig, 'dev');
const groups = (devMenu?.children ?? []).filter((g) => g.children && g.children.length > 0);

const GROUP_DESC: Record<string, string> = {
  'dev.components': '공통 컴포넌트의 Props · Events · 라이브 데모',
  'dev.builder': '메뉴/화면 스캐폴딩 도구',
  'dev.patterns': '레이아웃 패턴별 참조 화면 모음',
  'dev.lib': '외부 라이브러리 API + 내부 공통 기능 레퍼런스',
};

export default function DevGuideHome() {
  const openTab = useTabStore((s) => s.openTab);
  const closeFlyout = useMenuStore((s) => s.closeFlyout);

  const handleOpen = useCallback(
    (item: MenuItem) => {
      if (!item.componentPath) return;
      openTab(item);
      closeFlyout();
    },
    [openTab, closeFlyout],
  );

  return (
    <div className="page-container page-scrollable">
      <div className="ds-section-header">
        <h2>개발가이드</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '4px 0 0' }}>
          VAMC NPL ADMIN 개발 시 참고할 컴포넌트 데모 · 화면 패턴 · 라이브러리 가이드 모음입니다.
          좌측 <Text code>개발 도구</Text> 메뉴에서도 동일하게 접근할 수 있습니다.
        </p>
      </div>

      <Row gutter={[12, 12]}>
        {groups.map((group) => (
          <Col key={group.key} xs={24} md={12} xl={8}>
            <Card
              size="small"
              title={
                <span>
                  {group.label}{' '}
                  <Tag style={{ marginInlineStart: 4 }}>{group.children!.length}</Tag>
                </span>
              }
              styles={{ body: { padding: '4px 0' } }}
            >
              <p className={styles.groupDesc}>{GROUP_DESC[group.key] ?? ''}</p>
              {group.children!.map((leaf) => (
                <div key={leaf.key} className={styles.link} onClick={() => handleOpen(leaf)}>
                  <span>{leaf.label}</span>
                  <RightOutlined className={styles.linkArrow} />
                </div>
              ))}
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
