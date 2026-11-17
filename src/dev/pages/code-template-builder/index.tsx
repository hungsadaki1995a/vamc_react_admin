import { useMemo, useState } from 'react';
import { Alert, Card, Input, Segmented, Typography } from 'antd';
import CodeSnippet from '@/components/common/CodeSnippet';
import DevPageHeader from '@/dev/DevPageHeader';

const { Text } = Typography;

type TemplateKind = 'api' | 'query' | 'grid' | 'store';

const TEMPLATE_KINDS: { value: TemplateKind; label: string }[] = [
  { value: 'api', label: 'API function' },
  { value: 'query', label: 'useApiQuery hook' },
  { value: 'grid', label: 'GridTable screen' },
  { value: 'store', label: 'Zustand store' },
];

function buildTemplate(kind: TemplateKind, name: string): string {
  const Pascal = name ? name[0].toUpperCase() + name.slice(1) : 'Sample';
  const camel = Pascal[0].toLowerCase() + Pascal.slice(1);

  switch (kind) {
    case 'api':
      // The server returns only { status, message, data } — there is no success field.
      // useApiQuery / useApiMutation decide success from `success`, so convert status -> success here.
      // (same shape as getLabelRows in src/api/sys/lblMngApi.ts)
      return `// Location: src/api/{domain}/${camel}.ts
//   domain = common (global bootstrap) | sys (system operations) — add a folder for a new business domain.
//   Name the file after the business area, not the screen ID — e.g. menuMng.ts (menu management), lblMng.ts (label management).\n//   Never create an api.ts inside a screen folder (src/features/**).
import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';

// One-to-one with the server DTO — colocate the type in this file (see src/api/common/comCdApi.ts)
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
import { get${Pascal}List } from '@/api/sys/${camel}';   // keep it under the domain package

// useApiQuery decides success from ApiResponse.success and returns the unwrapped data.

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
    { field: 'name', headerName: 'Name', flex: 1 },
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
 * Code templates — a skeleton.
 * Generates boilerplate that follows the project conventions from just a name.
 * Add more template kinds to `buildTemplate` as needed.
 */
export default function CodeTemplateBuilder() {
  const [kind, setKind] = useState<TemplateKind>('api');
  const [name, setName] = useState('');

  const code = useMemo(() => buildTemplate(kind, name.trim()), [kind, name]);

  return (
    <div className="page-container page-scrollable">
      <DevPageHeader page="CodeTemplateBuilder" />

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Skeleton screen"
        description="Only four base templates are registered. To add one, add a case to buildTemplate()."
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
          placeholder="Name (e.g. NplLoan)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ maxWidth: 320 }}
        />
        <div style={{ marginTop: 6 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Your input is converted to PascalCase / camelCase automatically and substituted into the template.
          </Text>
        </div>
      </Card>

      <CodeSnippet title="Generated code" code={code} />
    </div>
  );
}
