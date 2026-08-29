export type Role = "Core" | "E" | "P";

export interface Member {
  id: string; // email
  name: string;
  role: Role;
  username?: string;
  phone?: string;
  facebook?: string;
  primaryExpertise?: string;
  secondaryExpertise?: string;
  active: boolean;
}

export interface Platform {
  id: string;
  name: string;
  defaultDurationDays: number;
}

export interface ChannelGroup {
  id: string;
  name: string;
  color: string;
  archived: boolean;
  description?: string;
  referenceVideoLink?: string;
  videoFormat?: string;
}

export interface PlatformChannel {
  id: string;
  channelGroupId: string;
  platformId: string;
}

export type IdeaStatus = 
  | "PITCH" 
  | "ASSIGNMENT" 
  | "SCRIPT" 
  | "PRODUCTION" 
  | "QA" 
  | "COMPLETE" 
  | "ARCHIVED_IDEA"
  | "CANCELLED";

export interface Idea {
  id: string;
  title: string;
  description: string; // Nội dung
  logline?: string;
  referenceLinks?: string;
  angle?: string;
  keyMessage?: string;
  platformChannelId: string;
  submittedByEmail: string;
  status: IdeaStatus;
  durationDays: number;
  assignedToEmail: string;
  startDate?: string;
  endDate?: string;
  scriptLink?: string;
  videoLink?: string;
  publishedLink?: string;
  qaFeedback?: string;
  scheduledPostDate?: string;
  createdAt: string;
  assignedAt?: string;
  videoSubmittedAt?: string;
  
  creditsIdeaByEmail?: string;
  creditsScriptByEmail?: string;
  creditsEditedScriptByEmail?: string;
  creditsProducedByEmail?: string;
  creditsQaByEmail?: string;
  creditsApprovedByEmail?: string;
  
  cancelReason?: string;
  cancelledByEmail?: string;
  cancelledAt?: string;
  lastPitchWeek?: string;
  
  internalNote?: string;
  rating?: number;
  tags?: string;
  pitchingBatchId?: string;
}

export interface PitchingBatch {
  id: string;
  title: string;
  category?: string; // e.g. "Branding & Nhân vật", "News & Hot Trend", "Series Chuyên môn"
  description?: string;
  exampleAngles?: string; // Ví dụ gợi ý cách đào sâu
  deadline: string;
  channelGroupId?: string;
  createdByEmail: string;
  createdAt: string;
  status: "OPEN" | "CLOSED";
}

export interface CommentItem {
  id: string;
  ideaId: string;
  memberId: string;
  content: string;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  ideaId: string;
  memberId: string;
  action: string;
  metadata?: string;
  timestamp: string;
}

export interface NotificationItem {
  id: string;
  memberId: string;
  type: string;
  relatedIdeaId: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface ChecklistItem {
  id: string;
  name: string;
  assignedToEmail?: string;
  dueDate?: string;
  status: string;
  createdByEmail: string;
}

export interface AppSettings {
  discordWebhookUrl: string;
  externalCalendarUrl: string;
}
