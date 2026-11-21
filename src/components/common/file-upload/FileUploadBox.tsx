import { useRef, useState, type DragEvent, type ReactNode } from 'react';
import ActionButton from '@/components/common/actions/ActionButton';
import styles from './file-upload-box.module.scss';

export type FileUploadBoxProps = {
  fileName?: string;
  title?: ReactNode;
  helperText?: ReactNode;
  uploadButtonText?: ReactNode;
  changeButtonText?: ReactNode;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  onFileSelect?: (files: File[]) => void;
  onClear?: () => void;
  className?: string;
};

/** File upload box matching Figma File Upload Box empty/selected states (33955:3389). */
export default function FileUploadBox({
  fileName,
  title = 'Select or drag a file to upload',
  helperText,
  uploadButtonText = 'Upload File',
  changeButtonText = 'Change File',
  accept,
  multiple = false,
  disabled = false,
  onFileSelect,
  onClear,
  className,
}: FileUploadBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const triggerSelect = (files: FileList | null) => {
    if (!files || files.length === 0 || disabled) return;
    onFileSelect?.(Array.from(files));
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    triggerSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) setDragging(true);
  };

  const isSelected = Boolean(fileName);

  return (
    <div
      className={[
        styles.root,
        dragging ? styles.dragging : '',
        disabled ? styles.disabled : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={() => setDragging(false)}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className={styles.hiddenInput}
        onChange={(e) => {
          triggerSelect(e.target.files);
          e.target.value = '';
        }}
      />

      <div className={styles.infoRow}>
        {isSelected && (
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className={styles.checkIcon}
            aria-hidden="true"
          >
            <circle cx="8" cy="8" r="7" fill="#45B675" />
            <path
              d="M5 8.1L7.1 10.2L11.2 6"
              stroke="#FFFFFF"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        <div className={styles.textGroup}>
          <span className={styles.title}>{isSelected ? fileName : title}</span>
          {helperText && <span className={styles.helper}>{helperText}</span>}
        </div>
      </div>

      <div className={styles.actions}>
        {isSelected && onClear && (
          <ActionButton
            size="small"
            intent="quaternary"
            appearance="outlined"
            disabled={disabled}
            onClick={onClear}
          >
            Remove
          </ActionButton>
        )}
        <ActionButton
          size="small"
          intent="quaternary"
          appearance="outlined"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          {isSelected ? changeButtonText : uploadButtonText}
        </ActionButton>
      </div>
    </div>
  );
}
