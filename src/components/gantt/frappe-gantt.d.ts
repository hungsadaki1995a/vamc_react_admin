declare module 'frappe-gantt' {
  interface FrappeTask {
    id: string;
    name: string;
    start: string;
    end: string;
    progress: number;
    dependencies?: string;
    custom_class?: string;
    color?: string;
    description?: string;
  }

  interface PopupContext {
    task: FrappeTask & { _start: Date; _end: Date; actual_duration: number; ignored_duration: number };
    chart: { options: { language: string } };
    set_title(title: string): void;
    set_subtitle(subtitle: string): void;
    set_details(details: string): void;
  }

  interface GanttOptions {
    arrow_curve?: number;
    bar_height?: number;
    bar_corner_radius?: number;
    column_width?: number | null;
    container_height?: number | string;
    date_format?: string;
    language?: string;
    lines?: 'both' | 'vertical' | 'horizontal' | 'none';
    move_dependencies?: boolean;
    padding?: number;
    popup?: (ctx: PopupContext) => void;
    popup_on?: 'click' | 'hover';
    readonly?: boolean;
    readonly_dates?: boolean;
    readonly_progress?: boolean;
    scroll_to?: string | Date;
    show_expected_progress?: boolean;
    today_button?: boolean;
    view_mode?: string;
    view_mode_select?: boolean;
    on_click?: (task: FrappeTask) => void;
    on_double_click?: (task: FrappeTask) => void;
    on_hover?: (task: FrappeTask, isMouseover: boolean) => void;
    on_date_change?: (task: FrappeTask, start: Date, end: Date) => void;
    on_date_click?: (date: Date) => void;
    on_progress_change?: (task: FrappeTask, progress: number) => void;
    on_view_change?: (mode: { name: string }) => void;
  }

  export default class Gantt {
    constructor(wrapper: string | HTMLElement | SVGElement, tasks: FrappeTask[], options?: GanttOptions);
    change_view_mode(mode?: string): void;
    refresh(tasks: FrappeTask[]): void;
  }
}
