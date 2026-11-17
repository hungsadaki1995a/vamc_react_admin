import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { Badge } from 'antd';
import { CloseOutlined, MinusOutlined } from '@ant-design/icons';
import { useComponentLabel } from '@/hooks/useComponentLabel';
import './DetailPanel.css';

interface DetailPanelTab {
  key: string;
  label: string;
  children: React.ReactNode;
  badge?: number;
}

interface DetailPanelProps {
  visible: boolean;
  title?: React.ReactNode;
  extra?: React.ReactNode;
  defaultHeight?: number;
  minHeight?: number;
  maxHeight?: number;
  onClose?: () => void;
  tabs?: DetailPanelTab[];
  children?: React.ReactNode;
}

export default function DetailPanel({
  visible,
  title,
  extra,
  defaultHeight = 300,
  minHeight = 150,
  maxHeight = 600,
  onClose,
  tabs,
  children,
}: DetailPanelProps) {
  // 어느 화면에서 그려지든 같은 문구여야 하므로 화면 라벨이 아니라 공용 컴포넌트 라벨을 쓴다
  const { tvt } = useComponentLabel();
  const [height, setHeight] = useState(defaultHeight);
  const [activeTab, setActiveTab] = useState(tabs?.[0]?.key ?? '');
  const [isDragging, setIsDragging] = useState(false);
  const startRef = useRef({ y: 0, height: 0 });

  // Derived: fall back to first tab if current activeTab is no longer in tabs
  const resolvedActiveTab = useMemo(
    () => (tabs && tabs.length > 0 && !tabs.find((t) => t.key === activeTab) ? tabs[0].key : activeTab),
    [tabs, activeTab],
  );

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      startRef.current = { y: e.clientY, height };
    },
    [height],
  );

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      const delta = startRef.current.y - e.clientY;
      let newH = startRef.current.height + delta;
      newH = Math.max(minHeight, Math.min(maxHeight, newH));
      setHeight(newH);
    };
    const handleMouseUp = () => setIsDragging(false);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, minHeight, maxHeight]);

  if (!visible) return null;

  const currentTabContent = tabs?.find((t) => t.key === resolvedActiveTab)?.children;

  return (
    <div
      className={`ds-detail-panel ${isDragging ? 'dragging' : ''}`}
      style={{ height }}
    >
      {/* Drag handle */}
      <div className="ds-detail-drag-handle" onMouseDown={handleDragStart}>
        <div className="ds-detail-drag-bar" />
      </div>

      {/* Header */}
      <div className="ds-detail-header">
        <div className="ds-detail-title">{title}</div>
        {extra && <div className="ds-detail-extra">{extra}</div>}
        <div className="ds-detail-header-actions">
          {onClose && (
            <>
              <button className="ds-detail-btn" onClick={() => setHeight(minHeight)} title={tvt('minimize', '최소화')}>
                <MinusOutlined />
              </button>
              <button className="ds-detail-btn" onClick={onClose} title={tvt('close', '닫기')}>
                <CloseOutlined />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      {tabs && tabs.length > 0 && (
        <div className="ds-detail-tabs">
          {tabs.map((tab) => (
            <div
              key={tab.key}
              className={`ds-detail-tab ${resolvedActiveTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <Badge count={tab.badge} size="small" style={{ marginLeft: 4 }} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="ds-detail-content">
        {tabs ? currentTabContent : children}
      </div>
    </div>
  );
}
