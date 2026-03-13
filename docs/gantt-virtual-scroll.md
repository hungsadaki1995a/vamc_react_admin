# GanttView 가상 스크롤(Virtual Scroll) 검토

> 작성일: 2026-03-12
> 대상 파일: `src/components/gantt/GanttView.tsx`, `src/components/gantt/GanttGrid.tsx`

---

## 1. 현재 렌더링 구조

```
GanttView
├── GanttGrid (좌측 패널 — React DOM)
│   └── visibleTasks.map(task => <div style={{ height: rowHeight }}>...)
│       → 모든 행을 DOM 노드로 생성 (비가상화)
│
└── frappe-gantt (우측 패널 — SVG)
    └── new Gantt(container, visibleTasks, options)
        → 단일 SVG 하나로 전체 렌더링 (비가상화)
```

현재 적용된 성능 최적화:
- `passive: true` 스크롤 리스너 (GanttView.tsx line ~408)
- `will-change: transform` on `.gantt-timeline-panel` (GanttView.css)
- `collapsedGroups` 기반 행 필터링 → 실제 렌더 행 수 감소

---

## 2. 영역별 가상화 가능성

### 2-1. GanttGrid (왼쪽 DOM 패널) ✅ 가능

**이유**: 가상화에 필요한 모든 조건이 충족됨.

| 조건 | 현황 |
|------|------|
| 고정 행 높이 | `rowHeight = barHeight + rowPadding` (상수) |
| 스크롤 컨테이너 | `bodyRef` (overflow: auto, `gantt-grid-body`) |
| 전체 높이 계산 | `visibleTasks.length × rowHeight` |
| 행 절대 위치 | `index × rowHeight` |

**구현 방법**: `@tanstack/react-virtual` 적용

```typescript
// GanttGrid.tsx 수정 예시
import { useVirtualizer } from '@tanstack/react-virtual';

const virtualizer = useVirtualizer({
  count: tasks.length,
  getScrollElement: () => bodyRef.current,
  estimateSize: () => rowHeight,   // 고정 높이 → 완벽한 정확도
  overscan: 5,                      // 뷰포트 위아래 5행 여유 렌더
});

// JSX
<div className="gantt-grid-body" ref={bodyRef}>
  <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
    {virtualizer.getVirtualItems().map((vRow) => (
      <div
        key={vRow.key}
        data-index={vRow.index}
        style={{
          position: 'absolute',
          top: vRow.start,
          height: vRow.size,
          // ... 기존 grid row 스타일
        }}
      >
        {/* 기존 renderCell 로직 그대로 사용 */}
      </div>
    ))}
  </div>
</div>
```

**스크롤 동기화 호환성**: 기존 `bodyRef.scrollTop ↔ timeline.scrollTop` 동기화 로직 변경 없음.
가상화 후에도 스크롤 위치 값은 동일하므로 SVG 타임라인과 정확히 동기됨.

**hover/select 동기화 주의사항**:
- `hoveredTaskId`는 task ID 기반 → DOM 인덱스와 무관, 그대로 동작
- `selectedTaskId`도 동일
- hover overlay (SVG rect)의 `y` 좌표 계산은 `visibleTasks.findIndex(...)` 기반 → 이미 절대 인덱스 사용 중, 변경 불필요

---

### 2-2. frappe-gantt (오른쪽 SVG 패널) ❌ 사실상 불가

**이유**: frappe-gantt는 `new Gantt(container, tasks, options)` 호출로 단일 SVG를 생성함. 내부 구조:

```
<svg>
  <g class="grid">   ← 전체 행 배경 rect (N개) — 라이브러리 내부 생성
  <g class="bar">    ← 전체 바 요소 (N개)     — 라이브러리 내부 생성
  <g class="arrow">  ← 의존성 화살표          — 라이브러리 내부 생성
</svg>
```

