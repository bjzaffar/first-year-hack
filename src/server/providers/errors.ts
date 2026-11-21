import { GenerationErrorSchema, type GenerationError } from '../../shared/schemas.js';

// Safe public error only: no raw response, image bytes, prompt, URL or exception cause.
export class AnalysisProviderError extends Error {
  readonly error: GenerationError;
  constructor(code: GenerationError['code'], message: string, retryable: boolean) {
    super(message);
    this.name = 'AnalysisProviderError';
    this.error = GenerationErrorSchema.parse({ contractVersion: '1', code, message, retryable });
  }
}
