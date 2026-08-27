import { Form, Input, Modal, Typography } from 'antd';
import { useApiMutation } from '@/hooks/useApiMutation';
import { changePwd } from '@/api/sys/usr';

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
      title="비밀번호 변경 필요"
      open={open}
      onOk={handleOk}
      okText="변경"
      footer={(_, { OkBtn }) => <OkBtn />}
      closable={false}
      mask={{ closable: false }}
      confirmLoading={mutation.isPending}
      destroyOnHidden
      width={420}
    >
      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        최초 로그인입니다. 새 비밀번호로 변경 후 이용하실 수 있습니다.
      </Text>
      <Form form={form} layout="vertical">
        <Form.Item
          label="새 비밀번호"
          name="chgPasswd"
          rules={[
            { required: true, message: '새 비밀번호를 입력하세요.' },
            {
              pattern: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[$@!%*#?&])[A-Za-z\d$@!%*#?&]{8,20}$/,
              message: '영문+숫자+특수문자($@!%*#?&) 조합 8~20자',
            },
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
        <Form.Item
          label="비밀번호 확인"
          name="chgPasswdChk"
          dependencies={['chgPasswd']}
          rules={[
            { required: true, message: '비밀번호 확인을 입력하세요.' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('chgPasswd') === value) return Promise.resolve();
                return Promise.reject(new Error('비밀번호가 일치하지 않습니다.'));
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
