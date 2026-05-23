import FaceDetection, { FaceDetectorContourMode, FaceDetectorLandmarkMode, FaceDetectorClassificationMode } from '@react-native-ml-kit/face-detection';

export type Challenge = 'BLINK' | 'SMILE' | 'TURN_LEFT' | 'TURN_RIGHT' | 'NOD';

export interface LivenessResult {
  passed: boolean;
  reason?: string;
}

export function pickRandomChallenges(count = 2): Challenge[] {
  const all: Challenge[] = ['BLINK', 'SMILE', 'TURN_LEFT', 'TURN_RIGHT'];
  return all.sort(() => Math.random() - 0.5).slice(0, count);
}

export function challengeInstruction(c: Challenge): string {
  const map: Record<Challenge, string> = {
    BLINK: 'Blink your eyes slowly',
    SMILE: 'Give a big smile',
    TURN_LEFT: 'Turn your head left',
    TURN_RIGHT: 'Turn your head right',
    NOD: 'Nod your head down',
  };
  return map[c];
}

export async function verifyChallenge(imageUri: string, challenge: Challenge): Promise<boolean> {
  try {
    const faces = await FaceDetection.detect(imageUri, {
      landmarkMode: FaceDetectorLandmarkMode.ALL,
      classificationMode: FaceDetectorClassificationMode.ALL,
      contourMode: FaceDetectorContourMode.NONE,
    });

    if (!faces || faces.length === 0) return false;
    const face = faces[0];

    switch (challenge) {
      case 'BLINK':
        return (face.leftEyeOpenProbability ?? 1) < 0.3 || (face.rightEyeOpenProbability ?? 1) < 0.3;
      case 'SMILE':
        return (face.smilingProbability ?? 0) > 0.7;
      case 'TURN_LEFT':
        return (face.headEulerAngleY ?? 0) < -15;
      case 'TURN_RIGHT':
        return (face.headEulerAngleY ?? 0) > 15;
      case 'NOD':
        return (face.headEulerAngleX ?? 0) > 15;
      default:
        return false;
    }
  } catch (e) {
    console.warn('[Liveness] Detection error:', e);
    return true;
  }
}

export async function detectLiveness(imageUri: string): Promise<boolean> {
  try {
    const faces = await FaceDetection.detect(imageUri, {
      classificationMode: FaceDetectorClassificationMode.ALL,
      landmarkMode: FaceDetectorLandmarkMode.ALL,
      contourMode: FaceDetectorContourMode.NONE,
    });
    return faces.length > 0;
  } catch {
    return false;
  }
}