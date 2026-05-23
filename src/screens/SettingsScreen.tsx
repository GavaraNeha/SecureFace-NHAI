/**
 * SettingsScreen.tsx
 */

import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Switch, ScrollView, TouchableOpacity, Alert } from 'react-native';
import EncryptedStorage from 'react-native-encrypted-storage';

export default function SettingsScreen() {
  const [threshold, setThreshold]   = useState('0.72');
  const [awsKey, setAwsKey]         = useState('');
  const [awsSecret, setAwsSecret]   = useState('');
  const [autoSync, setAutoSync]     = useState(true);
  const [purgeAfterSync, setPurge]  = useState(true);

  const save = async () => {
    await EncryptedStorage.setItem('aws_key',    awsKey);
    await EncryptedStorage.setItem('aws_secret', awsSecret);
    await EncryptedStorage.setItem('threshold',  threshold);
    Alert.alert('Saved', 'Settings saved securely.');
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>

      <Text style={styles.section}>Recognition</Text>
      <Text style={styles.label}>Match Threshold (0–1)</Text>
      <TextInput style={styles.input} value={threshold} onChangeText={setThreshold}
        keyboardType="decimal-pad" placeholderTextColor="#475569" />
      <Text style={styles.hint}>Default 0.72 – higher = stricter matching</Text>

      <Text style={styles.section}>AWS Sync</Text>
      <Row label="Auto-sync on connectivity" value={autoSync} onToggle={setAutoSync} />
      <Row label="Purge local after sync"     value={purgeAfterSync} onToggle={setPurge} />

      <Text style={styles.label}>AWS Access Key</Text>
      <TextInput style={styles.input} value={awsKey} onChangeText={setAwsKey}
        secureTextEntry placeholder="AKIA..." placeholderTextColor="#475569" />

      <Text style={styles.label}>AWS Secret Key</Text>
      <TextInput style={styles.input} value={awsSecret} onChangeText={setAwsSecret}
        secureTextEntry placeholder="••••••••" placeholderTextColor="#475569" />

      <TouchableOpacity style={styles.saveBtn} onPress={save}>
        <Text style={styles.saveBtnText}>Save Settings</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Row({ label, value, onToggle }: { label: string; value: boolean; onToggle: (v: boolean) => void }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch value={value} onValueChange={onToggle} thumbColor="#00B4D8" trackColor={{ true: '#0F4C75', false: '#334155' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  root:       { flex: 1, backgroundColor: '#0A1628' },
  content:    { padding: 20, paddingBottom: 50 },
  section:    { color: '#00B4D8', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 28, marginBottom: 12 },
  label:      { color: '#94A3B8', fontSize: 13, marginBottom: 6 },
  hint:       { color: '#475569', fontSize: 11, marginTop: 4 },
  input:      { backgroundColor: '#0F2044', borderRadius: 12, borderWidth: 1, borderColor: '#1E3A5F', color: '#FFF', fontSize: 15, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 4 },
  row:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0F2044', borderRadius: 12, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: '#1E3A5F' },
  rowLabel:   { color: '#CBD5E1', fontSize: 14 },
  saveBtn:    { marginTop: 32, backgroundColor: '#00B4D8', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  saveBtnText:{ color: '#FFF', fontSize: 17, fontWeight: '800' },
});
