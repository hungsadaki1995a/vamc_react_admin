import { useState, useMemo } from 'react';
import {
  Tabs, Card, Input, Select, DatePicker, Checkbox, Radio,
  Switch, Slider, InputNumber, AutoComplete, Cascader,
  TreeSelect, Divider, Space, Row, Col, Alert, Tag,
} from 'antd';
import ComcdSelect from '@/components/inputs/ComcdSelect';
import SearchSelectField from '@/components/inputs/SearchSelectField';
import type { SearchSelectValue } from '@/components/inputs/SearchSelectField';
import CodeSnippet from '@/components/common/CodeSnippet';
import styles from './index.module.css';

const { TextArea, Search, Password } = Input;

/* ─── Antd 탭 기존 data ─── */
const treeData = [
  { value: 'dev', title: '개발팀', children: [{ value: 'frontend', title: '프론트엔드' }, { value: 'backend', title: '백엔드' }] },
  { value: 'design', title: '디자인팀', children: [{ value: 'ui', title: 'UI/UX' }] },
];

const cascaderOptions = [
  { value: 'seoul', label: '서울', children: [{ value: 'gangnam', label: '강남구' }, { value: 'seocho', label: '서초구' }] },
  { value: 'gyeonggi', label: '경기도', children: [{ value: 'seongnam', label: '성남시' }] },
];

/* ─── ComcdSelect code snippet ─── */
const comcdCode = `import ComcdSelect from '@/components/inputs/ComcdSelect';

// cdDmnId: T_CCO_COM_C의 코드 도메인 ID
// comcdStore에서 해당 도메인의 코드 목록을 자동 로드
<ComcdSelect
  cdDmnId="JBC_CD"          // 직책 코드
  placeholder="직책 선택"
  style={{ width: 200 }}
  allowClear
  onChange={(value) => console.log(value)}
/>

// antd Select의 모든 Props를 그대로 사용 가능
// (options prop만 제외 — cdDmnId로 자동 주입)
<ComcdSelect
  cdDmnId="GD_CD"           // 등급 코드
  mode="multiple"
  size="small"
  disabled={!canWrite}
/>`;

// 체이닝 데모용 정적 데이터 (comcdStore 불필요 — 개념 시연용)
const CHAIN_PARENT_OPTIONS = [
  { label: 'SW 개발', value: 'SW' },
  { label: '인프라', value: 'INFRA' },
  { label: '운영지원', value: 'OPS' },
];

interface ChainChildOption { label: string; value: string; parentCd: string; }
const CHAIN_CHILD_OPTIONS: ChainChildOption[] = [
  { label: '프론트엔드', value: 'SW01', parentCd: 'SW' },
  { label: '백엔드', value: 'SW02', parentCd: 'SW' },
  { label: '모바일앱', value: 'SW03', parentCd: 'SW' },
  { label: '네트워크', value: 'INF01', parentCd: 'INFRA' },
  { label: '서버/스토리지', value: 'INF02', parentCd: 'INFRA' },
  { label: 'DB 관리', value: 'INF03', parentCd: 'INFRA' },
  { label: '시스템 모니터링', value: 'OPS01', parentCd: 'OPS' },
  { label: '고객지원', value: 'OPS02', parentCd: 'OPS' },
  { label: '보안운영', value: 'OPS03', parentCd: 'OPS' },
];

const comcdChainCode = `import ComcdSelect from '@/components/inputs/ComcdSelect';
import type { CodeDetail } from '@/api/common/code';

// ─ 폼에서 체이닝 ──────────────────────────────────────────
const [parentVal, setParentVal] = useState('');
const [childVal, setChildVal] = useState('');

// ① 부모 셀렉트
<ComcdSelect
  cdDmnId="BZ_LRG_CD"          // 대분류 도메인
  placeholder="대분류 선택"
  value={parentVal || undefined}
  onChange={(v) => {
    setParentVal(v as string);
    setChildVal('');             // 부모 변경 시 자식 초기화
  }}
  allowClear
/>

// ② 자식 셀렉트 — filterFn에 부모값 캡처
//   CodeDetail.bzLrgCzCd 필드가 부모 코드와 일치하는 항목만 표시
<ComcdSelect
  cdDmnId="BZ_DTL_CD"          // 소분류 도메인
  placeholder="소분류 선택"
  value={childVal || undefined}
  onChange={(v) => setChildVal(v as string)}
  filterFn={(c: CodeDetail) => c.bzLrgCzCd === parentVal}
  disabled={!parentVal}        // 부모 미선택 시 비활성
/>`;

