export type MemberClassification =
  | 'Pending (Approval)'
  | 'Pending (Payment)'
  | 'Verified'
  | 'Rejected';

export type MemberType = 'General' | 'Foreigner' | 'Organization';

export type ApprovalStatus =
  | 'Not Received'
  | 'Requested'
  | 'In Progress'
  | 'Approved'
  | 'Rejected';

export type AccountStatus = 'Active' | 'Locked';

export interface MemberItem {
  id: string;
  no: number;
  memberClassification: MemberClassification;
  memberCode: string;
  applicationId: string;
  memberType: MemberType;
  memberName: string;
  approvalStatus: ApprovalStatus;
  assignee: string;
  applicationDate: string;
  receivedDate: string;
  attachments: number;
  companyName: string;
  approvalDate: string;
  phone: string;
  email: string;
  accountStatus: AccountStatus;
}

export interface MemberFilterState {
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
}

