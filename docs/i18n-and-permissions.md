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

export type LocaleKey = 'ko' | 'en' | 'vn';

const { locale, setLocale } = useLocaleStore();
setLocale('en'); // 언어 변경 → App.tsx가 감지하여 라벨 재로드
```

localStorage 키: `vamc-locale`

> 프론트 로케일(`ko`/`en`/`vn`)과 DB 언어코드(`KR`/`EN`/`VN`)는 표기가 다릅니다.
> 서버 `LangCdResolver`가 `ko → KR`로 보정하고, 지원 목록 밖의 값은 기본 언어로 떨어뜨립니다.

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
| `t(key, defaultText?)` | 키로 번역 텍스트 반환. 없으면 `defaultText` → 그것도 없으면 key 자체 |
| `tmc/tmi/tme(code)` | 전역 메시지 — `MESSAGE.{CONFIRM\|INFO\|ERROR}.TEXT_{code}` |
| `loadLabels()` | 서버에서 라벨 일괄 로드 (App.tsx에서 자동 호출) |
| `labelsVersion` | 라벨 갱신 카운터 — `useMemo`/`useCallback` 의존성으로 쓴다 |

> **`defaultText`를 반드시 넘길 것.** DB에 라벨이 없으면 키 문자열이 그대로 화면에 노출됩니다.
> 화면 단위로는 `useScreenLabel()`의 `tvt`/`tvb`/`tvh`/`tsg`/`tsm`/`tsb`를 씁니다.

---

### 라벨 API

```
GET /api/lbl/bulk
  헤더: X-Project-Id, X-Lang
  인증: 불필요 (permitAll)
  응답: { status: 200, data: { "BTN_SAVE": "저장", ... } }
```

`fetchBulkLabels()` 함수는 `src/api/common/lbl.ts`에 위치합니다.

---

### 라벨 관리 API (다국어 라벨 관리 화면 `CCO102003SC` / 메뉴 `A06040400`)

라벨을 **등록·수정하는** 경로입니다. 위 `/api/lbl/bulk`가 읽기 전용 서빙이라면 이쪽은 관리용입니다.

| 메서드 | 경로 | 설명 | 권한 |
|--------|------|------|------|
| GET | `/api/lbl/rows?scrnId=&lblCd=&lblSeCd=` | 라벨-번역 행 목록. 세 조건 모두 선택, `lblCd`는 부분일치 | Bearer |
| GET | `/api/lbl/languages` | 사용 언어 목록 (`LANG_MNG`) | Bearer |
| POST | `/api/lbl/batch` | 라벨/번역 배치 upsert | 쓰기(A06040400) |
| DELETE | `/api/lbl?lblCd=&scrnId=&lblSeCd=` | 라벨 + 그 번역 삭제 | 쓰기(A06040400) |
| GET/POST | `/api/lbl/excel/{download,template,upload}` | 엑셀 일괄 편집 | 업로드만 쓰기 |

**식별자는 단일 키가 아니라 `LANG_LBL`의 PK 3개(`LBL_CD` + `SCRN_ID` + `LBL_SE_CD`)입니다.**
`LBL_CD`만으로는 행이 특정되지 않으므로, 삭제·저장 시 항상 3개를 함께 보냅니다.

> ⚠️ `POST /api/lbl/batch`는 항목마다 라벨을 upsert한 뒤 번역을 upsert합니다.
> 번역만 저장할 때도 **`lblExpln`을 함께 실어야** 합니다 — 비우면 라벨설명이 지워집니다.

---

### 라벨 키 규약

`{화면ID}.{섹션}.{구분}_{세부코드}` — `useScreenLabel`이 조립하는 형태와 같습니다.

| 부분 | DB 컬럼 | 값 |
|------|---------|-----|
| 전체 키 | `LBL_CD` | `CCO101001SC.VIEW.TEXT_usrId` |
| 화면ID | `SCRN_ID` | `CCO101001SC` (공통은 `COMMON`) |
| 섹션 | (키의 2번째 마디) | `VIEW`(화면 템플릿) / `SCRIPT`(이벤트 핸들러) |
| 구분 | `LBL_SE_CD` | `TEXT` / `BTN` / `TITLE` / `GRID` / `MSG` |

기존 적재분은 다른 규약을 씁니다 — 메뉴 라벨은 `lbl.menu.*`(`SCRN_ID='AD_MN_00000'`, `LBL_SE_CD='MENU'`),
공통코드 라벨은 `lbl.code.*`(`CM_CD_00000` / `CODE`). 관리 화면은 이 값들도 그대로 다룹니다.

**`LBL_CD`는 전역 유일**이어야 합니다. PK상 `SCRN_ID`가 다르면 같은 `LBL_CD`가 물리적으로 가능하지만,
`/api/lbl/bulk`는 맵으로 내려주므로 중복이면 뒤 항목이 버려지고 서버 로그에 WARN만 남습니다.

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
