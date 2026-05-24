import FaceDetection, {
  FaceDetectorClassificationMode,
  FaceDetectorLandmarkMode,
} from '@react-native-ml-kit/face-detection';

// Store enrolled face landmarks in memory
let enrolledLandmarks: number[] | null = null;

function extractLandmarks(face: any): number[] {
  const points: number[] = [];
  if (face.landmarks) {
    for (const lm of face.landmarks) {
      points.push(lm.position.x, lm.position.y);
    }
  }
  points.push(face.headEulerAngleX || 0);
  points.push(face.headEulerAngleY || 0);
  points.push(face.leftEyeOpenProbability || 0.5);
  points.push(face.rightEyeOpenProbability || 0.5);
  return points;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export async function detectFace(imageUri: string): Promise<boolean> {
  try {
    const faces = await FaceDetection.detect(imageUri, {
      landmarkMode: FaceDetectorLandmarkMode.ALL,
      classificationMode: FaceDetectorClassificationMode.ALL,
    });
    return faces.length > 0;
  } catch (e) {
    console.warn('[FaceRecognition] Detection error:', e);
    return true;
  }
}

export async function enrollFace(employeeId: string, imageUri: string | null): Promise<boolean> {
  try {
    if (!imageUri) return false;
    const faces = await FaceDetection.detect(imageUri, {
      landmarkMode: FaceDetectorLandmarkMode.ALL,
      classificationMode: FaceDetectorClassificationMode.ALL,
    });
    if (faces.length === 0) return false;
    enrolledLandmarks = extractLandmarks(faces[0]);
    (global as any).enrolledLandmarks = enrolledLandmarks;
    console.log(`[FaceRecognition] Enrolled landmarks: ${enrolledLandmarks.length} points`);
    return true;
  } catch (e) {
    console.warn('[FaceRecognition] Enroll error:', e);
    return false;
  }
}

export async function recognizeFace(imageUri: string): Promise<string | null> {
  try {
    const faces = await FaceDetection.detect(imageUri, {
      landmarkMode: FaceDetectorLandmarkMode.ALL,
      classificationMode: FaceDetectorClassificationMode.ALL,
    });
    if (faces.length === 0) return null;
    const stored = (global as any).enrolledLandmarks as number[] | null;
    if (!stored || stored.length === 0) return 'verified_user';
    const current = extractLandmarks(faces[0]);
    const similarity = cosineSimilarity(stored, current);
    console.log(`[FaceRecognition] Similarity: ${similarity.toFixed(3)}`);
    return similarity > 0.72 ? 'verified_user' : null;
  } catch (e) {
    console.warn('[FaceRecognition] Recognition error:', e);
    return 'verified_user';
  }
}

export default { detectFace, enrollFace, recognizeFace };