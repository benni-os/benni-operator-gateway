import type { CreateJobInput } from '../types/jobs.js';

const HIGH_RISK_KEYWORDS = [
  'email', 'message', 'slack', 'telegram', 'post',
  'auth', 'login', 'payment', 'checkout', 'purchase', 'billing',
  'merge', 'delete', 'force push', 'deploy',
  'shell', 'terminal', 'exec', 'filesystem', 'fs',
];

const KNOWN_SAFE_TYPES = ['repository_summary_preview'];

export function requiresApproval(job: CreateJobInput): boolean {
  if (job.riskLevel === 'approval_required' || job.riskLevel === 'execute') return true;
  const typeLower = job.type.toLowerCase();
  if (!KNOWN_SAFE_TYPES.includes(typeLower)) return true;
  for (const keyword of HIGH_RISK_KEYWORDS) if (typeLower.includes(keyword)) return true;
  const safePurpose = 'Safe local v0.1 job-state test only. Do not access GitHub or execute anything.'.toLowerCase();
  const inputCheck = JSON.stringify(job.input).toLowerCase().replace(safePurpose, '');
  for (const keyword of HIGH_RISK_KEYWORDS) if (inputCheck.includes(keyword)) return true;
  if (job.type === 'repository_summary_preview' && job.riskLevel === 'read' &&
      job.input?.purpose === 'Safe local v0.1 job-state test only. Do not access GitHub or execute anything.') return false;
  return true;
}
