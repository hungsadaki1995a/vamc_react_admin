export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'hold';
export type TaskPriority = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  projectName: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string;
  reporter: string;
  startDate: string;
  dueDate: string;
  tags: string[];
}

export const mockTasks: Task[] = [
  { id: 'T001', title: 'Database schema design', description: 'Design the core ERP tables', projectId: 'P001', projectName: 'Next-gen ERP system', status: 'done', priority: 'high', assignee: 'Michelle Lee', reporter: 'Steve Kim', startDate: '2025-01-20', dueDate: '2025-02-15', tags: ['DB', 'Design'] },
  { id: 'T002', title: 'API server development', description: 'Build the REST API endpoints', projectId: 'P001', projectName: 'Next-gen ERP system', status: 'in_progress', priority: 'high', assignee: 'Thomas Song', reporter: 'Steve Kim', startDate: '2025-02-16', dueDate: '2025-04-30', tags: ['API', 'Backend'] },
  { id: 'T003', title: 'Front-end UI development', description: 'Implement the admin screens', projectId: 'P001', projectName: 'Next-gen ERP system', status: 'in_progress', priority: 'medium', assignee: 'Susan Choi', reporter: 'Steve Kim', startDate: '2025-03-01', dueDate: '2025-06-30', tags: ['Frontend', 'UI'] },
  { id: 'T004', title: 'UI/UX design', description: 'Produce the app design mockups', projectId: 'P002', projectName: 'Mobile app renewal', status: 'review', priority: 'high', assignee: 'Jane Han', reporter: 'Paul Park', startDate: '2025-03-05', dueDate: '2025-04-15', tags: ['Design', 'UX'] },
  { id: 'T005', title: 'Native module development', description: 'Custom React Native modules', projectId: 'P002', projectName: 'Mobile app renewal', status: 'todo', priority: 'medium', assignee: 'Jacob Lim', reporter: 'Paul Park', startDate: '2025-04-16', dueDate: '2025-06-30', tags: ['Mobile', 'RN'] },
  { id: 'T006', title: 'NLP model selection', description: 'Compare NLP models for the chatbot', projectId: 'P003', projectName: 'AI chatbot rollout', status: 'in_progress', priority: 'high', assignee: 'Michelle Lee', reporter: 'Andrew Jung', startDate: '2025-04-05', dueDate: '2025-05-15', tags: ['AI', 'NLP'] },
  { id: 'T007', title: 'Training data collection', description: 'Clean and label customer inquiry data', projectId: 'P003', projectName: 'AI chatbot rollout', status: 'todo', priority: 'medium', assignee: 'Hannah Oh', reporter: 'Andrew Jung', startDate: '2025-05-01', dueDate: '2025-06-30', tags: ['Data', 'AI'] },
  { id: 'T008', title: 'ETL pipeline', description: 'Automate data extraction, transformation and loading', projectId: 'P004', projectName: 'Analytics platform', status: 'review', priority: 'high', assignee: 'Thomas Song', reporter: 'Steve Kim', startDate: '2025-02-01', dueDate: '2025-04-30', tags: ['Data', 'ETL'] },
  { id: 'T009', title: 'Dashboard development', description: 'Dashboard visualizing the analysis results', projectId: 'P004', projectName: 'Analytics platform', status: 'in_progress', priority: 'medium', assignee: 'Steve Kim', reporter: 'Steve Kim', startDate: '2025-04-01', dueDate: '2025-06-15', tags: ['Visualization', 'Frontend'] },
  { id: 'T010', title: 'Vulnerability assessment', description: 'Scan the whole system for security vulnerabilities', projectId: 'P005', projectName: 'Security hardening', status: 'hold', priority: 'high', assignee: 'Laura Yoon', reporter: 'Laura Yoon', startDate: '2025-05-15', dueDate: '2025-06-30', tags: ['Security', 'Audit'] },
  { id: 'T011', title: 'AWS environment setup', description: 'Set up VPC, EC2, RDS and other infrastructure', projectId: 'P008', projectName: 'Cloud migration', status: 'done', priority: 'high', assignee: 'Jacob Lim', reporter: 'Jacob Lim', startDate: '2025-02-05', dueDate: '2025-03-31', tags: ['Cloud', 'AWS'] },
  { id: 'T012', title: 'Data migration', description: 'Move the existing database to the cloud', projectId: 'P008', projectName: 'Cloud migration', status: 'in_progress', priority: 'high', assignee: 'Thomas Song', reporter: 'Jacob Lim', startDate: '2025-04-01', dueDate: '2025-07-31', tags: ['Data', 'Migration'] },
  { id: 'T013', title: 'Integration testing', description: 'Integration tests across all ERP modules', projectId: 'P001', projectName: 'Next-gen ERP system', status: 'todo', priority: 'high', assignee: 'Laura Yoon', reporter: 'Steve Kim', startDate: '2025-07-01', dueDate: '2025-09-30', tags: ['QA', 'Testing'] },
  { id: 'T014', title: 'User manual', description: 'User guide for the ERP system', projectId: 'P001', projectName: 'Next-gen ERP system', status: 'in_progress', priority: 'low', assignee: 'Hannah Oh', reporter: 'Steve Kim', startDate: '2025-09-01', dueDate: '2026-03-31', tags: ['Docs', 'Manual'] },
  { id: 'T015', title: 'Performance tuning', description: 'Improve mobile app loading speed', projectId: 'P002', projectName: 'Mobile app renewal', status: 'todo', priority: 'medium', assignee: 'Paul Park', reporter: 'Paul Park', startDate: '2025-07-01', dueDate: '2025-08-31', tags: ['Performance', 'Optimization'] },
  { id: 'T016', title: 'Code review process', description: 'PR review guidelines and automation tooling', projectId: 'P001', projectName: 'Next-gen ERP system', status: 'done', priority: 'low', assignee: 'Michelle Lee', reporter: 'Michelle Lee', startDate: '2025-01-10', dueDate: '2025-01-25', tags: ['Process', 'Dev env'] },
  { id: 'T017', title: 'Push notifications', description: 'Implement push notifications on FCM', projectId: 'P002', projectName: 'Mobile app renewal', status: 'review', priority: 'medium', assignee: 'Jacob Lim', reporter: 'Paul Park', startDate: '2025-05-01', dueDate: '2025-06-15', tags: ['Mobile', 'Notification'] },
  { id: 'T018', title: 'Chatbot API integration', description: 'Connect to the external chatbot platform API', projectId: 'P003', projectName: 'AI chatbot rollout', status: 'todo', priority: 'high', assignee: 'Andrew Jung', reporter: 'Andrew Jung', startDate: '2025-06-01', dueDate: '2025-08-31', tags: ['API', 'AI'] },
  { id: 'T019', title: 'Real-time monitoring', description: 'Grafana + Prometheus monitoring stack', projectId: 'P008', projectName: 'Cloud migration', status: 'in_progress', priority: 'medium', assignee: 'Jacob Lim', reporter: 'Jacob Lim', startDate: '2025-06-01', dueDate: '2025-07-31', tags: ['Monitoring', 'Infra'] },
  { id: 'T020', title: 'Access control policy', description: 'IAM policies and security group configuration', projectId: 'P005', projectName: 'Security hardening', status: 'hold', priority: 'high', assignee: 'Laura Yoon', reporter: 'Laura Yoon', startDate: '2025-05-20', dueDate: '2025-07-31', tags: ['Security', 'IAM'] },
  { id: 'T021', title: 'CI/CD pipeline', description: 'Deployment automation with GitHub Actions', projectId: 'P001', projectName: 'Next-gen ERP system', status: 'done', priority: 'high', assignee: 'Thomas Song', reporter: 'Michelle Lee', startDate: '2025-01-05', dueDate: '2025-02-10', tags: ['DevOps', 'Automation'] },
  { id: 'T022', title: 'Internationalization (i18n)', description: 'Add Korean/English language support', projectId: 'P002', projectName: 'Mobile app renewal', status: 'in_progress', priority: 'low', assignee: 'Susan Choi', reporter: 'Paul Park', startDate: '2025-06-01', dueDate: '2025-07-31', tags: ['i18n', 'Frontend'] },
  { id: 'T023', title: 'Chatbot UI development', description: 'Build the chat interface components', projectId: 'P003', projectName: 'AI chatbot rollout', status: 'todo', priority: 'medium', assignee: 'Jane Han', reporter: 'Andrew Jung', startDate: '2025-07-01', dueDate: '2025-09-30', tags: ['UI', 'AI'] },
  { id: 'T024', title: 'Automated analytics reports', description: 'Generate the monthly analytics report automatically', projectId: 'P004', projectName: 'Analytics platform', status: 'todo', priority: 'low', assignee: 'Hannah Oh', reporter: 'Steve Kim', startDate: '2025-07-01', dueDate: '2025-09-30', tags: ['Automation', 'Report'] },
  { id: 'T025', title: 'Network diagram', description: 'Document the AWS architecture diagram', projectId: 'P008', projectName: 'Cloud migration', status: 'done', priority: 'low', assignee: 'Jacob Lim', reporter: 'Jacob Lim', startDate: '2025-03-01', dueDate: '2025-03-15', tags: ['Docs', 'Infra'] },
  { id: 'T026', title: 'Accessibility (a11y) improvements', description: 'Accessibility work against WCAG 2.1', projectId: 'P001', projectName: 'Next-gen ERP system', status: 'todo', priority: 'low', assignee: 'Susan Choi', reporter: 'Michelle Lee', startDate: '2025-10-01', dueDate: '2025-11-30', tags: ['A11y', 'UI'] },
  { id: 'T027', title: 'Load testing', description: 'API load tests with JMeter', projectId: 'P001', projectName: 'Next-gen ERP system', status: 'todo', priority: 'medium', assignee: 'Laura Yoon', reporter: 'Steve Kim', startDate: '2025-10-01', dueDate: '2025-10-31', tags: ['QA', 'Performance'] },
  { id: 'T028', title: 'App store submission prep', description: 'Register on the iOS/Android stores and prepare for review', projectId: 'P002', projectName: 'Mobile app renewal', status: 'todo', priority: 'high', assignee: 'Paul Park', reporter: 'Paul Park', startDate: '2025-08-01', dueDate: '2025-09-15', tags: ['Release', 'Mobile'] },
  { id: 'T029', title: 'Handover plan', description: 'Checklist for the dev-to-production transition', projectId: 'P004', projectName: 'Analytics platform', status: 'review', priority: 'medium', assignee: 'Steve Kim', reporter: 'Steve Kim', startDate: '2025-06-10', dueDate: '2025-06-20', tags: ['Ops', 'Planning'] },
  { id: 'T030', title: 'SSO integration', description: 'Integrate with the corporate SSO system', projectId: 'P005', projectName: 'Security hardening', status: 'hold', priority: 'high', assignee: 'Laura Yoon', reporter: 'Laura Yoon', startDate: '2025-06-01', dueDate: '2025-10-31', tags: ['Security', 'SSO'] },
];

export const taskStatusLabels: Record<TaskStatus, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  review: 'In review',
  done: 'Done',
  hold: 'On hold',
};

export const taskStatusColors: Record<TaskStatus, string> = {
  todo: 'default',
  in_progress: 'processing',
  review: 'warning',
  done: 'success',
  hold: 'error',
};

export const taskPriorityLabels: Record<TaskPriority, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export const taskPriorityColors: Record<TaskPriority, string> = {
  high: 'red',
  medium: 'orange',
  low: 'blue',
};
