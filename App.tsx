import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from './src/store/auth';
import AppNavigator from './src/navigation/AppNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import LoadingScreen from './src/components/LoadingScreen';

export default function App() {
  const { user, loading, initialized, setInitialized, loadUser } = useAuthStore();

  useEffect(() => {
    const init = async () => {
      const currentState = useAuthStore.getState();
      if (!currentState.initialized) {
        try {
          await loadUser();
        } catch (err) {
          console.error('Error loading user:', err);
        } finally {
          setInitialized(true);
        }
      }
    };
    init();
  }, []);

  if (!initialized || loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      {user ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorSubtext: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
  },
});
