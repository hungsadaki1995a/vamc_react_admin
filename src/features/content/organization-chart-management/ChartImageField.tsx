import { useRef, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import TextInput from '@/components/inputs/TextInput';
import { SysButton } from '@/components/common/sys-ui/SysListUi';
import styles from './organization-chart-management.module.scss';

// One "Chart Image" row: file name, [Preview] (new window, disabled without a file) and [Upload File];
// a file can also be dropped on the row. Format / size are checked before the upload (E03).

const ACCEPT = '.png,.jpg,.jpeg,image/png,image/jpeg';

interface ChartImageFieldProps {
  /** Original name of the registered / uploaded file. */
  fileName?: string;
  hasFile: boolean;
  disabled: boolean;
  uploading: boolean;
  previewing: boolean;
  ariaLabel: string;
  onFile: (file: File) => void;
  onPreview: () => void;
}

export default function ChartImageField({
  fileName,
  hasFile,
  disabled,
  uploading,
  previewing,
  ariaLabel,
  onFile,
  onPreview,
}: ChartImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const pick = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) onFile(file);
  };

  const drop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    if (disabled) return;
    const file = event.dataTransfer.files?.[0];
    if (file) onFile(file);
  };

  return (
    <div
      className={dragging ? `${styles.imageRow} ${styles.imageRowDragging}` : styles.imageRow}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={drop}
    >
      <TextInput
        className={styles.fileName}
        readOnly
        aria-label={ariaLabel}
        value={fileName ?? ''}
        placeholder="Please attach a file."
      />
      <SysButton disabled={!hasFile} loading={previewing} onClick={onPreview}>
        Preview
      </SysButton>
      {!disabled && (
        <SysButton loading={uploading} onClick={() => inputRef.current?.click()}>
          Upload File
        </SysButton>
      )}
      <input ref={inputRef} type="file" accept={ACCEPT} hidden onChange={pick} />
    </div>
  );
}
