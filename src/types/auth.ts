export type FindIdResultProps = {
  loginId: string;
};

export type FindIdZaloVerificationFormProps = {
  onConfirmSuccess: (loginId: string) => void;
};

export type PasswordResetFormProps = {
  token: string;
  maskedLoginId?: string;
  onTokenExpired: () => void;
};

export type ZaloVerificationResult = {
  token: string;
  maskedLoginId: string;
};

export type FindPasswordZaloVerificationFormProps = {
  onConfirmSuccess: (result: ZaloVerificationResult) => void;
};
