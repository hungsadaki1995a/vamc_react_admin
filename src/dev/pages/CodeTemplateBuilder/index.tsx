import { useMemo, useState } from 'react';
import { Alert, Card, Input, Segmented, Typography } from 'antd';
import CodeSnippet from '@/components/common/CodeSnippet';

const { Text } = Typography;

type TemplateKind = 'api' | 'query' | 'grid' | 'store';

const TEMPLATE_KINDS: { value: TemplateKind; label: string }[] = [
  { value: 'api', label: 'API 함수' },
  { value: 'query', label: 'useApiQuery 훅' },
  { value: 'grid', label: 'GridTable 화면' },
  { value: 'store', label: 'Zustand 스토어' },
];

function buildTemplate(kind: TemplateKind, name: string): string {
  const Pascal = name ? name[0].toUpperCase() + name.slice(1) : 'Sample';
  const camel = Pascal[0].toLowerCase() + Pascal.slice(1);

  switch (kind) {
    case 'api':
      // 서버는 { status, message, data } 만 내려주고 success 필드가 없다.
      // useApiQuery / useApiMutation 은 success 로 성공을 판정하므로 여기서 status → success 로
      // 변환해 준다. (src/api/sys/lblMngApi.ts 의 getLabelRows 와 동일한 형태)
      return `// 저장 위치: src/api/{도메인}/${camel}.ts
//   도메인 = common(전역 부트스트랩) | sys(시스템 운영 관리) — 새 업무 도메인은 폴더를 추가한다.
//   파일명은 화면ID가 아니라 업무명으로 짓는다 — 예: menuMng.ts(메뉴 관리), lblMng.ts(라벨 관리).\n//   화면 폴더(src/features/**)에는 api.ts 를 만들지 않는다.
import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';

// 서버 DTO 와 1:1 대응 — 타입은 이 파일에 코로케이트한다 (src/api/common/comCdApi.ts 참고)
export interface ${Pascal} {
  ${camel}Id: string;
  ${camel}Nm: string;
}

// GET /api/${camel}/list
export async function get${Pascal}List(): Promise<ApiResponse<${Pascal}[]>> {
  const { data } = await apiClient.get<ApiResponse<${Pascal}[]>>('/api/${camel}/list');
  return {
    success: data.status === 200,
    message: data.message,
    data: data.data ?? [],
  };
}`;

    case 'query':
      return `import { useApiQuery } from '@/hooks/useApiQuery';
import { get${Pascal}List } from '@/api/sys/${camel}';   // 도메인 패키지 아래에 둔다

// useApiQuery 는 ApiResponse.success 로 성공을 판정하고 data 를 언래핑해 반환한다.

export function use${Pascal}List() {
  return useApiQuery(['${camel}', 'list'], get${Pascal}List);
}`;

    case 'grid':
      return `import { useMemo } from 'react';
import GridTable from '@/components/grid/GridTable';
import { use${Pascal}List } from '@/hooks/use${Pascal}List';

export default function ${Pascal}List() {
  const { data = [] } = use${Pascal}List();
  const columnDefs = useMemo(() => [
    { field: 'id', headerName: 'ID', width: 120 },
    { field: 'name', headerName: '명칭', flex: 1 },
  ], []);

  return (
    <div className="page-master">
      <GridTable rowData={data} columnDefs={columnDefs} />
    </div>
  );
}`;

    case 'store':
      return `import { create } from 'zustand';

interface ${Pascal}State {
  items: string[];
  setItems: (items: string[]) => void;
}

export const use${Pascal}Store = create<${Pascal}State>((set) => ({
  items: [],
  setItems: (items) => set({ items }),
}));`;
  }
}

/**
 * 코드 템플릿 — 뼈대(skeleton).
 * 프로젝트 컨벤션에 맞는 보일러플레이트를 이름만 넣어 생성합니다.
 * 템플릿 종류는 필요에 따라 `buildTemplate`에 추가하면 됩니다.
 */
export default function CodeTemplateBuilder() {
  const [kind, setKind] = useState<TemplateKind>('api');
  const [name, setName] = useState('');

  const code = useMemo(() => buildTemplate(kind, name.trim()), [kind, name]);

  return (
    <div className="page-container page-scrollable">
      <div className="ds-section-header">
        <h2>코드 템플릿</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '4px 0 0' }}>
          프로젝트 컨벤션에 맞춘 보일러플레이트를 생성합니다. 이름을 입력하면 즉시 반영됩니다.
        </p>
      </div>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="뼈대 화면"
        description="기본 템플릿 4종만 등록돼 있습니다. 템플릿 추가는 buildTemplate()에 case를 추가하세요."
      />

      <Card size="small" style={{ marginBottom: 16 }}>
        <Segmented
          size="small"
          options={TEMPLATE_KINDS}
          value={kind}
          onChange={(v) => setKind(v as TemplateKind)}
          style={{ marginBottom: 12 }}
        />
        <Input
          size="small"
          placeholder="이름 (예: NplLoan)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ maxWidth: 320 }}
        />
        <div style={{ marginTop: 6 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            입력값은 PascalCase / camelCase로 자동 변환돼 템플릿에 치환됩니다.
          </Text>
        </div>
      </Card>

      <CodeSnippet title="생성된 코드" code={code} />
    </div>
  );
}
