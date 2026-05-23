import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Alert, ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RNCamera } from 'react-native-camera';
import { enrollFace, detectFace } from '../services/FaceRecognitionService';

export default function EnrollScreen() {
  const nav = useNavigation();
  const cameraRef = useRef<RNCamera>(null);
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [enrolled, setEnrolled] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.6,
        base64: false,
        fixOrientation: true,
      });
      const hasFace = await detectFace(photo.uri);
      if (hasFace) {
        setFaceDetected(true);
        Alert.alert('Face Detected', 'Face captured successfully! Now tap Enroll.');
      } else {
        Alert.alert('No Face Found', 'Please position your face clearly in the frame.');
      }
    } catch (e) {
      Alert.alert('Error', 'Camera capture failed. Try again.');
    } finally {
      setCapturing(false);
    }
  };

  const handleEnroll = async () => {
    if (!name || !employeeId) {
      Alert.alert('Error', 'Please enter name and employee ID');
      return;
    }
    if (!faceDetected) {
      Alert.alert('Error', 'Please capture your face first');
      return;
    }
    const result = await enrollFace(employeeId, null);
    if (result) {
      setEnrolled(true);
      Alert.alert('Success', `${name} enrolled successfully!`);
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Enroll New Personnel</Text>

      <View style={styles.cameraContainer}>
        {!enrolled ? (
          <RNCamera
            ref={cameraRef}
            style={styles.camera}
            type={RNCamera.Constants.Type.front}
            captureAudio={false}
          />
        ) : (
          <View style={styles.enrolledPlaceholder}>
            <Text style={styles.enrolledIcon}>✅</Text>
          </View>
        )}
        {faceDetected && !enrolled && (
          <View style={styles.faceDetectedBadge}>
            <Text style={styles.faceDetectedText}>✅ Face Ready</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.captureBtn, capturing && { opacity: 0.5 }]}
        onPress={handleCapture}
        disabled={capturing || enrolled}
      >
        <Text style={styles.captureBtnText}>
          {capturing ? 'Detecting...' : '📷 Capture Face'}
        </Text>
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Full Name"
        placeholderTextColor="#94A3B8"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Employee ID"
        placeholderTextColor="#94A3B8"
        value={employeeId}
        onChangeText={setEmployeeId}
      />

      <TouchableOpacity style={styles.btn} onPress={handleEnroll}>
        <Text style={styles.btnText}>Enroll Face</Text>
      </TouchableOpacity>

      {enrolled && <Text style={styles.success}>✅ Enrolled successfully!</Text>}

      <TouchableOpacity style={styles.back} onPress={() => nav.goBack()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A1628' },
  content: { padding: 24, alignItems: 'center' },
  title: { color: '#FFF', fontSize: 22, fontWeight: '800', marginBottom: 24 },
  cameraContainer: { width: 220, height: 280, borderRadius: 16, overflow: 'hidden', borderWidth: 3, borderColor: '#00B4D8', marginBottom: 16 },
  camera: { flex: 1 },
  enrolledPlaceholder: { flex: 1, backgroundColor: '#1E3A5F', justifyContent: 'center', alignItems: 'center' },
  enrolledIcon: { fontSize: 64 },
  faceDetectedBadge: { position: 'absolute', bottom: 8, alignSelf: 'center', backgroundColor: '#22C55E', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 },
  faceDetectedText: { color: '#FFF', fontWeight: '700', fontSize: 12 },
  captureBtn: { backgroundColor: '#1E3A5F', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 32, marginBottom: 16, borderWidth: 1, borderColor: '#00B4D8' },
  captureBtnText: { color: '#00B4D8', fontWeight: '700', fontSize: 15 },
  input: { width: '100%', backgroundColor: '#1E3A5F', color: '#FFF', borderRadius: 12, padding: 14, marginBottom: 14, fontSize: 16 },
  btn: { backgroundColor: '#00B4D8', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 40, marginTop: 8 },
  btnText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  success: { color: '#22C55E', fontSize: 16, marginTop: 16 },
  back: { marginTop: 24 },
  backText: { color: '#94A3B8', fontSize: 14 },
});