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
        // Устанавливаем таймаут - через 3 секунды принудительно завершаем инициализацию
        const timeoutId = setTimeout(() => {
          console.log('Auth initialization timeout - forcing initialization');
          setInitialized(true);
          useAuthStore.setState({ loading: false });
        }, 3000);

        try {
          await loadUser();
        } catch (err) {
          console.error('Error loading user:', err);
        } finally {
          clearTimeout(timeoutId);
          // Всегда устанавливаем initialized в true
          setInitialized(true);
          // Убеждаемся, что loading = false
          useAuthStore.setState({ loading: false });
        }
      }
    };
    init();
  }, [setInitialized]);

  // Показываем лоадер только если еще не инициализировано
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