const comcdPrefixCode = `// prefixOption — 옵션 상단에 빈값(value='') 항목 추가
// 필터/검색 조건에서 "전체" 선택이 필요한 경우 사용

// "전체" 옵션 추가 (필터 드롭다운)
<ComcdSelect cdDmnId="JBC_CD" prefixOption="전체" style={{ width: 160 }} />

// "선택" 옵션 추가 (폼 필드)
<ComcdSelect cdDmnId="GD_CD" prefixOption="선택" style={{ width: 160 }} />

// 빈 레이블 옵션 추가
<ComcdSelect cdDmnId="JBC_CD" prefixOption="" style={{ width: 160 }} />`;

/* ─── SearchSelectField code snippet ─── */
const ssfSingleCode = `import SearchSelectField from '@/components/inputs/SearchSelectField';
import type { SearchSelectValue } from '@/components/inputs/SearchSelectField';

const [value, setValue] = useState<SearchSelectValue | null>(null);

// 단건 선택 + 정적 옵션
<SearchSelectField
  value={value}
  onChange={setValue}
  options={[
    { label: '홍길동', value: 'U001' },
    { label: '김철수', value: 'U002' },
  ]}
  placeholder="사용자 검색"
  modalTitle="사용자 선택"
/>`;

const ssfMultiCode = `// 다중 선택 + 비동기 로드
const [members, setMembers] = useState<SearchSelectValue[]>([]);

<SearchSelectField
  value={members}
  onChange={(v) => setMembers(v as SearchSelectValue[])}
  multiple={true}
  fetchOptions={async (keyword) => {
    const res = await userApi.search(keyword);
    return res.map(u => ({ label: u.name, value: u.id }));
  }}
  modalTitle="참여자 선택"
  modalWidth={640}
  columns={[
    { title: '이름', dataIndex: 'label' },
    { title: '부서', dataIndex: 'dept' },
    { title: '직책', dataIndex: 'position' },
  ]}
/>`;

/* ─── 샘플 옵션 ─── */
const sampleUsers = [
  { label: '홍길동', value: 'U001', dept: '개발팀', position: '시니어' },
  { label: '김철수', value: 'U002', dept: '개발팀', position: '리드' },
  { label: '이영희', value: 'U003', dept: '기획팀', position: '매니저' },
  { label: '박민수', value: 'U004', dept: 'QA팀', position: '주니어' },
  { label: '최지영', value: 'U005', dept: '디자인팀', position: '시니어' },
];

