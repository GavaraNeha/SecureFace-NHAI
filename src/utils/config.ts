/**
 * config.ts
 *
 * Centralised configuration constants.
 * In production, sensitive keys should be stored in environment variables
 * or AWS Secrets Manager – NOT hard-coded here.
 *
 * For the prototype, replace placeholder values with your AWS credentials.
 */
// AWS
export const AWS_REGION     = 'ap-south-1';
export const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID     || 'YOUR_ACCESS_KEY';
export const AWS_SECRET_KEY = process.env.AWS_SECRET_ACCESS_KEY || 'YOUR_SECRET_KEY';
export const DYNAMO_TABLE   = 'secureface-attendance';
export const S3_BUCKET      = 'secureface-audit-logs';
// Face Recognition
export const MATCH_THRESHOLD       = 0.72;
export const LIVENESS_PASSIVE_MIN  = 0.80;
export const CHALLENGE_TIMEOUT_MS  = 30_000;
export const NUM_CHALLENGES        = 2;
// Camera
export const CAMERA_WIDTH   = 640;
export const CAMERA_HEIGHT  = 480;
export const FPS_TARGET     = 15;
// Performance targets
export const MAX_INFERENCE_MS = 1000;
// Enrolled person (in-memory store for demo)
export let enrolledName: string = '';
export let enrolledEmpId: string = '';