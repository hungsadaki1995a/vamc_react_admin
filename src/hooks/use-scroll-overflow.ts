import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Detects horizontal overflow on a scrollable container via ResizeObserver
 * and provides stable scroll handlers.
 *
 * Usage:
 *   const { ref, overflow, scrollLeft, scrollRight } = useScrollOverflow<HTMLDivElement>();
 *   ...
 *   <div className="wrap">
 *     {overflow && <button onClick={scrollLeft}><LeftOutlined /></button>}
 *     <div ref={ref} className="content">...</div>
 *     {overflow && <button onClick={scrollRight}><RightOutlined /></button>}
 *   </div>
 */
export function useScrollOverflow<T extends HTMLElement>(step = 120) {
  const ref = useRef<T>(null);
  const [overflow, setOverflow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setOverflow(el.scrollWidth > el.clientWidth);
    const ro = new ResizeObserver(check);
    ro.observe(el);
    if (el.parentElement) ro.observe(el.parentElement);
    check();
    return () => ro.disconnect();
  }, []);

  const scrollLeft  = useCallback(() => { if (ref.current) ref.current.scrollLeft -= step; }, [step]);
  const scrollRight = useCallback(() => { if (ref.current) ref.current.scrollLeft += step; }, [step]);

  return { ref, overflow, scrollLeft, scrollRight };
}
