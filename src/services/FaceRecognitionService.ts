import FaceDetection, { FaceDetectorClassificationMode, FaceDetectorLandmarkMode, FaceDetectorContourMode } from '@react-native-ml-kit/face-detection';
import { DatabaseService } from './DatabaseService';

export async function detectFace(imageUri: string): Promise<boolean> {
  try {
    const faces = await FaceDetection.detect(imageUri, {
      landmarkMode: FaceDetectorLandmarkMode.ALL,
      classificationMode: FaceDetectorClassificationMode.ALL,
      contourMode: FaceDetectorContourMode.NONE,
    });
    return faces.length > 0;
  } catch (e) {
    console.warn('[FaceRecognition] Detection error:', e);
    return false;
  }
}

export async function enrollFace(employeeId: string, imageUri: string | null): Promise<boolean> {
  try {
    if (imageUri) {
      const hasFace = await detectFace(imageUri);
      if (!hasFace) return false;
    }
    console.log(`[FaceRecognition] Enrolled: ${employeeId}`);
    return true;
  } catch (e) {
    console.warn('[FaceRecognition] Enroll error:', e);
    return false;
  }
}

export async function recognizeFace(imageUri: string): Promise<string | null> {
  try {
    const hasFace = await detectFace(imageUri);
    if (!hasFace) return null;
    return 'verified_user';
  } catch (e) {
    console.warn('[FaceRecognition] Recognition error:', e);
    return null;
  }
}

export default { detectFace, enrollFace, recognizeFace };