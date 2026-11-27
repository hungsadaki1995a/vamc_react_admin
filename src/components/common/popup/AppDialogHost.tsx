import { useState } from 'react';
import Popup from '@/components/common/popup/Popup';
import { useDialogStore, type DialogEntry } from '@/stores/dialog-store';

function DialogPopup({ item }: { item: DialogEntry }) {
  const closeDialog = useDialogStore((s) => s.close);
  const [loading, setLoading] = useState(false);
  const showCancel = item.okCancel ?? item.type === 'confirm';

  const handleCancel = () => {
    if (loading) return;
    closeDialog(item.id);
    item.onCancel?.();
  };

  const handleConfirm = async () => {
    if (!item.onOk) {
      closeDialog(item.id);
      return;
    }

    const result = item.onOk();
    if (result && typeof (result as Promise<unknown>).then === 'function') {
      setLoading(true);
      try {
        await result;
        closeDialog(item.id);
      } finally {
        setLoading(false);
      }
    } else {
      closeDialog(item.id);
    }
  };

  return (
    <Popup
      open
      status={item.type}
      icon={item.icon}
      title={item.title ?? ''}
      width={item.width}
      confirmText={item.okText}
      cancelText={item.cancelText}
      hideCancel={!showCancel}
      confirmLoading={loading}
      confirmDisabled={item.okDisabled}
      mask={item.maskClosable !== undefined ? { blur: false, closable: item.maskClosable } : undefined}
      keyboard={!loading}
      onCancel={handleCancel}
      onConfirm={() => void handleConfirm()}
    >
      {item.content}
    </Popup>
  );
}

/** Global host rendering imperative `useNotify().dialog` popups using Figma Popup layout (4042:25841). */
export default function AppDialogHost() {
  const dialogs = useDialogStore((s) => s.dialogs);

  return (
    <>
      {dialogs.map((item) => (
        <DialogPopup key={item.id} item={item} />
      ))}
    </>
  );
}
