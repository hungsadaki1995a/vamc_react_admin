import { Form, Input, Modal } from 'antd';
import { useApiMutation } from '@/hooks/useApiMutation';
import { useNotify } from '@/hooks/useNotify';
import { useScreenLabel } from '@/hooks/useScreenLabel';
import { changePwd } from '@/api/sys/usr';

interface Props {
  open: boolean;
  usrId: string;
  usrNm: string;
  onClose: () => void;
}

interface PwChangeForm {
  chgPasswd: string;
  chgPasswdChk: string;
}

export default function CCO1010011P({ open, usrId, usrNm, onClose }: Props) {
  const { notify } = useNotify();
  const { tvt, tmi } = useScreenLabel('CCO1010011P');
  const [form] = Form.useForm<PwChangeForm>();

  const mutation = useApiMutation<void, { usrId: string; newPswd: string }>(
    ({ usrId: id, newPswd }) => changePwd(id, newPswd),
  );

  const handleOk = () => {
    form.validateFields().then(({ chgPasswd }) => {
      mutation.mutate({ usrId, newPswd: chgPasswd }, {
        onSuccess: () => {
          notify.success(tmi('I100008') || '처리 완료되었습니다.');
          form.resetFields();
          onClose();
        },
      });
    });
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={`${tvt('title', '패스워드 변경')} — ${usrNm}(${usrId})`}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={mutation.isPending}
      width={420}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        style={{ marginTop: 16 }}
      >
        <Form.Item
          label={tvt('chgPasswd', '새 비밀번호')}
          name="chgPasswd"
          rules={[
            { required: true, message: '새 비밀번호를 입력하세요.' },
            {
              pattern: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[$@!%*#?&])[A-Za-z\d$@!%*#?&]{8,20}$/,
              message: tvt('phPasswd', '새 비밀번호를 입력해 주세요.'),
            },
          ]}
        >
          <Input.Password autoComplete="new-password" />
        </Form.Item>
        <Form.Item
          label={tvt('chgPasswdChk', '비밀번호 확인')}
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
