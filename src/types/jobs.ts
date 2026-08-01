export type JobStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'running'
  | 'completed'
  | 'failed'
  | 'blocked';

export type RiskLevel = 'read' | 'draft' | 'execute' | 'approval_required';

export interface AuditEvent {
  timestamp: string;
  action: string;
  details?: Record<string, unknown>;
}

export interface Job {
  id: string;
  type: string;
  status: JobStatus;
  riskLevel: RiskLevel;
  createdAt: string;
  updatedAt: string;
  input: Record<string, unknown>;
  result?: Record<string, unknown> | null;
  auditEvents: AuditEvent[];
}

export interface CreateJobInput {
  type: string;
  input: Record<string, unknown>;
  riskLevel: RiskLevel;
}

export interface ApproveJobInput {
  reason?: string;
  actor?: string;
}

export interface RejectJobInput {
  reason?: string;
  actor?: string;
}

export interface ApprovalActionDetails {
  previousStatus: JobStatus;
  nextStatus: JobStatus;
  reason?: string;
  actor?: string;
}
