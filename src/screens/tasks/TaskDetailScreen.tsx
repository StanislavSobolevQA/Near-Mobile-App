import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTasksStore } from '../../store/tasks';
import { useAuthStore } from '../../store/auth';
import { useChatStore } from '../../store/chat';
import { TASK_CATEGORIES } from '../../types';

export default function TaskDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { taskId } = route.params as { taskId: string };
  const { selectedTask, fetchTask, deleteTask } = useTasksStore();
  const { user } = useAuthStore();
  const { createChat } = useChatStore();

  useEffect(() => {
    if (taskId) {
      fetchTask(taskId);
    }
  }, [taskId, fetchTask]);

  if (!selectedTask) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Загрузка...</Text>
      </View>
    );
  }

  const category = TASK_CATEGORIES[selectedTask.category as keyof typeof TASK_CATEGORIES] || TASK_CATEGORIES.other;
  const isOwner = selectedTask.user_id === user?.id;

  const handleRespond = async () => {
    if (!user) {
      Alert.alert('Ошибка', 'Необходимо войти в аккаунт');
      return;
    }

    try {
      const chatId = await createChat(selectedTask.id, user.id);
      navigation.navigate('Chat', { chatId });
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Не удалось создать чат');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Удалить задачу?',
      'Вы уверены, что хотите удалить эту задачу?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTask(selectedTask.id);
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Ошибка', error.message || 'Не удалось удалить задачу');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.category}>
            {category.icon} {category.label}
          </Text>
          <Text style={styles.status}>
            {selectedTask.status === 'open' && 'Открыто'}
            {selectedTask.status === 'in_progress' && 'В работе'}
            {selectedTask.status === 'completed' && 'Завершено'}
          </Text>
        </View>

        <Text style={styles.title}>{selectedTask.title}</Text>
        <Text style={styles.description}>{selectedTask.description}</Text>

        <View style={styles.infoRow}>
          <Text style={styles.price}>{selectedTask.budget} ₽</Text>
          <Text style={styles.address}>📍 {selectedTask.address}</Text>
        </View>

        {selectedTask.photos && selectedTask.photos.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosContainer}>
            {selectedTask.photos.map((photo, index) => (
              <Image key={index} source={{ uri: photo }} style={styles.photo} />
            ))}
          </ScrollView>
        )}

        {selectedTask.user && (
          <View style={styles.userCard}>
            <Text style={styles.userName}>{selectedTask.user.full_name || 'Пользователь'}</Text>
            <Text style={styles.userRating}>
              ⭐ {selectedTask.user.rating?.toFixed(1) || '5.0'} ({selectedTask.user.reviews_count || 0} отзывов)
            </Text>
          </View>
        )}

        {!isOwner && (
          <TouchableOpacity style={styles.respondButton} onPress={handleRespond}>
            <Text style={styles.respondButtonText}>Откликнуться</Text>
          </TouchableOpacity>
        )}

        {isOwner && (
          <View style={styles.ownerActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={() => navigation.navigate('EditTask', { taskId: selectedTask.id })}
            >
              <Text style={styles.actionButtonText}>Редактировать</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={handleDelete}
            >
              <Text style={styles.actionButtonText}>Удалить</Text>
            </TouchableOpacity>
          </View>
        )}
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
  loadingText: {
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  category: {
    fontSize: 16,
    color: '#94a3b8',
  },
  status: {
    fontSize: 14,
    color: '#3b82f6',
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#94a3b8',
    lineHeight: 24,
    marginBottom: 16,
  },
  infoRow: {
    marginBottom: 16,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 8,
  },
  address: {
    fontSize: 14,
    color: '#64748b',
  },
  photosContainer: {
    marginBottom: 16,
  },
  photo: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginRight: 12,
  },
  userCard: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  userRating: {
    fontSize: 14,
    color: '#94a3b8',
  },
  respondButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  respondButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  ownerActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#3b82f6',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
