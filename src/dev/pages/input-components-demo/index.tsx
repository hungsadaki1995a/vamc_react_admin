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
import DevPageHeader from '@/dev/DevPageHeader';

const { TextArea, Search, Password } = Input;

/* ─── Data used by the Ant Design tab ─── */
const treeData = [
  { value: 'dev', title: 'Engineering', children: [{ value: 'frontend', title: 'Front-end' }, { value: 'backend', title: 'Backend' }] },
  { value: 'design', title: 'Design', children: [{ value: 'ui', title: 'UI/UX' }] },
];

const cascaderOptions = [
  { value: 'seoul', label: 'Seoul', children: [{ value: 'gangnam', label: 'Gangnam-gu' }, { value: 'seocho', label: 'Seocho-gu' }] },
  { value: 'gyeonggi', label: 'Gyeonggi-do', children: [{ value: 'seongnam', label: 'Seongnam-si' }] },
];

/* ─── ComcdSelect code snippet ─── */
const comcdCode = `import ComcdSelect from '@/components/inputs/ComcdSelect';

// cdDmnId: the code domain ID from T_CCO_COM_C
// The code list for that domain is loaded automatically from comcdStore
<ComcdSelect
  cdDmnId="JBC_CD"          // job title codes
  placeholder="Select a job title"
  style={{ width: 200 }}
  allowClear
  onChange={(value) => console.log(value)}
/>

// Every antd Select prop works as usual
// (except options — that is injected from cdDmnId)
<ComcdSelect
  cdDmnId="GD_CD"           // grade codes
  mode="multiple"
  size="small"
  disabled={!canWrite}
/>`;

// Static data for the chaining demo (no comcdStore needed — it only illustrates the idea)
const CHAIN_PARENT_OPTIONS = [
  { label: 'Software', value: 'SW' },
  { label: 'Infrastructure', value: 'INFRA' },
  { label: 'Operations', value: 'OPS' },
];

interface ChainChildOption { label: string; value: string; parentCd: string; }
const CHAIN_CHILD_OPTIONS: ChainChildOption[] = [
  { label: 'Front-end', value: 'SW01', parentCd: 'SW' },
  { label: 'Backend', value: 'SW02', parentCd: 'SW' },
  { label: 'Mobile app', value: 'SW03', parentCd: 'SW' },
  { label: 'Network', value: 'INF01', parentCd: 'INFRA' },
  { label: 'Server / storage', value: 'INF02', parentCd: 'INFRA' },
  { label: 'Database administration', value: 'INF03', parentCd: 'INFRA' },
  { label: 'System monitoring', value: 'OPS01', parentCd: 'OPS' },
  { label: 'Customer support', value: 'OPS02', parentCd: 'OPS' },
  { label: 'Security operations', value: 'OPS03', parentCd: 'OPS' },
];

const comcdChainCode = `import ComcdSelect from '@/components/inputs/ComcdSelect';
import type { CodeDetail } from '@/api/common/comCdApi';

// ─ Chaining inside a form ────────────────────────────────
const [parentVal, setParentVal] = useState('');
const [childVal, setChildVal] = useState('');

// 1) Parent select
<ComcdSelect
  cdDmnId="BZ_LRG_CD"          // top-level category domain
  placeholder="Select a category"
  value={parentVal || undefined}
  onChange={(v) => {
    setParentVal(v as string);
    setChildVal('');             // clear the child when the parent changes
  }}
  allowClear
/>

// 2) Child select — filterFn captures the parent value
//   Only entries whose CodeDetail.bzLrgCzCd matches the parent code are shown
<ComcdSelect
  cdDmnId="BZ_DTL_CD"          // subcategory domain
  placeholder="Select a subcategory"
  value={childVal || undefined}
  onChange={(v) => setChildVal(v as string)}
  filterFn={(c: CodeDetail) => c.bzLrgCzCd === parentVal}
  disabled={!parentVal}        // disabled until a parent is chosen
/>`;

const comcdPrefixCode = `// prefixOption — prepends an empty (value='') entry to the options
// Use it when a filter or search condition needs an "All" choice

// Adding an "All" option (filter dropdown)
<ComcdSelect cdDmnId="JBC_CD" prefixOption="All" style={{ width: 160 }} />

// Adding a "Select" option (form field)
<ComcdSelect cdDmnId="GD_CD" prefixOption="Select" style={{ width: 160 }} />

// Adding an option with an empty label
<ComcdSelect cdDmnId="JBC_CD" prefixOption="" style={{ width: 160 }} />`;

