import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RNCamera } from 'react-native-camera';
import { pickRandomChallenges, challengeInstruction, verifyChallenge, type Challenge } from '../services/LivenessService';
import { CHALLENGE_TIMEOUT_MS, NUM_CHALLENGES } from '../utils/config';

type Phase = 'CHALLENGE' | 'SUCCESS' | 'FAIL' | 'VERIFYING';

export default function AuthScreen() {
  const nav = useNavigation();
  const cameraRef = useRef<RNCamera>(null);
  const [phase, setPhase] = useState<Phase>('CHALLENGE');
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [currentCIdx, setCurrentCIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(CHALLENGE_TIMEOUT_MS / 1000);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const cList = pickRandomChallenges(NUM_CHALLENGES);
    setChallenges(cList);
    let remaining = CHALLENGE_TIMEOUT_MS / 1000;
    timerRef.current = setInterval(() => {
      remaining--;
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timerRef.current!);
        setPhase('FAIL');
      }
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, []);

  const captureAndVerify = async () => {
    if (!cameraRef.current || phase !== 'CHALLENGE') return;
    setPhase('VERIFYING');
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        base64: false,
        fixOrientation: true,
      });
      const passed = await verifyChallenge(photo.uri, challenges[currentCIdx]);
      if (passed) {
        const next = currentCIdx + 1;
        if (next >= challenges.length) {
          clearInterval(timerRef.current!);
          setPhase('SUCCESS');
        } else {
          setCurrentCIdx(next);
          setPhase('CHALLENGE');
        }
      } else {
        Alert.alert('Not detected', 'Please try the action again clearly.');
        setPhase('CHALLENGE');
      }
    } catch (e) {
      console.warn('Camera error:', e);
      setPhase('CHALLENGE');
    }
  };

  return (
    <View style={styles.root}>
      {(phase === 'CHALLENGE' || phase === 'VERIFYING') && (
        <RNCamera
          ref={cameraRef}
          style={styles.camera}
          type={RNCamera.Constants.Type.front}
          captureAudio={false}
        />
      )}
      <View style={styles.overlay}>
        <View style={styles.faceFrame} />
      </View>
      <View style={styles.hud}>
        {phase === 'CHALLENGE' && (
          <View style={styles.timerBadge}>
            <Text style={styles.timerText}>{timeLeft}s</Text>
          </View>
        )}
        <View style={styles.card}>
          {(phase === 'CHALLENGE' || phase === 'VERIFYING') && challenges.length > 0 && (<>
            <Text style={styles.cardTitle}>Step {currentCIdx + 1}/{challenges.length}</Text>
            <Text style={styles.challenge}>{challengeInstruction(challenges[currentCIdx])}</Text>
            <View style={styles.dotsRow}>
              {challenges.map((_, i) => (
                <View key={i} style={[styles.dot, i < currentCIdx && styles.dotDone]} />
              ))}
            </View>
            <TouchableOpacity
              style={[styles.retryBtn, phase === 'VERIFYING' && { opacity: 0.5 }]}
              onPress={captureAndVerify}
              disabled={phase === 'VERIFYING'}
            >
              <Text style={styles.retryText}>
                {phase === 'VERIFYING' ? 'Verifying...' : 'Capture ✓'}
              </Text>
            </TouchableOpacity>
          </>)}
          {phase === 'SUCCESS' && (<>
            <Text style={styles.successIcon}>✅</Text>
            <Text style={styles.successName}>Authenticated!</Text>
            <Text style={styles.successSub}>Attendance logged offline</Text>
            <TouchableOpacity style={styles.doneBtn} onPress={() => nav.goBack()}>
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </>)}
          {phase === 'FAIL' && (<>
            <Text style={styles.failIcon}>❌</Text>
            <Text style={styles.failText}>Authentication Failed</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => {
              setPhase('CHALLENGE');
              setCurrentCIdx(0);
              setTimeLeft(CHALLENGE_TIMEOUT_MS / 1000);
            }}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </>)}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A1628' },
  camera: { ...StyleSheet.absoluteFillObject },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  faceFrame: { width: 240, height: 300, borderRadius: 120, borderWidth: 3, borderColor: '#00B4D8', borderStyle: 'dashed' },
  hud: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', padding: 20 },
  timerBadge: { alignSelf: 'center', backgroundColor: '#0A1628CC', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, marginBottom: 12 },
  timerText: { color: '#FFB703', fontSize: 18, fontWeight: '800' },
  card: { backgroundColor: '#0A1628EE', borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#1E3A5F' },
  cardTitle: { color: '#90E0EF', fontSize: 15, fontWeight: '700', marginBottom: 6 },
  challenge: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', textAlign: 'center', marginVertical: 8 },
  dotsRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#334155' },
  dotDone: { backgroundColor: '#22C55E' },
  successIcon: { fontSize: 48, marginBottom: 8 },
  successName: { color: '#22C55E', fontSize: 24, fontWeight: '800' },
  successSub: { color: '#94A3B8', fontSize: 13, marginTop: 4 },
  doneBtn: { marginTop: 16, backgroundColor: '#22C55E', borderRadius: 12, paddingHorizontal: 40, paddingVertical: 12 },
  doneBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  failIcon: { fontSize: 48, marginBottom: 8 },
  failText: { color: '#EF4444', fontSize: 20, fontWeight: '700' },
  retryBtn: { marginTop: 16, backgroundColor: '#00B4D8', borderRadius: 12, paddingHorizontal: 40, paddingVertical: 12 },
  retryText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
});