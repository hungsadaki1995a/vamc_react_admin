export type MemberClassification =
  | 'Pending (Approval)'
  | 'Pending (Payment)'
  | 'Verified'
  | 'Rejected';

export type MemberGrade = 'Temporary' | 'General' | 'Full' | 'Deleted';

export type MemberType = 'General' | 'Foreigner' | 'Organization';

export type MemberStatus =
  | 'Pending Approval'
  | 'Supplement Requested'
  | 'Rejected'
  | 'Active'
  | 'Locked'
  | 'Deleted'
  | 'Cancelled';

export type MembershipType = 'Paid' | 'Exempt' | 'None';

export type SignUpChannel = 'Online' | 'Offline';

export type MemberSearchField =
  | 'MBR_NO'
  | 'SGDN_MBR_NO'
  | 'LGN_ID'
  | 'MBR_NM'
  | 'TELNO'
  | 'EML_ADDR'
  | 'ORGNZ_NM'
  | 'MST_NO';

export type ApprovalStatus =
  | 'Not Received'
  | 'Requested'
  | 'In Progress'
  | 'Approved'
  | 'Rejected';

export type AccountStatus = 'Active' | 'Locked';

export type MemberItem = {
  id: string;
  no: number;
  memberClassification: MemberClassification;
  memberGrade?: MemberGrade;
  status?: MemberStatus;
  memberCode: string;
  sgdnMemberCode?: string;
  loginId?: string;
  applicationId: string;
  memberType: MemberType;
  memberName: string;
  approvalStatus: ApprovalStatus;
  assignee: string;
  applicationDate: string;
  receivedDate: string;
  attachments: number;
  companyName: string;
  signUpChannel?: SignUpChannel | '-';
  membership?: MembershipType | '-';
  membershipExpiryDate?: string;
  approvalDate: string;
  /** Payment deadline of an application in Pending Approval (sign-up / re-application + 15 days). */
  paymentDeadline?: string;
  deletedDate?: string;
  retentionEndDate?: string;
  phone: string;
  email: string;
  accountStatus: AccountStatus;
};

export type MemberFilterState = {
  memberClassification: MemberClassification[];
  isClassificationAll: boolean;
  memberType: MemberType[];
  isTypeAll: boolean;
  accountStatus: AccountStatus[];
  isAccountStatusAll: boolean;
  approvalStatus: ApprovalStatus[];
  isApprovalStatusAll: boolean;
  memberName: string;
  companyName: string;
  memberCode: string;
  phoneNumber: string;
  email: string;
  dateRange: [string | null, string | null] | null;
};