export default function InputComponentsDemo() {
  const [switchVal, setSwitchVal] = useState(true);
  const [sliderVal, setSliderVal] = useState(30);
  const [radioVal, setRadioVal] = useState('a');
  const [checkboxVals, setCheckboxVals] = useState<string[]>(['apple']);

  // ComcdSelect demo
  const [comcdVal, setComcdVal] = useState<string | undefined>();
  const [comcdPrefixVal, setComcdPrefixVal] = useState<string | undefined>();
  // ComcdSelect chain demo (static data — comcdStore 불필요)
  const [chainParentVal, setChainParentVal] = useState<string>('');
  const [chainChildVal, setChainChildVal] = useState<string>('');
  const chainChildOptions = useMemo(
    () => CHAIN_CHILD_OPTIONS.filter((c) => !chainParentVal || c.parentCd === chainParentVal),
    [chainParentVal],
  );

  // SearchSelectField demo — single
  const [ssfSingle, setSsfSingle] = useState<SearchSelectValue | null>(null);
  // SearchSelectField demo — multiple
  const [ssfMulti, setSsfMulti] = useState<SearchSelectValue[] | null>(null);

  return (
    <div className="page-container page-scrollable">
      <div className="ds-section-header">
        <h2>입력 컴포넌트</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '4px 0 0' }}>
          커스텀 입력 컴포넌트 및 Ant Design 기본 입력 컴포넌트 사용 예시입니다.
        </p>
      </div>

      <Tabs
        defaultActiveKey="comcd"
        items={[
          /* ── ComcdSelect ── */
          {
            key: 'comcd',
            label: 'ComcdSelect',
            children: (
              <Card size="small">
                <p className={styles.demoDesc}>
                  공통 코드 도메인 ID(<code>cdDmnId</code>)만 지정하면 <code>comcdStore</code>에서
                  코드 목록을 자동으로 가져오는 Select입니다. antd Select의 모든 Props를 그대로 사용합니다.
                </p>

                <Alert
                  type="info"
                  showIcon
                  title="comcdStore는 로그인 후 서버 API에서 코드 목록을 로드합니다. 개발 환경에서 store가 비어있으면 옵션이 표시되지 않을 수 있습니다."
                  style={{ marginBottom: 12 }}
                />

                <table className={styles.demoPropsTable}>
                  <thead>
                    <tr><th style={{ width: 160 }}>Prop</th><th>타입</th><th style={{ width: 80 }}>필수</th><th>설명</th></tr>
                  </thead>
                  <tbody>
                    <tr><td><code>cdDmnId</code></td><td><code>string</code></td><td style={{ textAlign: 'center' }}>✓</td><td>코드 도메인 ID (T_CCO_COM_C.CD_DMN_ID)</td></tr>
                    <tr><td><code>prefixOption</code></td><td><code>string</code></td><td></td><td>옵션 상단에 추가할 빈값(value='') 항목 레이블. 예: <code>'전체'</code>, <code>'선택'</code>, <code>''</code></td></tr>
                    <tr><td colSpan={4} style={{ background: 'var(--flyout-header-bg)', fontStyle: 'italic', fontSize: 12 }}>+ antd SelectProps (options 제외) 모두 사용 가능</td></tr>
                    <tr><td><code>placeholder</code></td><td><code>string</code></td><td></td><td>입력 플레이스홀더</td></tr>
                    <tr><td><code>allowClear</code></td><td><code>boolean</code></td><td></td><td>선택 초기화 버튼 표시</td></tr>
                    <tr><td><code>mode</code></td><td><code>'multiple' | 'tags'</code></td><td></td><td>다중 선택 모드</td></tr>
                    <tr><td><code>disabled</code></td><td><code>boolean</code></td><td></td><td>비활성화</td></tr>
                    <tr><td><code>size</code></td><td><code>'small' | 'middle' | 'large'</code></td><td></td><td>크기</td></tr>
                    <tr><td><code>onChange</code></td><td><code>(value: string | string[]) =&gt; void</code></td><td></td><td>선택 변경 콜백</td></tr>
                  </tbody>
                </table>

                <div className={styles.liveDemo}>
                  <Space wrap>
                    <ComcdSelect
                      cdDmnId="JBC_CD"
                      placeholder="직책 코드 선택"
                      style={{ width: 200 }}
                      allowClear
                      value={comcdVal}
                      onChange={(v) => setComcdVal(v as string)}
                    />
                    <ComcdSelect
                      cdDmnId="GD_CD"
                      placeholder="등급 코드 선택"
                      style={{ width: 200 }}
                      allowClear
                    />
                    <ComcdSelect
                      cdDmnId="JBC_CD"
                      placeholder="다중 선택"
                      mode="multiple"
                      style={{ width: 240 }}
                    />
                  </Space>
                  <div className={styles.resultBox}>선택된 값: {comcdVal ?? '(없음)'}</div>
                </div>

                <CodeSnippet code={comcdCode} />

                <Divider titlePlacement="left" style={{ marginTop: 20 }}>prefixOption — 상단 빈값 옵션</Divider>
                <p className={styles.demoDesc}>
                  필터 드롭다운처럼 "전체" 또는 "선택" 등의 빈값 옵션이 상단에 필요할 때 사용합니다.
                  선택 시 value는 <code>''</code>(빈 문자열)입니다.
                </p>
                <div className={styles.liveDemo}>
                  <Space wrap>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>prefixOption="전체"</div>
                      <ComcdSelect
                        cdDmnId="JBC_CD"
                        prefixOption="전체"
                        style={{ width: 160 }}
                        value={comcdPrefixVal}
                        onChange={(v) => setComcdPrefixVal(v as string)}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>prefixOption="선택"</div>
                      <ComcdSelect cdDmnId="GD_CD" prefixOption="선택" style={{ width: 160 }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>prefixOption="" (빈값)</div>
                      <ComcdSelect cdDmnId="JBC_CD" prefixOption="" style={{ width: 160 }} />
                    </div>
                  </Space>
                  <div className={styles.resultBox}>선택된 값: {comcdPrefixVal === '' ? '(빈 문자열)' : (comcdPrefixVal ?? '(없음)')}</div>
                </div>

                <CodeSnippet code={comcdPrefixCode} />

                <Divider titlePlacement="left" style={{ marginTop: 20 }}>filterFn — 체이닝 (연쇄 선택)</Divider>
                <p className={styles.demoDesc}>
                  <code>filterFn</code> prop으로 부모 선택값에 따라 자식 셀렉트의 옵션을 필터링합니다.
                  아래 데모는 <strong>정적 데이터</strong>로 동작하며, 실제 운영에서는
                  <code>{'ComcdSelect filterFn={(c) => c.bzLrgCzCd === parentVal}'}</code> 형태로 사용합니다.
                </p>

                {/* ── 체이닝 흐름 시각화 ── */}
                <div style={{
                  display: 'flex', alignItems: 'stretch', gap: 0,
                  border: '1px solid var(--border-color)', borderRadius: 8, overflow: 'hidden',
                  margin: '12px 0',
                }}>
                  {/* Step 1 — 부모 */}
                  <div style={{
                    flex: 1, padding: '16px 20px',
                    background: 'var(--content-header-bg)',
                    borderRight: '1px solid var(--border-color)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                      <span style={{
                        background: '#1677ff', color: '#fff', borderRadius: '50%',
                        width: 20, height: 20, display: 'inline-flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0,
                      }}>1</span>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>대분류 선택</span>
                      <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>부모</Tag>
                    </div>
                    <Select
                      options={CHAIN_PARENT_OPTIONS}
                      placeholder="업무유형 선택"
                      value={chainParentVal || undefined}
                      onChange={(v) => { setChainParentVal(v ?? ''); setChainChildVal(''); }}
                      allowClear
                      style={{ width: '100%' }}
                    />
                    {chainParentVal && (
                      <div style={{ marginTop: 8, fontSize: 12, color: '#1677ff' }}>
                        선택: <strong>{CHAIN_PARENT_OPTIONS.find(o => o.value === chainParentVal)?.label}</strong>
                      </div>
                    )}
                  </div>

                  {/* Arrow */}
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', padding: '0 4px', minWidth: 48,
                    background: chainParentVal ? '#e6f4ff' : 'var(--content-header-bg)',
                    transition: 'background 0.2s',
                    gap: 4,
                  }}>
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                      <path d="M6 14 L20 14 M14 8 L20 14 L14 20"
                        stroke={chainParentVal ? '#1677ff' : '#bfbfbf'}
                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        style={{ transition: 'stroke 0.2s' }}
                      />
                    </svg>
                    <span style={{ fontSize: 10, color: chainParentVal ? '#1677ff' : '#bfbfbf', transition: 'color 0.2s', textAlign: 'center', lineHeight: 1.2 }}>
                      {chainParentVal ? 'filterFn\n적용 중' : 'filterFn'}
                    </span>
                  </div>

                  {/* Step 2 — 자식 */}
                  <div style={{
                    flex: 1, padding: '16px 20px',
                    background: chainParentVal ? '#f0f7ff' : 'var(--content-bg)',
                    borderLeft: chainParentVal ? '2px solid #1677ff' : '1px solid var(--border-color)',
                    transition: 'all 0.2s',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                      <span style={{
                        background: chainParentVal ? '#1677ff' : '#bfbfbf',
                        color: '#fff', borderRadius: '50%',
                        width: 20, height: 20, display: 'inline-flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0,
                        transition: 'background 0.2s',
                      }}>2</span>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>소분류 선택</span>
                      <Tag color="green" style={{ margin: 0, fontSize: 11 }}>자식</Tag>
                      {/* 필터 카운트 배지 */}
                      <Tag
                        color={chainParentVal ? 'blue' : 'default'}
                        style={{ margin: 0, fontSize: 11 }}
                      >
                        {chainChildOptions.length} / {CHAIN_CHILD_OPTIONS.length}개
                      </Tag>
                    </div>
                    <Select
                      options={chainChildOptions}
                      placeholder={chainParentVal ? '소분류 선택' : '← 대분류를 먼저 선택하세요'}
                      value={chainChildVal || undefined}
                      onChange={(v) => setChainChildVal(v ?? '')}
                      disabled={!chainParentVal}
                      allowClear
                      style={{ width: '100%' }}
                    />
                    {chainParentVal && (
                      <div style={{ marginTop: 8, fontSize: 12, color: '#52c41a' }}>
                        <strong>"{CHAIN_PARENT_OPTIONS.find(o => o.value === chainParentVal)?.label}"</strong> 기준으로 필터링됨
                      </div>
                    )}
                    {!chainParentVal && (
                      <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-disabled, #bfbfbf)' }}>
                        대분류 선택 후 활성화됩니다
                      </div>
                    )}
                  </div>
                </div>

                {/* 결과 요약 */}
                <div className={styles.resultBox}>
                  {chainParentVal
                    ? `대분류: "${CHAIN_PARENT_OPTIONS.find(o => o.value === chainParentVal)?.label}" → 소분류 옵션 ${CHAIN_CHILD_OPTIONS.length}개 중 ${chainChildOptions.length}개 표시${chainChildVal ? ` → 선택: "${chainChildOptions.find(o => o.value === chainChildVal)?.label}"` : ''}`
                    : '← 대분류를 선택하면 소분류가 자동으로 필터링됩니다'}
                </div>

                <CodeSnippet code={comcdChainCode} title="ComcdSelect filterFn 체이닝 (실제 코드)" />
              </Card>
            ),
          },

          /* ── SearchSelectField ── */
          {
            key: 'ssf',
            label: 'SearchSelectField',
            children: (
              <Card size="small">
                <p className={styles.demoDesc}>
                  텍스트 입력 자동완성 + 🔍 버튼 클릭 시 팝업 모달 검색을 제공하는 커스텀 입력 컴포넌트입니다.
                  단건/다중 선택, 정적/비동기 옵션, 커스텀 컬럼, 완전 커스텀 모달 본문을 지원합니다.
                </p>

                <table className={styles.demoPropsTable}>
                  <thead>
                    <tr><th style={{ width: 180 }}>Prop</th><th>타입</th><th style={{ width: 80 }}>기본값</th><th>설명</th></tr>
                  </thead>
                  <tbody>
                    <tr><td><code>value</code></td><td><code>SearchSelectValue | SearchSelectValue[] | null</code></td><td>—</td><td>선택된 값 (controlled)</td></tr>
                    <tr><td><code>onChange</code></td><td><code>(val: SearchSelectValue | SearchSelectValue[] | null) =&gt; void</code></td><td>—</td><td>선택 변경 콜백</td></tr>
                    <tr><td><code>options</code></td><td><code>SearchSelectOption[]</code></td><td>—</td><td>정적 옵션 목록 <code>&#123; label, value, ...extras &#125;</code></td></tr>
                    <tr><td><code>fetchOptions</code></td><td><code>(keyword: string) =&gt; Promise&lt;SearchSelectOption[]&gt;</code></td><td>—</td><td>비동기 옵션 로더 (모달 열기 + 자동완성 타이핑 시 호출)</td></tr>
                    <tr><td><code>multiple</code></td><td><code>boolean</code></td><td><code>false</code></td><td>다중 선택 모드 (체크박스)</td></tr>
                    <tr><td><code>placeholder</code></td><td><code>string</code></td><td><code>"검색어 입력"</code></td><td>자동완성 플레이스홀더</td></tr>
                    <tr><td><code>disabled</code></td><td><code>boolean</code></td><td><code>false</code></td><td>전체 비활성화</td></tr>
                    <tr><td><code>modalTitle</code></td><td><code>string</code></td><td><code>"검색"</code></td><td>팝업 모달 제목</td></tr>
                    <tr><td><code>modalWidth</code></td><td><code>number</code></td><td><code>560</code></td><td>팝업 모달 너비(px)</td></tr>
                    <tr><td><code>columns</code></td><td><code>ColumnsType&lt;SearchSelectOption&gt;</code></td><td>—</td><td>[Level 1] 기본 [명칭, 코드] 컬럼 대체</td></tr>
                    <tr><td><code>showModalSearch</code></td><td><code>boolean</code></td><td><code>true</code></td><td>[Level 2] 모달 내 검색 입력 표시 여부</td></tr>
                    <tr><td><code>modalSearchFields</code></td><td><code>(keyof SearchSelectOption)[]</code></td><td><code>['label','value']</code></td><td>[Level 2] 검색 대상 필드 목록</td></tr>
                    <tr><td><code>renderModalContent</code></td><td><code>(ctx: ModalContentContext) =&gt; ReactNode</code></td><td>—</td><td>[Level 3] 모달 본문 완전 커스텀 (기본 Table 대체)</td></tr>
                    <tr><td><code>codeWidth</code></td><td><code>number</code></td><td><code>110</code></td><td>우측 코드 입력 너비(px)</td></tr>
                  </tbody>
                </table>

                {/* 단건 선택 데모 */}
                <Divider titlePlacement="left" style={{ marginTop: 16 }}>단건 선택</Divider>
                <div className={styles.liveDemo}>
                  <SearchSelectField
                    value={ssfSingle}
                    onChange={(v) => setSsfSingle(v as SearchSelectValue | null)}
                    options={sampleUsers}
                    placeholder="사용자 검색"
                    modalTitle="사용자 선택"
                    style={{ maxWidth: 400 }}
                  />
                  <div className={styles.resultBox}>
                    선택: {ssfSingle ? `${ssfSingle.label} (${ssfSingle.value})` : '(없음)'}
                  </div>
                </div>
                <CodeSnippet code={ssfSingleCode} />

                {/* 다중 선택 데모 */}
                <Divider titlePlacement="left" style={{ marginTop: 16 }}>다중 선택</Divider>
                <div className={styles.liveDemo}>
                  <SearchSelectField
                    value={ssfMulti}
                    onChange={(v) => setSsfMulti(v as SearchSelectValue[] | null)}
                    options={sampleUsers}
                    multiple={true}
                    placeholder="참여자 검색"
                    modalTitle="참여자 선택"
                    style={{ maxWidth: 500 }}
                  />
                  <div className={styles.resultBox}>
                    선택: {ssfMulti?.length
                      ? ssfMulti.map((v) => `${v.label}(${v.value})`).join(', ')
                      : '(없음)'}
                  </div>
                </div>
                <CodeSnippet code={ssfMultiCode} />
              </Card>
            ),
          },

          /* ── Ant Design 기본 ── */
          {
            key: 'antd',
            label: 'Ant Design 기본',
            children: (
              <Card size="small">
                <Divider titlePlacement="left">Input 변형</Divider>
                <Row gutter={[16, 12]}>
                  <Col span={8}><Input placeholder="기본 Input" /></Col>
                  <Col span={8}><form onSubmit={(e) => e.preventDefault()}><Password placeholder="비밀번호" /></form></Col>
                  <Col span={8}><Search placeholder="검색어 입력" onSearch={(v) => console.log(v)} /></Col>
                  <Col span={8}><InputNumber style={{ width: '100%' }} placeholder="숫자 입력" min={0} max={100} /></Col>
                  <Col span={8}><AutoComplete style={{ width: '100%' }} placeholder="자동완성" options={[{ value: '홍길동' }, { value: '김철수' }]} /></Col>
                  <Col span={24}><TextArea rows={3} placeholder="여러 줄 텍스트" /></Col>
                </Row>

                <Divider titlePlacement="left">Select</Divider>
                <Row gutter={[16, 12]}>
                  <Col span={8}>
                    <Select style={{ width: '100%' }} placeholder="단일 선택" options={[{ value: '1', label: '옵션 1' }, { value: '2', label: '옵션 2' }, { value: '3', label: '옵션 3' }]} />
                  </Col>
                  <Col span={8}>
                    <Select mode="multiple" style={{ width: '100%' }} placeholder="다중 선택" options={[{ value: 'apple', label: '사과' }, { value: 'banana', label: '바나나' }, { value: 'cherry', label: '체리' }]} />
                  </Col>
                  <Col span={8}>
                    <Select showSearch style={{ width: '100%' }} placeholder="검색 가능 Select" options={[{ value: 'react', label: 'React' }, { value: 'vue', label: 'Vue' }, { value: 'angular', label: 'Angular' }]} />
                  </Col>
                </Row>

                <Divider titlePlacement="left">DatePicker</Divider>
                <Space wrap>
                  <DatePicker placeholder="날짜" />
                  <DatePicker.RangePicker placeholder={['시작', '종료']} />
                  <DatePicker picker="month" placeholder="월" />
                </Space>

                <Divider titlePlacement="left">Checkbox / Radio</Divider>
                <Card size="small">
                  <Space orientation="vertical" style={{ width: '100%' }}>
                    <Checkbox.Group
                      value={checkboxVals}
                      onChange={(v) => setCheckboxVals(v as string[])}
                      options={[{ label: '사과', value: 'apple' }, { label: '바나나', value: 'banana' }, { label: '체리', value: 'cherry' }]}
                    />
                    <Radio.Group value={radioVal} onChange={(e) => setRadioVal(e.target.value)}>
                      <Radio value="a">옵션 A</Radio>
                      <Radio value="b">옵션 B</Radio>
                      <Radio value="c">옵션 C</Radio>
                    </Radio.Group>
                    <Radio.Group value={radioVal} onChange={(e) => setRadioVal(e.target.value)} optionType="button">
                      <Radio value="a">A</Radio>
                      <Radio value="b">B</Radio>
                      <Radio value="c">C</Radio>
                    </Radio.Group>
                  </Space>
                </Card>

                <Divider titlePlacement="left">Switch / Slider</Divider>
                <Space orientation="vertical">
                  <Space>
                    <Switch checked={switchVal} onChange={setSwitchVal} />
                    <span>Switch: {switchVal ? 'ON' : 'OFF'}</span>
                  </Space>
                  <div style={{ width: 300 }}>
                    <Slider value={sliderVal} onChange={setSliderVal} marks={{ 0: '0', 50: '50', 100: '100' }} />
                    <span>값: {sliderVal}</span>
                  </div>
                </Space>

                <Divider titlePlacement="left">TreeSelect / Cascader</Divider>
                <Row gutter={16}>
                  <Col span={12}>
                    <TreeSelect style={{ width: '100%' }} treeData={treeData} placeholder="부서 선택 (TreeSelect)" allowClear />
                  </Col>
                  <Col span={12}>
                    <Cascader style={{ width: '100%' }} options={cascaderOptions} placeholder="지역 선택 (Cascader)" />
                  </Col>
                </Row>
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}
