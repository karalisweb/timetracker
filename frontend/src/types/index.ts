export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'collaborator';
  workingDays: number[];
  workStartTime: string;
  workEndTime: string;
  dailyTargetMinutes: number;
  slackUserId?: string;
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
