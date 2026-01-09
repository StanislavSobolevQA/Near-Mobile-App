import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
} from 'react-native';
import { useRoute } from '@react-navigation/native';

export default function PublicProfileScreen() {
  const route = useRoute();
  // В реальном приложении здесь будет загрузка профиля по userId
  // const { userId } = route.params as { userId: string };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Профиль пользователя</Text>
        {/* Здесь будет отображение публичного профиля */}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});
