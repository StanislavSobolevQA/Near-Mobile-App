import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTasksStore } from '../../store/tasks';
import { TASK_CATEGORIES, TaskCategory } from '../../types';

export default function EditTaskScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { taskId } = route.params as { taskId: string };
  const { selectedTask, fetchTask, updateTask } = useTasksStore();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: '',
    address: '',
    category: 'other' as TaskCategory,
  });

  useEffect(() => {
    if (taskId) {
      fetchTask(taskId);
    }
  }, [taskId, fetchTask]);

  useEffect(() => {
    if (selectedTask) {
      setFormData({
        title: selectedTask.title,
        description: selectedTask.description,
        budget: selectedTask.budget.toString(),
        address: selectedTask.address,
        category: selectedTask.category as TaskCategory,
      });
    }
  }, [selectedTask]);

  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !formData.budget || !formData.address) {
      Alert.alert('Ошибка', 'Заполните все поля');
      return;
    }

    setLoading(true);
    try {
      await updateTask(taskId, {
        title: formData.title,
        description: formData.description,
        budget: parseInt(formData.budget),
        address: formData.address,
        category: formData.category,
      });

      Alert.alert('Успешно', 'Задача обновлена', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Не удалось обновить задачу');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedTask) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Загрузка...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Редактировать задачу</Text>

        <TextInput
          style={styles.input}
          placeholder="Название"
          placeholderTextColor="#64748b"
          value={formData.title}
          onChangeText={(text) => setFormData({ ...formData, title: text })}
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Описание"
          placeholderTextColor="#64748b"
          value={formData.description}
          onChangeText={(text) => setFormData({ ...formData, description: text })}
          multiline
          numberOfLines={6}
        />

        <View style={styles.categoriesGrid}>
          {Object.entries(TASK_CATEGORIES).map(([key, { label, icon }]) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.categoryCard,
                formData.category === key && styles.categoryCardActive,
              ]}
              onPress={() => setFormData({ ...formData, category: key as TaskCategory })}
            >
              <Text style={styles.categoryIcon}>{icon}</Text>
              <Text style={styles.categoryLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={styles.input}
          placeholder="Бюджет (₽)"
          placeholderTextColor="#64748b"
          value={formData.budget}
          onChangeText={(text) => setFormData({ ...formData, budget: text })}
          keyboardType="numeric"
        />

        <TextInput
          style={styles.input}
          placeholder="Адрес"
          placeholderTextColor="#64748b"
          value={formData.address}
          onChangeText={(text) => setFormData({ ...formData, address: text })}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Сохранить</Text>
          )}
        </TouchableOpacity>
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
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 12,
  },
  categoryCard: {
    backgroundColor: '#1e293b',
    borderWidth: 2,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '30%',
    minWidth: 100,
  },
  categoryCardActive: {
    borderColor: '#3b82f6',
    backgroundColor: '#1e3a8a',
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 32,
  },
});
