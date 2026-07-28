# VAMC NPL ADMIN — 다국어(i18n) & 권한(Permission)

## 다국어 (i18n)

### 아키텍처

```
서버 GET /api/lbl/bulk
  ← X-Project-Id 헤더 (projectStore.activeProject.id)
  ← X-Lang 헤더 (localeStore.locale)
  → Record<string, string>  (labelKey → 번역텍스트)
  → labelStore.labels 저장
```

라벨은 **앱 마운트** 시와 **프로젝트/언어 변경** 시 `App.tsx`에서 자동 재로드됩니다.

---

### localeStore

```typescript
import { useLocaleStore } from '@/stores/localeStore';

export type LocaleKey = 'ko' | 'en' | 'vi';

const { locale, setLocale } = useLocaleStore();
setLocale('en'); // 언어 변경 → App.tsx가 감지하여 라벨 재로드
```

localStorage 키: `pms-locale`

---

### labelStore

```typescript
import { useLabelStore } from '@/stores/labelStore';

// 컴포넌트 내부
const t = useLabelStore((s) => s.t);
return <Button>{t('BTN_SAVE')}</Button>;
// 키가 없으면 키 자체 반환 ('BTN_SAVE')
// 빈 문자열 반환 없음
```

| 메서드 | 설명 |
|--------|------|
| `t(key)` | 키로 번역 텍스트 반환. 없으면 key 자체 반환 |
| `loadLabels()` | 서버에서 라벨 일괄 로드 (App.tsx에서 자동 호출) |
| `loading` | 로드 중 여부 |

---

### 라벨 API

```
GET /api/lbl/bulk
  헤더: X-Project-Id, X-Lang
  인증: 불필요 (permitAll)
  응답: { status: 200, data: { "BTN_SAVE": "저장", ... } }
```

`fetchBulkLabels()` 함수는 `src/api/lbl.ts`에 위치합니다.

---

### 라벨 키 관리

| 접두사 예시 | 용도 |
|------------|------|
| `BTN_*` | 버튼 텍스트 |
| `LBL_*` | 폼 라벨 |
| `MSG_*` | 안내/오류 메시지 |
| `TTL_*` | 화면/섹션 제목 |

키가 서버에 없어도 UI는 키 자체를 표시하므로 개발 중 영향 없습니다.

---

## 권한 (Permission)

### 아키텍처

```
서버 GET /api/mnu/auth-list
  ← X-Project-Id 헤더
  → MnuResponse[] (permType 포함)
  → menuStore.serverMenus 저장

useMenuPermission()
  → activeTabKey (tabStore)
  → findMenuByKey(serverMenus, activeTabKey)
  → MenuItem.permType
  → { canRead, canWrite }
```

---

### permType 값

DB `MENU_ROLE_MPNG.MENU_AUTHRT` 도메인을 그대로 사용한다.

| permType | canRead | canWrite | 설명 |
|----------|---------|----------|------|
| `'AL'` | ✅ | ✅ | 전체 (읽기 + 수정) |
| `'WT'` | ✅ | ✅ | 쓰기 — 쓰기는 읽기를 포함 |
| `'RD'` | ✅ | ❌ | 읽기만 |
| `''` | ❌ | ❌ | 접근 불가 (매핑 없음) |

정적 메뉴(dashboard/dev 도구)는 서버 권한 대상이 아니므로 `'AL'`로 폴백한다.
백엔드는 `ROLE_ADMIN` 보유 시 매핑과 무관하게 통과시킨다(`PermissionGuard.isAdmin`).

---

### useMenuPermission 훅

```typescript
import { useMenuPermission } from '@/hooks/useMenuPermission';

function MyPage() {
  const { canRead, canWrite, permType } = useMenuPermission();

  if (!canRead) return <div>접근 권한이 없습니다.</div>;

  return (
    <>
      <GridToolbar
        totalCount={data.length}
        actions={
          canWrite && (
            <>
              <Button type="primary" onClick={handleAdd}>등록</Button>
              <Button danger onClick={handleDelete}>삭제</Button>
            </>
          )
        }
      />
    </>
  );
}
```

---

### 메뉴 API

```
GET /api/mnu/auth-list
  헤더: Authorization (Bearer), X-Project-Id, X-Lang
  인증: 필요
  응답: { status: 200, data: MnuResponse[] }
```

`MnuResponse` 주요 필드:

| 필드 | 타입 | 설명 |
|------|------|------|
| `mnuId` | string | 메뉴 ID (tabKey로 사용) |
| `upMnuId` | string | 부모 메뉴 ID (`ROOT` = 최상위) |
| `mnuNm` | string | 메뉴명 |
| `labelNm` | string \| null | i18n 표시명 (없으면 mnuNm 사용) |
| `sceId` | string \| null | 화면 ID → componentPath 매핑 |
| `permType` | string \| null | `'M'` / `'S'` / `''` |
| `mnuXrsYn` | string | 표시 여부 (`'N'`이면 숨김) |
| `mnuRank` | number | 정렬 순서 |

---

### 공통코드 (comcdStore)

```typescript
import { useComcdStore } from '@/stores/comcdStore';

// 코드명 조회
const getCodeName = useComcdStore((s) => s.getCodeName);
const label = getCodeName('TASK_STATUS', 'DONE'); // '완료'

// Select 컴포넌트 (자동 옵션 로드)
<ComcdSelect cdDmnId="TASK_STATUS" value={status} onChange={setStatus} />
```

공통코드 API:
- `GET /api/comcd/all` — 전체 코드 일괄 로드 (인증 불필요)
- `GET /api/comcd/codes?projId=&cdDmnId=` — 특정 도메인 코드 조회
- `GET /api/comcd/domains?projId=` — 코드 도메인 목록
