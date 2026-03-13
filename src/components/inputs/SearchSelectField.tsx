import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { AutoComplete, Input, Button, Modal, Table, Tag, Space, Spin } from 'antd';
import { SearchOutlined, CloseCircleFilled } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { TableRowSelection } from 'antd/es/table/interface';
import './SearchSelectField.css';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SearchSelectOption {
  label: string;  // displayed name
  value: string;  // code
  [key: string]: unknown;
}

export interface SearchSelectValue {
  label: string;
  value: string;
}

/** Context passed to renderModalContent — provides full control over selection */
export interface ModalContentContext {
  /** Loaded option list (filtered by modalSearchFields if showModalSearch=true) */
  options: SearchSelectOption[];
  loading: boolean;
  selectedKeys: React.Key[];
  onSelect: (keys: React.Key[]) => void;
  searchText: string;
  onSearch: (text: string) => void;
}

export interface SearchSelectFieldProps {
  value?: SearchSelectValue | SearchSelectValue[] | null;
  onChange?: (val: SearchSelectValue | SearchSelectValue[] | null) => void;
  /** Static option list */
  options?: SearchSelectOption[];
  /** Async option loader — called on modal open and autocomplete typing */
  fetchOptions?: (keyword: string) => Promise<SearchSelectOption[]>;
  /** true → multiple checkbox, false(default) → single radio */
  multiple?: boolean;
  placeholder?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  /** Modal title (default: '검색') */
  modalTitle?: string;
  /** Modal width (default: 560) */
  modalWidth?: number;
  /**
   * Level 1 — fully replace the default [명칭, 코드] columns.
   * When omitted, defaults to [명칭, 코드].
   */
  columns?: ColumnsType<SearchSelectOption>;
  /**
   * Level 2 — show/hide the built-in search bar inside the modal (default: true).
   * Set false when renderModalContent handles its own search UI.
   */
  showModalSearch?: boolean;
  /**
   * Level 2 — which option fields to search against (default: ['label', 'value']).
   * Only applies when showModalSearch=true and renderModalContent is NOT provided.
   */
  modalSearchFields?: (keyof SearchSelectOption)[];
  /**
   * Level 3 — fully custom modal body.
   * When provided, the default Table is replaced entirely.
   * Use ctx.onSelect to update selection and ctx.selectedKeys to read it.
   */
  renderModalContent?: (ctx: ModalContentContext) => React.ReactNode;
  /** Width of the code input on the right (default: 110) */
  codeWidth?: number;
  /** Fixed width of the name input on the left (default: 150). Code area fills remaining space. */
  nameWidth?: number;
}

// ── Default columns ────────────────────────────────────────────────────────────

