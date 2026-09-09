import { useCallback, useMemo } from 'react';
import { App } from 'antd';
import type { ModalFuncProps } from 'antd';
import { useLabelStore } from '@/stores/labelStore';

// ── Notify i18n config ────────────────────────────────────────────────────────

type NotifyType = 'success' | 'error' | 'warning' | 'info';

const NOTIFY_CONFIG: Record<NotifyType, { titleKey: string; titleFallback: string }> = {
  success: { titleKey: 'MESSAGE.SCRIPT.TEXT_success', titleFallback: 'success' },
  error:   { titleKey: 'MESSAGE.SCRIPT.TEXT_error',   titleFallback: 'error' },
  warning: { titleKey: 'MESSAGE.SCRIPT.TEXT_warning', titleFallback: 'warning' },
  info:    { titleKey: 'MESSAGE.SCRIPT.TEXT_info',    titleFallback: 'info' },
};

type NotifyOptions = Parameters<ReturnType<typeof App.useApp>['notification']['success']>[0];
/** 문자열 → description 자동 매핑. 객체 → 그대로 전달. */
type NotifyArg = string | NotifyOptions;

// ── Dialog i18n config ────────────────────────────────────────────────────────

type DialogType = 'confirm' | 'info' | 'warning' | 'error';

const DIALOG_CONFIG: Record<DialogType, {
  titleKey: string;
  titleFallback: string;
  danger: boolean;
}> = {
  confirm: { titleKey: 'MESSAGE.SCRIPT.TEXT_confirm', titleFallback: 'confirm', danger: false },
  info:    { titleKey: 'MESSAGE.SCRIPT.TEXT_info',    titleFallback: 'info', danger: false },
  warning: { titleKey: 'MESSAGE.SCRIPT.TEXT_warning', titleFallback: 'warning', danger: true  },
  error:   { titleKey: 'MESSAGE.SCRIPT.TEXT_error',   titleFallback: 'error', danger: true  },
};

// 다이얼로그 확인/취소 버튼 — 공용 컴포넌트 라벨을 그대로 쓴다.
// 종전 MESSAGE.SCRIPT.BTN_* 는 DB 에 등록된 적이 없어, 어떤 언어에서도
// 아래 'OK'/'CANCEL' 폴백이 그대로 보였다.
const OK_KEY     = 'COMPONENT.VIEW.BTN_ok';
const CANCEL_KEY = 'COMPONENT.VIEW.BTN_cancel';

function withFallback(value: string, key: string, fallback: string): string {
  return value === key ? fallback : value;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Unified notification hook — wraps antd message / notification / modal in one place.
 *
 * ```
 * const { toast, notify, dialog } = useNotify();
 *
 * // Toast (auto-dismiss)
 * toast.success('저장됐습니다');
 * toast.error('오류가 발생했습니다');
 *
 * // Notification (persistent panel) — 문자열이면 description으로 자동 매핑
 * notify.success('작업이 완료됐습니다.');                        // title: i18n '성공'
 * notify.error({ title: '오류', description: '상세 내용' });   // 객체 그대로 (message도 허용, title로 자동 매핑)
 *
 * // Dialog (modal) — i18n defaults: title / okText / cancelText / okButtonProps.danger
 * dialog.confirm({ content: '저장하시겠습니까?', onOk: handleSave });
 * dialog.warning({ title: '데이터 삭제', content: '복구할 수 없습니다.', okText: '삭제', onOk: handleDelete });
 * dialog.error({ content: '서버 오류가 발생했습니다.' });
 * ```
 *
 * Notify label keys (DB 등록 시 자동 다국어):
 *   COMMON.NOTIFY.SUCCESS.TITLE / ERROR.TITLE / WARNING.TITLE / INFO.TITLE
 *
 * Dialog label keys (DB 등록 시 자동 다국어):
 *   COMMON.DIALOG.CONFIRM.TITLE / INFO.TITLE / WARNING.TITLE / ERROR.TITLE
 *   COMMON.DIALOG.OK_TEXT / CANCEL_TEXT
 *
 * Dialog type defaults:
 *   confirm  — danger: false
 *   info     — danger: false
 *   warning  — danger: true
 *   error    — danger: true
 */
export function useNotify() {
  const { message, notification, modal } = App.useApp();
  const labelsVersion = useLabelStore((s) => s.labelsVersion);
  const t = useLabelStore((s) => s.t);

  // ── toast: antd message API (auto-dismiss toast) ──────────────────────────
  const toast = useMemo(() => message, [message]);

  // ── notify: antd notification API — 문자열이면 description으로 자동 매핑 ──
  const openNotify = useCallback(
    (type: NotifyType, arg: NotifyArg) => {
      const cfg = NOTIFY_CONFIG[type];
      const defaultTitle = withFallback(t(cfg.titleKey), cfg.titleKey, cfg.titleFallback);
      if (typeof arg === 'string') {
        notification[type]({ title: defaultTitle, description: arg });
      } else {
        // Remap deprecated `message` field → `title` for antd v6 compatibility
        const { message: msgField, title, ...rest } = arg as NotifyOptions & { message?: string };
        notification[type]({ title: title ?? msgField, ...rest });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [notification, labelsVersion],
  );

  const notify = useMemo(() => ({
    success: (arg: NotifyArg) => openNotify('success', arg),
    error:   (arg: NotifyArg) => openNotify('error',   arg),
    warning: (arg: NotifyArg) => openNotify('warning', arg),
    info:    (arg: NotifyArg) => openNotify('info',    arg),
  }), [openNotify]);

  // ── dialog: modal with i18n defaults ─────────────────────────────────────
  const openDialog = useCallback(
    (type: DialogType, { okButtonProps: callerOkBtnProps, ...rest }: ModalFuncProps) => {
      const cfg = DIALOG_CONFIG[type];
      const defaultTitle  = withFallback(t(cfg.titleKey), cfg.titleKey, cfg.titleFallback);
      const defaultOkText = withFallback(t(OK_KEY),       OK_KEY,       'OK');
      const defaultCancel = withFallback(t(CANCEL_KEY),   CANCEL_KEY,   'CANCEL');

      return modal[type]({
        title:      defaultTitle,
        okText:     defaultOkText,
        cancelText: defaultCancel,
        ...rest,
        okButtonProps: {
          ...(cfg.danger ? { danger: true } : {}),
          ...callerOkBtnProps,
        },
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [modal, labelsVersion],
  );

  const dialog = useMemo(() => ({
    confirm: (options: ModalFuncProps) => openDialog('confirm', options),
    info:    (options: ModalFuncProps) => openDialog('info',    options),
    warning: (options: ModalFuncProps) => openDialog('warning', options),
    error:   (options: ModalFuncProps) => openDialog('error',   options),
  }), [openDialog]);

  return { toast, notify, dialog };
}
