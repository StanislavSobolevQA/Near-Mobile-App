import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTasksStore } from '../../store/tasks';
import TaskCard from '../../components/TaskCard';
import { TaskCategory, TASK_CATEGORIES } from '../../types';

export default function TasksListScreen() {
  const navigation = useNavigation();
  const { tasks, fetchTasks, loading } = useTasksStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | 'all'>('all');

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const filteredTasks = tasks.filter((task) => {
    if (selectedCategory !== 'all' && task.category !== selectedCategory) {
      return false;
    }
    
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      task.title.toLowerCase().includes(query) ||
      task.description.toLowerCase().includes(query) ||
      task.address.toLowerCase().includes(query)
    );
  });

  const categories = [
    { key: 'all' as const, label: 'Все' },
    ...Object.entries(TASK_CATEGORIES).map(([key, value]) => ({
      key: key as TaskCategory,
      label: value.label,
    })),
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Список задач</Text>
        
        <TextInput
          style={styles.searchInput}
          placeholder="Поиск..."
          placeholderTextColor="#64748b"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <View style={styles.categoriesContainer}>
          <FlatList
            data={categories}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.categoryButton,
                  selectedCategory === item.key && styles.categoryButtonActive,
                ]}
                onPress={() => setSelectedCategory(item.key)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === item.key && styles.categoryTextActive,
                  ]}
                >
                  {item.key !== 'all' && TASK_CATEGORIES[item.key as TaskCategory]?.icon}{' '}
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.key}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <FlatList
          data={filteredTasks}
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              onPress={() => navigation.navigate('TaskDetail', { taskId: item.id })}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery || selectedCategory !== 'all'
                  ? 'Задачи не найдены'
                  : 'Нет доступных задач'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 12,
  },
  categoriesContainer: {
    marginTop: 8,
  },
  categoryButton: {
    backgroundColor: '#334155',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#3b82f6',
  },
  categoryText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#ffffff',
  },
  list: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 16,
  },
});
