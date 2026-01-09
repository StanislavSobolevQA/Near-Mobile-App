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
  const { user, initialized, setInitialized } = useAuthStore();

  useEffect(() => {
    // Просто сразу инициализируем приложение
    // Если есть сохраненная сессия, onAuthStateChange автоматически загрузит пользователя
    const currentState = useAuthStore.getState();
    if (!currentState.initialized) {
      console.log('Initializing app...');
      setInitialized(true);
      useAuthStore.setState({ loading: false });
    }
  }, [setInitialized]);

  // Показываем лоадер только если еще не инициализировано (должно быть мгновенно)
  if (!initialized) {
    return <LoadingScreen />;
  }

  // Показываем навигацию в зависимости от наличия пользователя
  // App.tsx автоматически перерендерится когда user изменится в store
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
