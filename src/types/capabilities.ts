import type { ZodType } from 'zod';
import type { RiskLevel } from './jobs.js';

/**
 * read             — pure read, no mutation, no side effect
 * analyze          — read + compute/transform, no external mutation
 * draft            — produces a proposal/patch/artifact, no execution
 * execute          — mutates state inside a sandbox
 * external_effect  — side effect outside the gateway (network, fs, API)
 *                    always requires explicit approval policy
 */
export type CapabilityKind =
  | 'read'
  | 'analyze'
  | 'draft'
  | 'execute'
  | 'external_effect';

export interface TimeoutPolicy {
  ms: number;
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffMs: number;
}

export interface ArtifactContract {
  description: string;
  mimeTypes: string[];
}

export interface SandboxRequirement {
  required: boolean;
  kind: string;
}

export interface CapabilityRiskProfile {
  riskLevel: RiskLevel;
  approvalPolicyRef: string;
  sandbox: SandboxRequirement;
}

export interface Capability<TInput = unknown, TOutput = unknown> {
  id: string;
  name: string;
  description: string;
  kind: CapabilityKind;
  inputSchema: ZodType<TInput>;
  outputSchema: ZodType<TOutput>;
  riskProfile: CapabilityRiskProfile;
  timeoutPolicy: TimeoutPolicy;
  retryPolicy: RetryPolicy;
  artifactContract: ArtifactContract;
  version: string;
}

export interface CapabilityView {
  id: string;
  name: string;
  description: string;
  kind: CapabilityKind;
  riskProfile: CapabilityRiskProfile;
  timeoutPolicy: TimeoutPolicy;
  retryPolicy: RetryPolicy;
  artifactContract: ArtifactContract;
  version: string;
  inputSchemaDescription: string;
  outputSchemaDescription: string;
}
