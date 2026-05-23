/**
 * SyncService.ts
 *
 * Offline → Online sync strategy:
 *   1. Watches network state via @react-native-community/netinfo
 *   2. On connectivity restored → batch-upload unsynced attendance to AWS
 *   3. After successful upload → marks records synced → purges local copies
 *   4. Retry with exponential backoff on partial failures
 *
 * AWS targets:
 *   • DynamoDB table  : secureface-attendance
 *   • S3 bucket       : secureface-audit-logs  (JSON archive per sync batch)
 */

import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import AWS from 'aws-sdk';
import uuid from 'react-native-uuid';
import { DatabaseService } from './DatabaseService';
import { AWS_REGION, AWS_ACCESS_KEY, AWS_SECRET_KEY, DYNAMO_TABLE, S3_BUCKET } from '../utils/config';

// ── AWS SDK Config ────────────────────────────────────────────────────────────

AWS.config.update({
  region:          AWS_REGION,
  accessKeyId:     AWS_ACCESS_KEY,
  secretAccessKey: AWS_SECRET_KEY,
});

const dynamo = new AWS.DynamoDB.DocumentClient();
const s3     = new AWS.S3();

// ── Sync Logic ────────────────────────────────────────────────────────────────

let isSyncing = false;

export async function syncNow(): Promise<{ synced: number; failed: number }> {
  if (isSyncing) return { synced: 0, failed: 0 };
  isSyncing = true;

  const records = await DatabaseService.getUnsyncedAttendance();
  if (records.length === 0) {
    isSyncing = false;
    return { synced: 0, failed: 0 };
  }

  console.log(`[Sync] Uploading ${records.length} attendance records…`);

  const successIds: string[] = [];
  const batchSize = 25;  // DynamoDB batchWrite limit

  // DynamoDB batch writes
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const putRequests = batch.map(r => ({
      PutRequest: {
        Item: {
          id:            r.id,
          userId:        r.user_id,
          name:          r.name,
          employeeId:    r.employee_id,
          department:    r.department,
          timestamp:     r.timestamp,
          similarity:    r.similarity,
          livenessOk:    r.liveness_ok === 1,
          locationLat:   r.location_lat,
          locationLon:   r.location_lon,
          uploadedAt:    Date.now(),
        },
      },
    }));

    try {
      await dynamo.batchWrite({
        RequestItems: { [DYNAMO_TABLE]: putRequests },
      }).promise();

      successIds.push(...batch.map(r => r.id));
    } catch (err) {
      console.error('[Sync] DynamoDB batch failed:', err);
    }
  }

  // S3 JSON archive
  if (successIds.length > 0) {
    const syncId   = uuid.v4() as string;
    const syncData = records.filter(r => successIds.includes(r.id));

    try {
      await s3.putObject({
        Bucket: S3_BUCKET,
        Key:    `sync/${new Date().toISOString().slice(0, 10)}/${syncId}.json`,
        Body:   JSON.stringify({ syncId, records: syncData, syncedAt: Date.now() }),
        ContentType: 'application/json',
      }).promise();
    } catch (err) {
      console.warn('[Sync] S3 archive failed (non-critical):', err);
    }

    await DatabaseService.markAttendanceSynced(successIds);
    await DatabaseService.purgeLocalAfterSync();
    await DatabaseService.logSync(syncId, successIds.length, 'success');
  }

  isSyncing = false;
  return { synced: successIds.length, failed: records.length - successIds.length };
}

// ── Network Listener ──────────────────────────────────────────────────────────

let retryDelay = 5000;

export const SyncService = {
  startListener() {
    NetInfo.addEventListener((state: NetInfoState) => {
      if (state.isConnected && state.isInternetReachable) {
        console.log('[Sync] Network restored – triggering sync…');
        retryWithBackoff();
      }
    });
    console.log('[Sync] Network listener active ✓');
  },
};

async function retryWithBackoff() {
  try {
    const result = await syncNow();
    retryDelay   = 5000;  // reset on success
    console.log(`[Sync] Done – synced: ${result.synced}, failed: ${result.failed}`);

    if (result.failed > 0) {
      setTimeout(retryWithBackoff, retryDelay);
      retryDelay = Math.min(retryDelay * 2, 60_000);
    }
  } catch (err) {
    console.error('[Sync] Error:', err);
    setTimeout(retryWithBackoff, retryDelay);
    retryDelay = Math.min(retryDelay * 2, 60_000);
  }
}
