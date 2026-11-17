import type { ButtonProps } from 'antd';
import ActionButton from '@/components/common/actions/action-button';
import { useLabelStore } from '@/stores/label-store';
import './excel-download-button.scss';

export function ExcelDownloadButton({ children, className, ...props }: ButtonProps) {
  const t = useLabelStore((s) => s.t);
  useLabelStore((s) => s.labelsVersion);

  const rootClassName = ['ds-excel-download-button', className].filter(Boolean).join(' ');
  const resolvedChildren = children ?? t('COMPONENT.VIEW.BTN_excelDownload', '엑셀 다운로드');

  return (
    <ActionButton
      {...props}
      action="excelDownload"
      className={rootClassName}
    >
      {resolvedChildren}
    </ActionButton>
  );
}