**사후 DOM 조작 방식 (권장하지 않음)**:
- SVG 초기화 후 뷰포트 밖 요소에 `display: none` 적용하는 방법 고려 가능
- 그러나 `container.innerHTML = ''` 후 재초기화 시 모든 사후 조작이 초기화됨
- 스크롤마다 DOM 조작 → 레이아웃 스래싱(thrashing) 유발
- frappe-gantt 업데이트 시 즉시 깨질 위험성

**근본 해결 방법**: frappe-gantt 소스 포크 또는 교체 (하단 장기 로드맵 참조)

---

## 3. 성능 기준 및 권장 임계값

| 표시 행 수 | 현재 성능 | 권장 조치 |
|-----------|-----------|-----------|
| ~50행 | 정상 | 현재 유지 (passive 리스너 + will-change 적용 완료) |
| 50~200행 | 약간 느림 | GanttGrid 가상화 적용 |
| 200~500행 | 눈에 띄는 지연 | GanttGrid 가상화 + SVG element 사후 visibility 처리 |
| 500행+ | 실사용 불가 | frappe-gantt 포크 or 커스텀 Canvas 렌더러 교체 |

> **현재 프로젝트 상황**: 22개 태스크 + 접기/펼치기 기능으로 실표시 행은 최대 22행.
> 가상화 없이 현재 최적화 수준으로 충분함.

---

## 4. 단기 구현 계획 (GanttGrid 가상화, 필요 시)

### Step 1. 라이브러리 설치
```bash
npm install @tanstack/react-virtual
```

### Step 2. GanttGrid.tsx 수정
- `import { useVirtualizer } from '@tanstack/react-virtual'` 추가
- `gantt-grid-body` 내부를 `virtualizer.getVirtualItems()` 방식으로 교체
- 컨테이너에 `position: relative` + `height: virtualizer.getTotalSize()` 추가

### Step 3. 스크롤 동기화 검증
- `GanttView.tsx`의 `syncFromGrid` / `syncFromGantt` 동작 확인
- hover overlay Y 좌표 계산 (`visibleTasks.findIndex` 기반) 정상 동작 확인

### Step 4. overscan 튜닝
- 기본값 `overscan: 5` (뷰포트 위아래 5행)
- 드래그 중 행 이동 시 overscan 부족하면 `overscan: 10`으로 증가

**예상 공수**: 1~2일

---

## 5. 장기 로드맵 (500행+ 대용량 데이터)

### Option A: frappe-gantt 포크
- 저장소 포크 후 SVG 요소 lazy-render 구현
- SVG `<g class="bar">` 내 바 요소를 스크롤 위치 기반으로 추가/제거
- **예상 공수**: 2~3주
- **리스크**: frappe-gantt 업스트림 업데이트 반영 어려움

### Option B: 커스텀 Canvas/WebGL 렌더러
- frappe-gantt 제거, 간트 바를 Canvas로 직접 렌더링
- 수평(시간) + 수직(행) 양방향 가상화 완전 지원
- 의존성 화살표, 드래그 편집 등 기능 직접 구현 필요
- **예상 공수**: 4~6주
- **장점**: 완전한 제어권, 수천 행 지원

### Option C: 대안 라이브러리 검토
오픈소스 조건 만족하는 대용량 간트 라이브러리:
- `dhtmlxGantt` — 상업용 ❌
- `gantt-schedule-timeline-calendar` — MIT ✅ (Canvas 기반, 가상화 지원)
- `@bryntum/gantt` — 상업용 ❌
- 직접 구현 Canvas 렌더러 — 오픈소스 의존성 없음 ✅

---

## 6. 관련 파일

| 파일 | 역할 |
|------|------|
| `src/components/gantt/GanttView.tsx` | 메인 래퍼, 스크롤 동기화, frappe-gantt 초기화 |
| `src/components/gantt/GanttGrid.tsx` | 좌측 DOM 그리드 패널 (가상화 대상) |
| `src/components/gantt/GanttView.css` | `.gantt-timeline-panel { will-change: transform }` 적용됨 |
| `src/components/gantt/ganttTypes.ts` | `GanttTask` 인터페이스 |
| `src/components/gantt/criticalPath.ts` | 크리티컬 패스 계산 |
