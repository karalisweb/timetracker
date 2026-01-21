export type UserRole = 'admin' | 'pm' | 'senior' | 'executor';

export interface User {
  id: string;
  email: string;
  name: string;
  roles: UserRole[];
  workingDays: number[];
  workStartTime: string;
  workEndTime: string;
  dailyTargetMinutes: number;
  slackUserId?: string;
  asanaUserId?: string;
  reminderChannel: 'slack_only' | 'slack_email' | 'email_only';
  createdAt: string;
  updatedAt?: string;
}

export interface Project {
  id: string;
  name: string;
  code?: string;
  active: boolean;
  createdAt: string;
  _count?: {
    assignments: number;
    timeEntries: number;
  };
  assignments?: Array<{
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
}

export interface TimeEntry {
  id: string;
  userId: string;
  projectId: string;
  date: string;
  durationMinutes: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  project: {
    id: string;
    name: string;
    code?: string;
  };
}

export interface DayStatus {
  id?: string;
  userId?: string;
  date: string;
  status: 'open' | 'closed_complete' | 'closed_incomplete';
  closedAt?: string;
}

export interface TodaySummary {
  date: string;
  totalMinutes: number;
  targetMinutes: number;
  status: 'open' | 'closed_complete' | 'closed_incomplete';
  isComplete: boolean;
}

export interface WeekDay {
  date: string;
  dayOfWeek: number;
  minutes: number;
  status: 'open' | 'closed_complete' | 'closed_incomplete';
  entriesCount: number;
}

export interface WeeklyStatus {
  weekStart: string;
  weekEnd: string;
  submitted: boolean;
  submittedAt?: string;
  totalMinutes: number;
  days: WeekDay[];
}

export interface ComplianceUser {
  userId: string;
  name: string;
  email: string;
  closedDaysThisWeek: number;
  workingDaysCount: number;
  totalMinutesThisWeek: number;
  weeklyTargetMinutes: number;
  lastEntryDate?: string;
  lastEntryCreatedAt?: string;
  weekSubmitted: boolean;
  weekSubmittedAt?: string;
}

export interface ComplianceDashboard {
  weekStart: string;
  weekEnd: string;
  users: ComplianceUser[];
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

// Orchestration Types
export type OrchProjectStatus = 'in_development' | 'ready_for_publish' | 'published' | 'delivered';
export type ChecklistCategory = 'seo' | 'tech' | 'privacy' | 'performance' | 'custom';
export type ChecklistInstanceStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';
export type GateName = 'published' | 'delivered';

export interface ChecklistItemTemplate {
  id: string;
  checklistTemplateId: string;
  title: string;
  description?: string;
  order: number;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  category: ChecklistCategory;
  description?: string;
  isActive: boolean;
  isMandatoryForGate: boolean;
  gateName?: GateName;
  items: ChecklistItemTemplate[];
}

export interface ExecutionTask {
  id: string;
  checklistInstanceId: string;
  itemTemplateId: string;
  asanaTaskGid?: string;
  asanaTaskData?: Record<string, unknown>;
  syncStatus: string;
  completedAt?: string;
  completedByUserId?: string;
  itemTemplate?: ChecklistItemTemplate;
}

export interface ChecklistInstance {
  id: string;
  orchProjectId: string;
  checklistTemplateId: string;
  executorUserId?: string;
  ownerUserId?: string;
  status: ChecklistInstanceStatus;
  dueDate?: string;
  startedAt?: string;
  completedAt?: string;
  template?: ChecklistTemplate;
  executor?: User;
  owner?: User;
  tasks: ExecutionTask[];
}

export interface Gate {
  id: string;
  name: GateName;
  order: number;
  requirements: GateRequirement[];
}

export interface GateRequirement {
  id: string;
  gateId: string;
  checklistTemplateId?: string;
  isMandatory: boolean;
  checklistTemplate?: ChecklistTemplate;
}

export interface OrchProject {
  id: string;
  name: string;
  code?: string;
  status: OrchProjectStatus;
  decisions?: Record<string, unknown>;
  asanaProjectId?: string;
  createdAt: string;
  updatedAt: string;
  checklists: ChecklistInstance[];
  _gateStatus?: {
    published: { passed: boolean; missing: string[] };
    delivered: { passed: boolean; missing: string[] };
  };
}
