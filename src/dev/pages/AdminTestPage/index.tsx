import { Tag } from 'antd';

// Jenkins frontend-admin 빌드/배포 파이프라인 확인용 임시 테스트 화면.
// 배포 후 이 문구/버전을 바꿔가며 최신 빌드가 반영됐는지 눈으로 확인한다.
const DEPLOY_TEST_VERSION = 'v1';

export default function AdminTestPage() {
  return (
    <div className="page-container page-scrollable">
      <h2 style={{ marginBottom: 8 }}>테스트 메뉴</h2>
      <p style={{ color: 'var(--color-text-secondary, #666)' }}>
        Jenkins frontend-admin 빌드/배포 파이프라인 확인용 테스트 페이지입니다.
      </p>
      <Tag color="blue">배포 확인 버전: {DEPLOY_TEST_VERSION}</Tag>
    </div>
  );
}
