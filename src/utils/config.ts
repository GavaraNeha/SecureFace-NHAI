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
export const AWS_REGION     = 'ap-south-1';          // Mumbai region (low latency for India)
export const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID     || 'YOUR_ACCESS_KEY';
export const AWS_SECRET_KEY = process.env.AWS_SECRET_ACCESS_KEY || 'YOUR_SECRET_KEY';
export const DYNAMO_TABLE   = 'secureface-attendance';
export const S3_BUCKET      = 'secureface-audit-logs';

// Face Recognition
export const MATCH_THRESHOLD       = 0.72;    // Cosine similarity threshold for positive ID
export const LIVENESS_PASSIVE_MIN  = 0.80;    // Min real-face probability from texture model
export const CHALLENGE_TIMEOUT_MS  = 30_000;  // 10 seconds to complete liveness challenges
export const NUM_CHALLENGES        = 2;       // Number of random challenges to issue

// Camera
export const CAMERA_WIDTH   = 640;
export const CAMERA_HEIGHT  = 480;
export const FPS_TARGET     = 15;

// Performance targets
export const MAX_INFERENCE_MS = 1000;   // Must complete in < 1 second
