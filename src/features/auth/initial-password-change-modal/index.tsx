import { useTranslation } from 'react-i18next';
import { Form, Typography } from 'antd';
import Popup from '@/components/common/popup/Popup';
import TextInput from '@/components/inputs/TextInput';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { changePwd } from '@/api/system/user-password-api';

const { Text } = Typography;

type Props = {
  open: boolean;
  usrId: string;
  onSuccess: () => void;
};

type FormValues = {
  chgPasswd: string;
  chgPasswdChk: string;
};

export default function InitChangePwModal({ open, usrId, onSuccess }: Props) {
  const { t } = useTranslation();
  const [form] = Form.useForm<FormValues>();

  const mutation = useApiMutation<void, { usrId: string; newPswd: string }>(
    ({ usrId: id, newPswd }) => changePwd(id, newPswd),
  );

  const handleOk = () => {
    form.validateFields().then(({ chgPasswd }) => {
      mutation.mutate({ usrId, newPswd: chgPasswd }, {
        onSuccess: () => {
          form.resetFields();
          onSuccess();
        },
      });
    });
  };

  return (
    <Popup
      title="Password Change Required"
      open={open}
      onConfirm={handleOk}
      confirmText="Change"
      confirmLoading={mutation.isPending}
      hideCancel
      closable={false}
      mask={{ closable: false }}
      width={420}
    >
      <Text type="secondary" className="block mb-4!">
        {t('auth.initialPassword.subtitle')}
      </Text>
      <Form form={form} layout="vertical">
        <Form.Item
          label="New Password"
          name="chgPasswd"
          rules={[
            { required: true, message: t('auth.initialPassword.newPasswordRequired') },
            {
              pattern: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[$@!%*#?&])[A-Za-z\d$@!%*#?&]{8,20}$/,
              message: t('auth.initialPassword.newPasswordRule'),
            },
          ]}
        >
          <TextInput variant="password" autoComplete="new-password" />
        </Form.Item>
        <Form.Item
          label="Confirm Password"
          name="chgPasswdChk"
          dependencies={['chgPasswd']}
          rules={[
            { required: true, message: t('auth.initialPassword.confirmPasswordRequired') },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('chgPasswd') === value) return Promise.resolve();
                return Promise.reject(new Error(t('auth.initialPassword.passwordMismatch')));
              },
            }),
          ]}
        >
          <TextInput variant="password" autoComplete="new-password" />
        </Form.Item>
      </Form>
    </Popup>
  );
}
