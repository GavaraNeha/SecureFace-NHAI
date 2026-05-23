/**
 * SecureFace – Offline Facial Recognition & Liveness Detection
 * NHAI Hackathon 7.0
 *
 * Entry point: initialises TensorFlow.js backend, sets up navigation.
 */

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

import { initTFJS } from './src/services/TFJSInitService';
import { initDatabase } from './src/services/DatabaseService';
import { SyncService } from './src/services/SyncService';

import HomeScreen from './src/screens/HomeScreen';
import EnrollScreen from './src/screens/EnrollScreen';
import AuthScreen from './src/screens/AuthScreen';
import RecordsScreen from './src/screens/RecordsScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createStackNavigator();

export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        await initTFJS();         // Load TF.js WebGL/CPU backend
        await initDatabase();     // SQLite local DB
        SyncService.startListener(); // Watch for connectivity → auto-sync
        setReady(true);
      } catch (e: any) {
        setError(e.message || 'Initialisation failed');
      }
    })();
  }, []);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.err}>⚠ {error}</Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00B4D8" />
        <Text style={styles.loading}>Loading AI Models…</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
              headerStyle: { backgroundColor: '#0A1628' },
              headerTintColor: '#FFFFFF',
              headerTitleStyle: { fontWeight: 'bold' },
            }}>
            <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'SecureFace' }} />
            <Stack.Screen name="Enroll" component={EnrollScreen} options={{ title: 'Enroll Personnel' }} />
            <Stack.Screen name="Auth" component={AuthScreen} options={{ title: 'Authenticate' }} />
            <Stack.Screen name="Records" component={RecordsScreen} options={{ title: 'Attendance Records' }} />
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A1628' },
  loading: { marginTop: 16, color: '#90E0EF', fontSize: 16 },
  err: { color: '#EF4444', fontSize: 16, textAlign: 'center', padding: 24 },
});
