export type ProjectStatus = 'active' | 'completed' | 'hold';

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  startDate: string;
  endDate: string;
  manager: string;
  members: string[];
  budget: number;
  category: string;
}

export const mockProjects: Project[] = [
  {
    id: 'P001', name: 'Next-gen ERP system', description: 'Company-wide ERP modernization project',
    status: 'active', progress: 65, startDate: '2025-01-15', endDate: '2025-12-31',
    manager: 'Steve Kim', members: ['Steve Kim', 'Michelle Lee', 'Thomas Song', 'Susan Choi'], budget: 500000000, category: 'System development',
  },
  {
    id: 'P002', name: 'Mobile app renewal', description: 'UI/UX improvements for the customer mobile app',
    status: 'active', progress: 40, startDate: '2025-03-01', endDate: '2025-09-30',
    manager: 'Paul Park', members: ['Paul Park', 'Jane Han', 'Jacob Lim'], budget: 200000000, category: 'App development',
  },
  {
    id: 'P003', name: 'AI chatbot rollout', description: 'AI chatbot for customer service',
    status: 'active', progress: 25, startDate: '2025-04-01', endDate: '2025-11-30',
    manager: 'Andrew Jung', members: ['Andrew Jung', 'Michelle Lee', 'Hannah Oh'], budget: 150000000, category: 'AI/ML',
  },
  {
    id: 'P004', name: 'Analytics platform', description: 'In-house data analytics environment',
    status: 'active', progress: 80, startDate: '2025-01-01', endDate: '2025-06-30',
    manager: 'Steve Kim', members: ['Steve Kim', 'Thomas Song'], budget: 300000000, category: 'Infrastructure',
  },
  {
    id: 'P005', name: 'Security hardening', description: 'Strengthening the information security framework',
    status: 'hold', progress: 15, startDate: '2025-05-01', endDate: '2025-12-31',
    manager: 'Laura Yoon', members: ['Laura Yoon', 'Jacob Lim'], budget: 100000000, category: 'Security',
  },
  {
    id: 'P006', name: 'Website revamp', description: 'Full redesign of the corporate website',
    status: 'completed', progress: 100, startDate: '2024-09-01', endDate: '2025-02-28',
    manager: 'Jane Han', members: ['Jane Han', 'Susan Choi', 'Hannah Oh'], budget: 80000000, category: 'Web development',
  },
  {
    id: 'P007', name: 'CRM system build', description: 'Customer relationship management system',
    status: 'completed', progress: 100, startDate: '2024-06-01', endDate: '2025-01-31',
    manager: 'Paul Park', members: ['Paul Park', 'Susan Choi'], budget: 250000000, category: 'System development',
  },
  {
    id: 'P008', name: 'Cloud migration', description: 'Moving from on-premises to the cloud',
    status: 'active', progress: 55, startDate: '2025-02-01', endDate: '2025-10-31',
    manager: 'Jacob Lim', members: ['Jacob Lim', 'Thomas Song', 'Steve Kim'], budget: 400000000, category: 'Infrastructure',
  },
  {
    id: 'P009', name: 'HR self-service portal', description: 'Web portal where employees handle HR tasks themselves',
    status: 'active', progress: 30, startDate: '2025-04-15', endDate: '2025-11-30',
    manager: 'Hannah Oh', members: ['Hannah Oh', 'Susan Choi', 'Jane Han'], budget: 120000000, category: 'System development',
  },
  {
    id: 'P010', name: 'E-approval system upgrade', description: 'Feature improvements and mobile support for the existing e-approval system',
    status: 'active', progress: 50, startDate: '2025-03-01', endDate: '2025-08-31',
    manager: 'Michelle Lee', members: ['Michelle Lee', 'Thomas Song', 'Paul Park'], budget: 180000000, category: 'System development',
  },
  {
    id: 'P011', name: 'Internal learning platform', description: 'Online training and learning management system (LMS) for employees',
    status: 'hold', progress: 10, startDate: '2025-06-01', endDate: '2026-03-31',
    manager: 'Andrew Jung', members: ['Andrew Jung', 'Hannah Oh'], budget: 90000000, category: 'Web development',
  },
  {
    id: 'P012', name: 'BI reporting upgrade', description: 'Executive dashboard and automated BI reports',
    status: 'active', progress: 70, startDate: '2025-01-20', endDate: '2025-07-31',
    manager: 'Steve Kim', members: ['Steve Kim', 'Michelle Lee'], budget: 160000000, category: 'AI/ML',
  },
  {
    id: 'P013', name: 'DevOps platform', description: 'GitOps-based CI/CD and a standardized developer collaboration environment',
    status: 'completed', progress: 100, startDate: '2024-10-01', endDate: '2025-03-31',
    manager: 'Jacob Lim', members: ['Jacob Lim', 'Thomas Song'], budget: 70000000, category: 'Infrastructure',
  },
  {
    id: 'P014', name: 'Supply chain management system', description: 'New SCM system integrated with partner companies',
    status: 'active', progress: 20, startDate: '2025-05-01', endDate: '2026-04-30',
    manager: 'Paul Park', members: ['Paul Park', 'Jane Han', 'Laura Yoon', 'Thomas Song'], budget: 600000000, category: 'System development',
  },
  {
    id: 'P015', name: 'Legacy system cleanup', description: 'Auditing aging legacy applications and retiring them in stages',
    status: 'hold', progress: 5, startDate: '2025-07-01', endDate: '2026-06-30',
    manager: 'Laura Yoon', members: ['Laura Yoon', 'Michelle Lee'], budget: 50000000, category: 'System development',
  },
];
