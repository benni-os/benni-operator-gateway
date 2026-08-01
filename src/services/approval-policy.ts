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
  const inputJson = JSON.stringify(job.input || {}).toLowerCase();
  // check for dangerous keywords if not in exempted test purpose
  for (const keyword of HIGH_RISK_KEYWORDS) {
    if (inputJson.includes(keyword)) {
      // allow if it's safe test purpose or repository preview input
      if (job.type === 'repository_summary_preview' && job.riskLevel === 'read' && !inputJson.includes('merge pr')) {
        continue;
      }
      return true;
    }
  }
  if (job.type === 'repository_summary_preview' && job.riskLevel === 'read') return false;
  return true;
}
