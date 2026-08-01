import { CAPABILITY_REGISTRY } from './capabilities.js';
import type { Capability, CapabilityView } from '../types/capabilities.js';

export function getCapability(id: string): Capability | undefined {
  return CAPABILITY_REGISTRY.get(id);
}

export function listCapabilities(): Capability[] {
  return Array.from(CAPABILITY_REGISTRY.values());
}

export function isCapabilityAllowed(id: string): boolean {
  const cap = CAPABILITY_REGISTRY.get(id);
  if (!cap) return false;
  return cap.kind !== 'external_effect';
}

export function toCapabilityView(cap: Capability): CapabilityView {
  return {
    id: cap.id,
    name: cap.name,
    description: cap.description,
    kind: cap.kind,
    riskProfile: cap.riskProfile,
    timeoutPolicy: cap.timeoutPolicy,
    retryPolicy: cap.retryPolicy,
    artifactContract: cap.artifactContract,
    version: cap.version,
    inputSchemaDescription: cap.inputSchema.description ?? '(no description)',
    outputSchemaDescription: cap.outputSchema.description ?? '(no description)',
  };
}
