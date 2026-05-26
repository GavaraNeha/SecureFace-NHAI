/**
 * RecordsScreen.tsx – View local attendance history
 */
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { DatabaseService } from '../services/DatabaseService';

export default function RecordsScreen() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setRecords(await DatabaseService.getAttendanceHistory(100));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'medium' });

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.row}>
      <View style={[styles.statusDot, { backgroundColor: item.synced ? '#22C55E' : '#FFB703' }]} />
      <View style={styles.rowInfo}>
        <Text style={styles.rowName}>
          {item.name || (global as any).enrolledName || 'Unknown'}
        </Text>
        <Text style={styles.rowSub}>
          {item.employee_id || (global as any).enrolledEmpId || 'N/A'} · {formatTime(item.timestamp)}
        </Text>
        <Text style={styles.rowSub}>
          Confidence: {(item.similarity * 100).toFixed(1)}% ·
          Liveness: {item.liveness_ok ? '✅' : '❌'} ·
          {item.synced ? ' ☁️ Synced' : ' 📱 Local'}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      <Text style={styles.header}>Attendance Records</Text>
      <Text style={styles.subheader}>{records.length} record{records.length !== 1 ? 's' : ''} · Offline SQLite Storage</Text>
      {records.length === 0 && !loading ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>No attendance records yet.</Text>
          <Text style={styles.emptyHint}>Authenticate to log attendance</Text>
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={i => i.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 12 }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor="#00B4D8" />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:       { flex: 1, backgroundColor: '#0A1628', paddingTop: 16 },
  header:     { color: '#FFF', fontSize: 20, fontWeight: '800', paddingHorizontal: 16, marginBottom: 4 },
  subheader:  { color: '#00B4D8', fontSize: 12, paddingHorizontal: 16, marginBottom: 12 },
  row:        { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#0F2044', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#1E3A5F' },
  statusDot:  { width: 10, height: 10, borderRadius: 5, marginTop: 4, marginRight: 12 },
  rowInfo:    { flex: 1 },
  rowName:    { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  rowSub:     { color: '#64748B', fontSize: 12, marginTop: 3 },
  empty:      { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon:  { fontSize: 48, marginBottom: 12 },
  emptyText:  { color: '#FFF', fontSize: 18, fontWeight: '700' },
  emptyHint:  { color: '#94A3B8', fontSize: 14, marginTop: 6 },
});