/* ─── SearchSelectField code snippet ─── */
const ssfSingleCode = `import SearchSelectField from '@/components/inputs/SearchSelectField';
import type { SearchSelectValue } from '@/components/inputs/SearchSelectField';

const [value, setValue] = useState<SearchSelectValue | null>(null);

// Single selection with static options
<SearchSelectField
  value={value}
  onChange={setValue}
  options={[
    { label: 'John Doe', value: 'U001' },
    { label: 'Michael Chen', value: 'U002' },
  ]}
  placeholder="Search users"
  modalTitle="Select a user"
/>`;

const ssfMultiCode = `// Multiple selection with async loading
const [members, setMembers] = useState<SearchSelectValue[]>([]);

<SearchSelectField
  value={members}
  onChange={(v) => setMembers(v as SearchSelectValue[])}
  multiple={true}
  fetchOptions={async (keyword) => {
    const res = await userApi.search(keyword);
    return res.map(u => ({ label: u.name, value: u.id }));
  }}
  modalTitle="Select members"
  modalWidth={640}
  columns={[
    { title: 'Name', dataIndex: 'label' },
    { title: 'Department', dataIndex: 'dept' },
    { title: 'Title', dataIndex: 'position' },
  ]}
/>`;

/* ─── Sample options ─── */
const sampleUsers = [
  { label: 'John Doe', value: 'U001', dept: 'Engineering', position: 'Senior' },
  { label: 'Michael Chen', value: 'U002', dept: 'Engineering', position: 'Lead' },
  { label: 'Emily Park', value: 'U003', dept: 'Planning', position: 'Manager' },
  { label: 'David Kim', value: 'U004', dept: 'QA', position: 'Junior' },
  { label: 'Sarah Lee', value: 'U005', dept: 'Design', position: 'Senior' },
];

