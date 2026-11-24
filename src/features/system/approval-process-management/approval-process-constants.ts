// Texts and limits of Approval Process Management (menu A09040500).

/** Same limits as CreateApprovalProcessRequest / ApprovalProcessStepRequest. */
export const PROCESS_CODE_PATTERN = /^[A-Z0-9_]+$/;
export const PROCESS_CODE_MAX = 30;
export const PROCESS_NAME_MAX = 36;
export const STEP_NAME_MAX = 100;
export const MAX_STEPS = 99;

export const APPROVAL_PROCESS_MESSAGES = {
  codeFormat: 'Use upper-case letters, digits and underscores only.',
  duplicateCode: 'This process code is already registered.',
  stepsRequired: 'Add at least one step.',
  stepIncomplete: 'Fill in the name, role group and role of every step.',
  invalidStepOrder: 'Steps must be numbered 1, 2, 3… without gaps.',
  invalidRejectStep: 'A rejection can only return to an earlier step.',
  invalidRole: 'A selected role is inactive or does not exist. Choose another role.',
  inUse: 'This process has already been used by approval sessions and cannot be deleted. Set it to Inactive instead.',
  confirmDelete: 'Delete this approval process and its steps?',
  confirmDeactivate: 'Deactivate this process? New sessions of this kind cannot start while it is inactive.',
  sessionsKeepSteps:
    'Changes apply to sessions started afterwards. Sessions already in progress keep the steps and roles they started with.',
} as const;
