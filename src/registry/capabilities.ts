import { z } from 'zod';
import type { Capability } from '../types/capabilities.js';

const RepositorySummaryPreviewInput = z.object({
  repository: z.string().min(1).describe('Full repository slug, e.g. owner/repo'),
  purpose: z.string().min(1).describe('Human-readable reason for the summary request'),
});

const RepositorySummaryPreviewOutput = z.object({
  summary: z.string().describe('Markdown summary of the repository'),
  generatedAt: z.string().datetime().describe('ISO 8601 timestamp of generation'),
});

const GenericExecuteDraftInput = z.object({
  payload: z.record(z.unknown()).describe('Arbitrary draft payload to be reviewed before execution'),
});

const GenericExecuteDraftOutput = z.object({
  draftId: z.string().describe('Identifier of the created draft artifact'),
  previewUrl: z.string().optional().describe('Optional URL to preview the draft'),
});

export const CAPABILITY_REGISTRY: Map<string, Capability> = new Map([
  [
    'repository_summary_preview',
    {
      id: 'repository_summary_preview',
      name: 'Repository Summary Preview',
      description:
        'Produces a read-only Markdown summary of a repository. ' +
        'No mutations, no network writes. Safe for auto-approval.',
      kind: 'read',
      inputSchema: RepositorySummaryPreviewInput,
      outputSchema: RepositorySummaryPreviewOutput,
      riskProfile: {
        riskLevel: 'read',
        approvalPolicyRef: 'auto_approve',
        sandbox: { required: false, kind: 'none' },
      },
      timeoutPolicy: { ms: 15_000 },
      retryPolicy: { maxAttempts: 2, backoffMs: 500 },
      artifactContract: {
        description: 'A single Markdown document summarising the repository.',
        mimeTypes: ['text/markdown'],
      },
      version: '1.0.0',
    } satisfies Capability<
      z.infer<typeof RepositorySummaryPreviewInput>,
      z.infer<typeof RepositorySummaryPreviewOutput>
    >,
  ],
  [
    'generic_execute_draft',
    {
      id: 'generic_execute_draft',
      name: 'Generic Execute Draft',
      description:
        'Accepts an arbitrary payload and creates a draft artifact for ' +
        'human review before any execution. Always requires approval.',
      kind: 'draft',
      inputSchema: GenericExecuteDraftInput,
      outputSchema: GenericExecuteDraftOutput,
      riskProfile: {
        riskLevel: 'execute',
        approvalPolicyRef: 'require_human_approval',
        sandbox: { required: true, kind: 'docker' },
      },
      timeoutPolicy: { ms: 30_000 },
      retryPolicy: { maxAttempts: 1, backoffMs: 1_000 },
      artifactContract: {
        description: 'A draft artifact identifier and optional preview URL.',
        mimeTypes: ['application/json'],
      },
      version: '1.0.0',
    } satisfies Capability<
      z.infer<typeof GenericExecuteDraftInput>,
      z.infer<typeof GenericExecuteDraftOutput>
    >,
  ],
]);
