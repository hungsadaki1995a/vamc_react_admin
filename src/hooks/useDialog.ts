/**
 * @deprecated useNotify().dialog 를 사용하세요.
 * @example
 * const { dialog } = useNotify();
 * dialog.confirm({ content: '삭제하시겠습니까?', onOk: handleDelete });
 */
export { useNotify as useDialog } from '@/hooks/useNotify';