const DEFAULT_COLUMNS: ColumnsType<SearchSelectOption> = [
  { title: '명칭', dataIndex: 'label', key: 'label', ellipsis: true },
  { title: '코드', dataIndex: 'value', key: 'value', width: 120 },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function SearchSelectField({
  value,
  onChange,
  options: staticOptions,
  fetchOptions,
  multiple = false,
  placeholder = '검색어 입력',
  disabled = false,
  style,
  modalTitle = '검색',
  modalWidth = 560,
  columns,
  showModalSearch = true,
  modalSearchFields = ['label', 'value'],
  renderModalContent,
  codeWidth: _codeWidth = 110,
  nameWidth = 120,
}: SearchSelectFieldProps) {
  // Normalize incoming value to array
  const selectedItems: SearchSelectValue[] = value
    ? (Array.isArray(value) ? value : [value])
    : [];

  // ── Local state ────────────────────────────────────────────────────────────

  const [acText, setAcText] = useState('');
  const [acOptions, setAcOptions] = useState<SearchSelectOption[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSearch, setModalSearch] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [allOptions, setAllOptions] = useState<SearchSelectOption[]>(staticOptions ?? []);
  const [pendingKeys, setPendingKeys] = useState<React.Key[]>([]);
  const acSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync acText with external value (single mode)
  useEffect(() => {
    if (!multiple) {
      setAcText(selectedItems[0]?.label ?? '');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, multiple]);

  // Sync allOptions when staticOptions prop changes
  useEffect(() => {
    if (staticOptions) setAllOptions(staticOptions);
  }, [staticOptions]);

  // ── Data loading ───────────────────────────────────────────────────────────

  const loadOptions = useCallback(async (keyword = '') => {
    if (!fetchOptions) return;
    setModalLoading(true);
    try {
      const data = await fetchOptions(keyword);
      setAllOptions(data);
    } finally {
      setModalLoading(false);
    }
  }, [fetchOptions]);

  // ── Modal handlers ─────────────────────────────────────────────────────────

  const openModal = useCallback(async () => {
    setModalSearch('');
    setPendingKeys(selectedItems.map((i) => i.value));
    setModalOpen(true);
    await loadOptions('');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadOptions, JSON.stringify(selectedItems)]);

  const handleModalOk = useCallback(() => {
    const chosen = allOptions.filter((o) => pendingKeys.includes(o.value));
    if (multiple) {
      onChange?.(chosen.map((o) => ({ label: o.label, value: o.value })));
    } else {
      onChange?.(chosen[0] ? { label: chosen[0].label, value: chosen[0].value } : null);
    }
    setModalOpen(false);
  }, [allOptions, pendingKeys, multiple, onChange]);

  const handlePendingSelect = useCallback((keys: React.Key[]) => {
    setPendingKeys(multiple ? keys : keys.slice(-1));
  }, [multiple]);

  const handleModalRowClick = useCallback((record: SearchSelectOption) => {
    setPendingKeys((prev) =>
      multiple
        ? prev.includes(record.value)
          ? prev.filter((k) => k !== record.value)
          : [...prev, record.value]
        : [record.value],
    );
  }, [multiple]);

  // Filtered options for the built-in search bar — memoized to avoid re-filtering on every render
  const modalFilteredOptions = useMemo(
    () =>
      modalSearch
        ? allOptions.filter((o) =>
            modalSearchFields.some((field) =>
              String(o[field] ?? '').toLowerCase().includes(modalSearch.toLowerCase()),
            ),
          )
        : allOptions,
    [allOptions, modalSearch, modalSearchFields],
  );

  // ── Autocomplete handlers (single mode) ───────────────────────────────────

  const handleAcSearch = useCallback((text: string) => {
    setAcText(text);
    if (!text) {
      onChange?.(null);
      setAcOptions([]);
      return;
    }
    // Static options: synchronous filter (instant)
    if (!fetchOptions) {
      setAcOptions(
        (staticOptions ?? []).filter((o) =>
          o.label.toLowerCase().includes(text.toLowerCase()) ||
          o.value.toLowerCase().includes(text.toLowerCase()),
        ),
      );
      return;
    }
    // API call: debounce 300ms to avoid excessive requests per keystroke
    if (acSearchTimerRef.current) clearTimeout(acSearchTimerRef.current);
    acSearchTimerRef.current = setTimeout(async () => {
      const data = await fetchOptions(text);
      setAcOptions(data);
    }, 300);
  }, [fetchOptions, staticOptions, onChange]);

  const handleAcSelect = useCallback((_val: string, option: { label: string; value: string }) => {
    setAcText(option.label as string);
    onChange?.({ label: option.label as string, value: option.value });
    setAcOptions([]);
  }, [onChange]);

  const handleAcClear = useCallback(() => {
    setAcText('');
    onChange?.(null);
    setAcOptions([]);
  }, [onChange]);

  // ── Tag removal (multiple mode) ────────────────────────────────────────────

  const removeItem = useCallback((val: string) => {
    const next = selectedItems.filter((i) => i.value !== val);
    onChange?.(next.length ? next : []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(selectedItems), onChange]);

  // ── Modal table row selection ──────────────────────────────────────────────

  const rowSelection: TableRowSelection<SearchSelectOption> = {
    type: 'checkbox',
    selectedRowKeys: pendingKeys,
    onChange: (keys) => setPendingKeys(multiple ? keys : keys.slice(-1)),
  };

  // ── ModalContentContext for renderModalContent ─────────────────────────────

  const modalContentCtx: ModalContentContext = {
    options: modalFilteredOptions,
    loading: modalLoading,
    selectedKeys: pendingKeys,
    onSelect: handlePendingSelect,
    searchText: modalSearch,
    onSearch: setModalSearch,
  };

  // ── Derived display ────────────────────────────────────────────────────────

  const codeDisplay = selectedItems.map((i) => i.value).join(', ');
  const resolvedColumns = columns ?? DEFAULT_COLUMNS;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    // Single root div — avoids Fragment children being treated as a keyless list
    // by parent components (e.g. Ant Design Form.Item) that iterate over children.
    // Modal renders into document.body via Ant Design portal, so nesting it here
    // has no effect on layout.
    <div className="ssf-wrap" style={style}>
      {/* Left: name field
          - multiple mode OR single mode with value → tags area (no editable input, compact)
          - single mode without value → autocomplete for inline searching */}
      {multiple || selectedItems.length > 0 ? (
        <div
          className={`ssf-tags-area${disabled ? ' ssf-disabled' : ''}`}
          style={{ flex: `0 0 ${nameWidth}px` }}
        >
          {selectedItems.map((item) => (
            <Tag
              key={item.value}
              closable={!disabled}
              onClose={() => removeItem(item.value)}
              closeIcon={<CloseCircleFilled style={{ fontSize: 10 }} />}
              className="ssf-tag-item"
            >
              {item.label}
            </Tag>
          ))}
          {selectedItems.length === 0 && (
            <span className="ssf-placeholder">{placeholder}</span>
          )}
        </div>
      ) : (
        <AutoComplete
          value={acText}
          options={acOptions.map((o) => ({ label: o.label, value: o.value }))}
          onSearch={handleAcSearch}
          onSelect={handleAcSelect}
          onClear={handleAcClear}
          disabled={disabled}
          className="ssf-ac"
          allowClear={!!acText}
          style={{ flex: `0 0 ${nameWidth}px` }}
          getPopupContainer={() => document.body}
          placeholder={placeholder}
        />
      )}

      {/* Middle: search button */}
      <Button
        icon={<SearchOutlined />}
        onClick={openModal}
        disabled={disabled}
        className="ssf-search-btn"
        tabIndex={-1}
      />

      {/* Right: code (read-only) — fills remaining space, resizes with container */}
      <Input
        value={codeDisplay}
        readOnly
        className="ssf-code-input"
        placeholder="코드"
        tabIndex={-1}
        style={{ minWidth: 50 }}
      />

      {/* ── Search Modal (portal → document.body) ─────────────────────── */}
      <Modal
        title={modalTitle}
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={() => setModalOpen(false)}
        okText="확인"
        cancelText="취소"
        width={modalWidth}
        destroyOnHidden
        styles={{ body: { paddingTop: 12 } }}
      >
        {/* Built-in search bar (Level 2: showModalSearch) */}
        {showModalSearch && !renderModalContent && (
          <Space style={{ marginBottom: 10, width: '100%' }}>
            <Input
              prefix={<SearchOutlined />}
              value={modalSearch}
              onChange={(e) => setModalSearch(e.target.value)}
              placeholder="검색어 입력"
              allowClear
              style={{ width: 300 }}
            />
          </Space>
        )}

        {/* Level 3: fully custom body */}
        {renderModalContent ? (
          renderModalContent(modalContentCtx)
        ) : (
          /* Level 1: default Table with configurable columns */
          <Spin spinning={modalLoading}>
            <Table<SearchSelectOption>
              dataSource={modalFilteredOptions}
              columns={resolvedColumns}
              rowKey="value"
              rowSelection={rowSelection}
              size="small"
              pagination={{ pageSize: 10, showSizeChanger: false, showTotal: (t) => `총 ${t}건` }}
              onRow={(record) => ({
                onClick: () => handleModalRowClick(record),
                style: { cursor: 'pointer' },
              })}
              scroll={{ y: 280 }}
            />
          </Spin>
        )}
      </Modal>
    </div>
  );
}
