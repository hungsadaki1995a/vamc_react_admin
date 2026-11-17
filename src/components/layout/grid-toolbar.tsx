import { useTotalCountLabel } from '@/hooks/useTotalCountLabel';
import './GridToolbar.css';

interface GridToolbarProps {
  /**
   * 그리드 영역 제목. 좌우 분할처럼 어느 그리드인지 밝혀야 할 때만 쓴다.
   * 제목 줄을 따로 얹지 말고 여기에 넣는다 — 별도 div 를 올리면 좌우 툴바 높이가 어긋난다.
   */
  title?: React.ReactNode;
  /** Total count display (e.g. "전체 102건") */
  totalCount?: number;
  /**
   * 건수 앞 라벨을 직접 지정할 때만 넘긴다 (기본값은 공통 라벨 `COMPONENT.VIEW.TEXT_gridTotal`).
   * 넘기면 해당 문구 + 숫자만 그린다.
   */
  countLabel?: string;
  /** Left additional elements */
  left?: React.ReactNode;
  /** Right action buttons */
  actions?: React.ReactNode;
}

export default function GridToolbar({ title, totalCount, countLabel, left, actions }: GridToolbarProps) {
  const { template } = useTotalCountLabel();

  // 숫자만 굵게 그려야 해서 완성 문자열이 아니라 템플릿을 {0} 기준으로 자른다.
  // "전체 {0}건" → ['전체 ', '건'] / "Total {0} items" → ['Total ', ' items']
  const [before, after = ''] = template.split('{0}');

  return (
    <div className="ds-grid-toolbar">
      <div className="ds-grid-toolbar-left">
        {title !== undefined && <span className="ds-grid-toolbar-title">{title}</span>}
        {totalCount !== undefined && (
          <span className="ds-grid-toolbar-count">
            {countLabel !== undefined ? (
              <>{countLabel} <strong>{totalCount.toLocaleString()}</strong></>
            ) : (
              <>{before}<strong>{totalCount.toLocaleString()}</strong>{after}</>
            )}
          </span>
        )}
        {left}
      </div>
      <div className="ds-grid-toolbar-right">
        {actions}
      </div>
    </div>
  );
}
