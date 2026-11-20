import { Form, Input, Modal, Typography } from 'antd';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { changePwd } from '@/api/system/user-password-api';

const { Text } = Typography;

interface Props {
  open: boolean;
  usrId: string;
  onSuccess: () => void;
}

interface FormValues {
  chgPasswd: string;
  chgPasswdChk: string;
}

export default function InitChangePwModal({ open, usrId, onSuccess }: Props) {
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
    <Modal
      title="Password Change Required"
      open={open}
      onOk={handleOk}
      okText="Change"
      footer={(_, { OkBtn }) => <OkBtn />}
      closable={false}
      mask={{ closable: false }}
      confirmLoading={mutation.isPending}
      destroyOnHidden
      width={420}
    >
      <Text type="secondary" className="block mb-4!">
        This is your first login. Please change your password to continue.
      </Text>
      <Form form={form} layout="vertical">
        <Form.Item
          label="New Password"
          name="chgPasswd"
          rules={[
            { required: true, message: 'Please enter a new password.' },
            {
              pattern: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[$@!%*#?&])[A-Za-z\d$@!%*#?&]{8,20}$/,
              message: '8–20 characters including letters, numbers, and special characters ($@!%*#?&).',
            },
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
        <Form.Item
          label="Confirm Password"
          name="chgPasswdChk"
          dependencies={['chgPasswd']}
          rules={[
            { required: true, message: 'Please confirm your new password.' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('chgPasswd') === value) return Promise.resolve();
                return Promise.reject(new Error('Passwords do not match.'));
              },
            }),
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