export default function InputComponentsDemo() {
  const [switchVal, setSwitchVal] = useState(true);
  const [sliderVal, setSliderVal] = useState(30);
  const [radioVal, setRadioVal] = useState('a');
  const [checkboxVals, setCheckboxVals] = useState<string[]>(['apple']);

  // ComcdSelect demo
  const [comcdVal, setComcdVal] = useState<string | undefined>();
  const [comcdPrefixVal, setComcdPrefixVal] = useState<string | undefined>();
  // ComcdSelect chain demo (static data — no comcdStore needed)
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
      <DevPageHeader page="InputComponentsDemo" />

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
                  A Select that pulls its code list from <code>comcdStore</code> as soon as you give it a
                  common-code domain ID (<code>cdDmnId</code>). Every antd Select prop still works.
                </p>

                <Alert
                  type="info"
                  showIcon
                  title="comcdStore loads the code list from the server API after login. In a dev environment with an empty store, no options may appear."
                  style={{ marginBottom: 12 }}
                />

                <table className={styles.demoPropsTable}>
                  <thead>
                    <tr><th style={{ width: 160 }}>Prop</th><th>Type</th><th style={{ width: 80 }}>Required</th><th>Description</th></tr>
                  </thead>
                  <tbody>
                    <tr><td><code>cdDmnId</code></td><td><code>string</code></td><td style={{ textAlign: 'center' }}>✓</td><td>Code domain ID (T_CCO_COM_C.CD_DMN_ID)</td></tr>
                    <tr><td><code>prefixOption</code></td><td><code>string</code></td><td></td><td>Label of the empty (value='') entry prepended to the options. e.g. <code>'All'</code>, <code>'Select'</code>, <code>''</code></td></tr>
                    <tr><td colSpan={4} style={{ background: 'var(--flyout-header-bg)', fontStyle: 'italic', fontSize: 12 }}>+ every antd SelectProp except options</td></tr>
                    <tr><td><code>placeholder</code></td><td><code>string</code></td><td></td><td>Input placeholder</td></tr>
                    <tr><td><code>allowClear</code></td><td><code>boolean</code></td><td></td><td>Shows a clear button</td></tr>
                    <tr><td><code>mode</code></td><td><code>'multiple' | 'tags'</code></td><td></td><td>Multiple selection mode</td></tr>
                    <tr><td><code>disabled</code></td><td><code>boolean</code></td><td></td><td>Disabled</td></tr>
                    <tr><td><code>size</code></td><td><code>'small' | 'middle' | 'large'</code></td><td></td><td>Size</td></tr>
                    <tr><td><code>onChange</code></td><td><code>(value: string | string[]) =&gt; void</code></td><td></td><td>Selection change callback</td></tr>
                  </tbody>
                </table>

                <div className={styles.liveDemo}>
                  <Space wrap>
                    <ComcdSelect
                      cdDmnId="JBC_CD"
                      placeholder="Select a job title code"
                      style={{ width: 200 }}
                      allowClear
                      value={comcdVal}
                      onChange={(v) => setComcdVal(v as string)}
                    />
                    <ComcdSelect
                      cdDmnId="GD_CD"
                      placeholder="Select a grade code"
                      style={{ width: 200 }}
                      allowClear
                    />
                    <ComcdSelect
                      cdDmnId="JBC_CD"
                      placeholder="Multiple selection"
                      mode="multiple"
                      style={{ width: 240 }}
                    />
                  </Space>
                  <div className={styles.resultBox}>Selected value: {comcdVal ?? '(none)'}</div>
                </div>

                <CodeSnippet code={comcdCode} />

                <Divider titlePlacement="left" style={{ marginTop: 20 }}>prefixOption — an empty leading option</Divider>
                <p className={styles.demoDesc}>
                  Use it when a dropdown needs a leading empty option such as "All" or "Select", as filters usually do.
                  Choosing it yields a value of <code>''</code> (an empty string).
                </p>
                <div className={styles.liveDemo}>
                  <Space wrap>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>prefixOption="All"</div>
                      <ComcdSelect
                        cdDmnId="JBC_CD"
                        prefixOption="All"
                        style={{ width: 160 }}
                        value={comcdPrefixVal}
                        onChange={(v) => setComcdPrefixVal(v as string)}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>prefixOption="Select"</div>
                      <ComcdSelect cdDmnId="GD_CD" prefixOption="Select" style={{ width: 160 }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>prefixOption="" (empty)</div>
                      <ComcdSelect cdDmnId="JBC_CD" prefixOption="" style={{ width: 160 }} />
                    </div>
                  </Space>
                  <div className={styles.resultBox}>Selected value: {comcdPrefixVal === '' ? '(empty string)' : (comcdPrefixVal ?? '(none)')}</div>
                </div>

                <CodeSnippet code={comcdPrefixCode} />

                <Divider titlePlacement="left" style={{ marginTop: 20 }}>filterFn — chained selects</Divider>
                <p className={styles.demoDesc}>
                  The <code>filterFn</code> prop filters the child select's options by the parent's value.
                  The demo below runs on <strong>static data</strong>; in production you would write
                  <code>{'ComcdSelect filterFn={(c) => c.bzLrgCzCd === parentVal}'}</code>.
                </p>

                {/* ── Visualizing the chained flow ── */}
                <div style={{
                  display: 'flex', alignItems: 'stretch', gap: 0,
                  border: '1px solid var(--border-color)', borderRadius: 8, overflow: 'hidden',
                  margin: '12px 0',
                }}>
                  {/* Step 1 — parent */}
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
                      <span style={{ fontSize: 13, fontWeight: 600 }}>Select a category</span>
                      <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>Parent</Tag>
                    </div>
                    <Select
                      options={CHAIN_PARENT_OPTIONS}
                      placeholder="Select a work type"
                      value={chainParentVal || undefined}
                      onChange={(v) => { setChainParentVal(v ?? ''); setChainChildVal(''); }}
                      allowClear
                      style={{ width: '100%' }}
                    />
                    {chainParentVal && (
                      <div style={{ marginTop: 8, fontSize: 12, color: '#1677ff' }}>
                        Selected: <strong>{CHAIN_PARENT_OPTIONS.find(o => o.value === chainParentVal)?.label}</strong>
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
                      {chainParentVal ? 'filterFn\napplied' : 'filterFn'}
                    </span>
                  </div>

                  {/* Step 2 — child */}
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
                      <span style={{ fontSize: 13, fontWeight: 600 }}>Select a subcategory</span>
                      <Tag color="green" style={{ margin: 0, fontSize: 11 }}>Child</Tag>
                      {/* filtered-count badge */}
                      <Tag
                        color={chainParentVal ? 'blue' : 'default'}
                        style={{ margin: 0, fontSize: 11 }}
                      >
                        {chainChildOptions.length} / {CHAIN_CHILD_OPTIONS.length}
                      </Tag>
                    </div>
                    <Select
                      options={chainChildOptions}
                      placeholder={chainParentVal ? 'Select a subcategory' : 'Pick a category first'}
                      value={chainChildVal || undefined}
                      onChange={(v) => setChainChildVal(v ?? '')}
                      disabled={!chainParentVal}
                      allowClear
                      style={{ width: '100%' }}
                    />
                    {chainParentVal && (
                      <div style={{ marginTop: 8, fontSize: 12, color: '#52c41a' }}>
                        <strong>"{CHAIN_PARENT_OPTIONS.find(o => o.value === chainParentVal)?.label}"</strong>
                      </div>
                    )}
                    {!chainParentVal && (
                      <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-disabled, #bfbfbf)' }}>
                        Enabled once a category is selected
                      </div>
                    )}
                  </div>
                </div>

                {/* result summary */}
                <div className={styles.resultBox}>
                  {chainParentVal
                    ? `Category: "${CHAIN_PARENT_OPTIONS.find(o => o.value === chainParentVal)?.label}" → showing ${chainChildOptions.length} of ${CHAIN_CHILD_OPTIONS.length} subcategory options${chainChildVal ? ` → selected: "${chainChildOptions.find(o => o.value === chainChildVal)?.label}"` : ''}`
                    : 'Pick a category and the subcategories filter themselves'}
                </div>

                <CodeSnippet code={comcdChainCode} title="ComcdSelect filterFn chaining (real code)" />
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
                  A custom input that combines type-ahead autocomplete with a popup search modal behind the 🔍 button.
                  It supports single and multiple selection, static and async options, custom columns and a fully custom modal body.
                </p>

                <table className={styles.demoPropsTable}>
                  <thead>
                    <tr><th style={{ width: 180 }}>Prop</th><th>Type</th><th style={{ width: 80 }}>Default</th><th>Description</th></tr>
                  </thead>
                  <tbody>
                    <tr><td><code>value</code></td><td><code>SearchSelectValue | SearchSelectValue[] | null</code></td><td>—</td><td>The selected value (controlled)</td></tr>
                    <tr><td><code>onChange</code></td><td><code>(val: SearchSelectValue | SearchSelectValue[] | null) =&gt; void</code></td><td>—</td><td>Selection change callback</td></tr>
                    <tr><td><code>options</code></td><td><code>SearchSelectOption[]</code></td><td>—</td><td>Static option list <code>&#123; label, value, ...extras &#125;</code></td></tr>
                    <tr><td><code>fetchOptions</code></td><td><code>(keyword: string) =&gt; Promise&lt;SearchSelectOption[]&gt;</code></td><td>—</td><td>Async option loader (called when the modal opens and while typing in the autocomplete)</td></tr>
                    <tr><td><code>multiple</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Multiple selection mode (checkboxes)</td></tr>
                    <tr><td><code>placeholder</code></td><td><code>string</code></td><td><code>"Type to search"</code></td><td>Autocomplete placeholder</td></tr>
                    <tr><td><code>disabled</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Disables the whole control</td></tr>
                    <tr><td><code>modalTitle</code></td><td><code>string</code></td><td><code>"Search"</code></td><td>Title of the popup modal</td></tr>
                    <tr><td><code>modalWidth</code></td><td><code>number</code></td><td><code>560</code></td><td>Width of the popup modal (px)</td></tr>
                    <tr><td><code>columns</code></td><td><code>ColumnsType&lt;SearchSelectOption&gt;</code></td><td>—</td><td>[Level 1] Replaces the default [name, code] columns</td></tr>
                    <tr><td><code>showModalSearch</code></td><td><code>boolean</code></td><td><code>true</code></td><td>[Level 2] Whether the search box inside the modal is shown</td></tr>
                    <tr><td><code>modalSearchFields</code></td><td><code>(keyof SearchSelectOption)[]</code></td><td><code>['label','value']</code></td><td>[Level 2] Fields the search runs against</td></tr>
                    <tr><td><code>renderModalContent</code></td><td><code>(ctx: ModalContentContext) =&gt; ReactNode</code></td><td>—</td><td>[Level 3] Fully custom modal body (replaces the default table)</td></tr>
                    <tr><td><code>codeWidth</code></td><td><code>number</code></td><td><code>110</code></td><td>Width of the code input on the right (px)</td></tr>
                  </tbody>
                </table>

                {/* single-selection demo */}
                <Divider titlePlacement="left" style={{ marginTop: 16 }}>Single selection</Divider>
                <div className={styles.liveDemo}>
                  <SearchSelectField
                    value={ssfSingle}
                    onChange={(v) => setSsfSingle(v as SearchSelectValue | null)}
                    options={sampleUsers}
                    placeholder="Search users"
                    modalTitle="Select a user"
                    style={{ maxWidth: 400 }}
                  />
                  <div className={styles.resultBox}>
                    Selected: {ssfSingle ? `${ssfSingle.label} (${ssfSingle.value})` : '(none)'}
                  </div>
                </div>
                <CodeSnippet code={ssfSingleCode} />

                {/* multiple-selection demo */}
                <Divider titlePlacement="left" style={{ marginTop: 16 }}>Multiple selection</Divider>
                <div className={styles.liveDemo}>
                  <SearchSelectField
                    value={ssfMulti}
                    onChange={(v) => setSsfMulti(v as SearchSelectValue[] | null)}
                    options={sampleUsers}
                    multiple={true}
                    placeholder="Search members"
                    modalTitle="Select members"
                    style={{ maxWidth: 500 }}
                  />
                  <div className={styles.resultBox}>
                    Selected: {ssfMulti?.length
                      ? ssfMulti.map((v) => `${v.label}(${v.value})`).join(', ')
                      : '(none)'}
                  </div>
                </div>
                <CodeSnippet code={ssfMultiCode} />
              </Card>
            ),
          },

          /* ── Ant Design basics ── */
          {
            key: 'antd',
            label: 'Ant Design basics',
            children: (
              <Card size="small">
                <Divider titlePlacement="left">Input variants</Divider>
                <Row gutter={[16, 12]}>
                  <Col span={8}><Input placeholder="Basic input" /></Col>
                  <Col span={8}><form onSubmit={(e) => e.preventDefault()}><Password placeholder="Password" /></form></Col>
                  <Col span={8}><Search placeholder="Type to search" onSearch={(v) => console.log(v)} /></Col>
                  <Col span={8}><InputNumber style={{ width: '100%' }} placeholder="Enter a number" min={0} max={100} /></Col>
                  <Col span={8}><AutoComplete style={{ width: '100%' }} placeholder="Autocomplete" options={[{ value: 'John Doe' }, { value: 'Michael Chen' }]} /></Col>
                  <Col span={24}><TextArea rows={3} placeholder="Multi-line text" /></Col>
                </Row>

                <Divider titlePlacement="left">Select</Divider>
                <Row gutter={[16, 12]}>
                  <Col span={8}>
                    <Select style={{ width: '100%' }} placeholder="Single selection" options={[{ value: '1', label: 'Option 1' }, { value: '2', label: 'Option 2' }, { value: '3', label: 'Option 3' }]} />
                  </Col>
                  <Col span={8}>
                    <Select mode="multiple" style={{ width: '100%' }} placeholder="Multiple selection" options={[{ value: 'apple', label: 'Apple' }, { value: 'banana', label: 'Banana' }, { value: 'cherry', label: 'Cherry' }]} />
                  </Col>
                  <Col span={8}>
                    <Select showSearch style={{ width: '100%' }} placeholder="Searchable select" options={[{ value: 'react', label: 'React' }, { value: 'vue', label: 'Vue' }, { value: 'angular', label: 'Angular' }]} />
                  </Col>
                </Row>

                <Divider titlePlacement="left">DatePicker</Divider>
                <Space wrap>
                  <DatePicker placeholder="Date" />
                  <DatePicker.RangePicker placeholder={['Start', 'End']} />
                  <DatePicker picker="month" placeholder="Month" />
                </Space>

                <Divider titlePlacement="left">Checkbox / Radio</Divider>
                <Card size="small">
                  <Space orientation="vertical" style={{ width: '100%' }}>
                    <Checkbox.Group
                      value={checkboxVals}
                      onChange={(v) => setCheckboxVals(v as string[])}
                      options={[{ label: 'Apple', value: 'apple' }, { label: 'Banana', value: 'banana' }, { label: 'Cherry', value: 'cherry' }]}
                    />
                    <Radio.Group value={radioVal} onChange={(e) => setRadioVal(e.target.value)}>
                      <Radio value="a">Option A</Radio>
                      <Radio value="b">Option B</Radio>
                      <Radio value="c">Option C</Radio>
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
                    <span>Value: {sliderVal}</span>
                  </div>
                </Space>

                <Divider titlePlacement="left">TreeSelect / Cascader</Divider>
                <Row gutter={16}>
                  <Col span={12}>
                    <TreeSelect style={{ width: '100%' }} treeData={treeData} placeholder="Select a department (TreeSelect)" allowClear />
                  </Col>
                  <Col span={12}>
                    <Cascader style={{ width: '100%' }} options={cascaderOptions} placeholder="Select a region (Cascader)" />
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
