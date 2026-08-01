export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly code: string = 'INTERNAL_ERROR'
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) { super(message, 400, 'VALIDATION_ERROR'); this.name = 'ValidationError'; }
}
export class NotFoundError extends AppError {
  constructor(message: string) { super(message, 404, 'NOT_FOUND'); this.name = 'NotFoundError'; }
}
export class InvalidTransitionError extends AppError {
  constructor(message: string) { super(message, 409, 'INVALID_TRANSITION'); this.name = 'InvalidTransitionError'; }
}
export class CapabilityNotFoundError extends AppError {
  constructor(type: string) { super(`Capability '${type}' is not registered in the registry`, 400, 'CAPABILITY_NOT_FOUND'); this.name = 'CapabilityNotFoundError'; }
}
export class JulesUpstreamError extends AppError {
  constructor(message = 'Jules upstream error') { super(message, 502, 'JULES_UPSTREAM_ERROR'); this.name = 'JulesUpstreamError'; }
}
export class JulesUpstreamTimeoutError extends AppError {
  constructor(message = 'Jules upstream timeout') { super(message, 504, 'JULES_UPSTREAM_TIMEOUT'); this.name = 'JulesUpstreamTimeoutError'; }
}
export class JulesUpstreamAuthError extends AppError {
  constructor(message = 'Jules upstream auth error') { super(message, 401, 'JULES_UPSTREAM_AUTH_ERROR'); this.name = 'JulesUpstreamAuthError'; }
}
export class JulesUpstreamAuthFailedError extends AppError {
  constructor(message = 'Jules upstream auth failed') { super(message, 401, 'JULES_UPSTREAM_AUTH_FAILED'); this.name = 'JulesUpstreamAuthFailedError'; }
}
export class JulesUpstreamNotFoundError extends AppError {
  constructor(message = 'Jules upstream not found') { super(message, 404, 'JULES_UPSTREAM_NOT_FOUND'); this.name = 'JulesUpstreamNotFoundError'; }
}
export class JulesUpstreamRateLimitError extends AppError {
  constructor(message = 'Jules upstream rate limit') { super(message, 429, 'JULES_UPSTREAM_RATE_LIMIT'); this.name = 'JulesUpstreamRateLimitError'; }
}
export class JulesUpstreamInvalidResponseError extends AppError {
  constructor(message = 'Jules upstream invalid response') { super(message, 502, 'JULES_UPSTREAM_INVALID_RESPONSE'); this.name = 'JulesUpstreamInvalidResponseError'; }
}
