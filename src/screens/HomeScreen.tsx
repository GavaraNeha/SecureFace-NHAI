/**
 * HomeScreen.tsx – Dashboard / main menu
 */

import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, ScrollView, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import { DatabaseService } from '../services/DatabaseService';
import { syncNow } from '../services/SyncService';

export default function HomeScreen() {
  const nav = useNavigation<any>();
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [isOnline, setIsOnline]           = useState(false);
  const [syncing, setSyncing]             = useState(false);

  useEffect(() => {
    loadStats();
    const unsub = NetInfo.addEventListener(s => setIsOnline(!!(s.isConnected && s.isInternetReachable)));
    return () => unsub();
  }, []);

  const loadStats = async () => {
    setEnrolledCount(await DatabaseService.getPersonnelCount());
  };

  const handleManualSync = async () => {
    if (!isOnline) { Alert.alert('Offline', 'No internet connection available.'); return; }
    setSyncing(true);
    try {
      const r = await syncNow();
      Alert.alert('Sync Complete', `Synced ${r.synced} records.\nFailed: ${r.failed}`);
    } catch {
      Alert.alert('Sync Failed', 'Check your internet and try again.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1628" />

      {/* Status banner */}
      <View style={[styles.statusBanner, { backgroundColor: isOnline ? '#166534' : '#7F1D1D' }]}>
        <Text style={styles.statusText}>
          {isOnline ? '🟢  Online – Auto-sync active' : '🔴  Offline – Data stored locally'}
        </Text>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <StatCard label="Enrolled" value={String(enrolledCount)} />
        <StatCard label="Mode" value="Offline" accent />
        <StatCard label="AI Model" value="~6 MB" />
      </View>

      {/* Action buttons */}
      <Text style={styles.sectionTitle}>Actions</Text>

      <ActionButton
        icon="🎯"
        title="Authenticate"
        subtitle="Verify field personnel identity"
        color="#00B4D8"
        onPress={() => nav.navigate('Auth')}
      />
      <ActionButton
        icon="➕"
        title="Enroll New Personnel"
        subtitle="Register face for a new employee"
        color="#22C55E"
        onPress={() => nav.navigate('Enroll')}
      />
      <ActionButton
        icon="📋"
        title="Attendance Records"
        subtitle="View local & synced records"
        color="#FFB703"
        onPress={() => nav.navigate('Records')}
      />
      <ActionButton
        icon="☁️"
        title={syncing ? 'Syncing…' : 'Sync to AWS'}
        subtitle={isOnline ? 'Upload pending records now' : 'Requires internet connection'}
        color="#818CF8"
        onPress={handleManualSync}
        disabled={syncing}
      />
      <ActionButton
        icon="⚙️"
        title="Settings"
        subtitle="Configure thresholds & credentials"
        color="#94A3B8"
        onPress={() => nav.navigate('Settings')}
      />
    </ScrollView>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={[styles.statCard, accent && styles.statCardAccent]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ActionButton({ icon, title, subtitle, color, onPress, disabled }: any) {
  return (
    <TouchableOpacity
      style={[styles.actionBtn, disabled && styles.actionBtnDisabled]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled}>
      <View style={[styles.actionIcon, { backgroundColor: color + '22' }]}>
        <Text style={styles.iconText}>{icon}</Text>
      </View>
      <View style={styles.actionText}>
        <Text style={[styles.actionTitle, { color }]}>{title}</Text>
        <Text style={styles.actionSub}>{subtitle}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: '#0A1628' },
  content:       { padding: 16, paddingBottom: 40 },
  statusBanner:  { borderRadius: 10, padding: 12, marginBottom: 16, alignItems: 'center' },
  statusText:    { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  statsRow:      { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard:      { flex: 1, backgroundColor: '#0F2044', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#1E3A5F' },
  statCardAccent:{ borderColor: '#00B4D8' },
  statValue:     { color: '#00B4D8', fontSize: 22, fontWeight: '800' },
  statLabel:     { color: '#94A3B8', fontSize: 11, marginTop: 2 },
  sectionTitle:  { color: '#94A3B8', fontSize: 12, fontWeight: '700', letterSpacing: 1.5, marginBottom: 12, textTransform: 'uppercase' },
  actionBtn:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F2044', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#1E3A5F' },
  actionBtnDisabled: { opacity: 0.5 },
  actionIcon:    { width: 46, height: 46, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  iconText:      { fontSize: 22 },
  actionText:    { flex: 1 },
  actionTitle:   { fontSize: 16, fontWeight: '700' },
  actionSub:     { color: '#64748B', fontSize: 12, marginTop: 2 },
  chevron:       { color: '#334155', fontSize: 24 },
});
