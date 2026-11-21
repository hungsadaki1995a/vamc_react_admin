import { Input } from 'antd';
import type { TextAreaProps as AntTextAreaProps } from 'antd/es/input';
import styles from './text-area.module.scss';

export type TextAreaProps = AntTextAreaProps;

/** Multiline textarea matching Figma input_textarea (4042:25794). */
export default function TextArea({ readOnly, className, showCount, ...props }: TextAreaProps) {
  const rootClassName = [styles.root, readOnly ? styles.readonly : '', className]
    .filter(Boolean)
    .join(' ');

  return <Input.TextArea {...props} readOnly={readOnly} showCount={showCount} className={rootClassName} />;
}
