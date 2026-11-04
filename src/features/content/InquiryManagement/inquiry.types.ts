export type InquiryStatus = 'Unanswered' | 'Completed' | string;

export type InquiryType = 'Consulting' | 'General' | string;

export interface InquiryItem {
  no: number;
  id: string;
  pstNo?: string;
  answerStatus?: string;
  status: InquiryStatus;
  category?: string;
  categoryNm?: string;
  inquiryType: InquiryType;
  title: string;
  content: string;
  mbrNo?: string;
  inquirerNm?: string;
  registrationDate: string; // format: "DD/MM/YYYY HH:mm:ss"
  crtDt?: string;
  registeredCustomer: string; // Member ID
  responseDate: string | null; // format: "DD/MM/YYYY HH:mm:ss" or null
  answeredAt?: string | null;
  ansEmpNo?: string | null;
  ansEmpNm?: string | null;
  responder: string | null; // Responder Name or null
  responseContent?: string;
}

export interface InquiryFilterState {
  responseStatus: {
    all: boolean;
    completed: boolean;
    incomplete: boolean;
  };
  inquiryType: {
    all: boolean;
    consulting: boolean;
    general: boolean;
  };
  dateRange: [string, string] | null; // ['YYYY-MM-DD', 'YYYY-MM-DD']
}
