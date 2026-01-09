import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TextInput, FlatList, Text } from 'react-native';
import { useTasksStore } from '../../store/tasks';
import TaskCard from '../../components/TaskCard';
import YandexMap from '../../components/YandexMap';
import { Task } from '../../types';
import { getCurrentLocation } from '../../lib/geocoding';

export default function MapScreen() {
  const { tasks, selectedTask, fetchTasks, selectTask } = useTasksStore();
  const [mapRegion, setMapRegion] = useState({
    latitude: 55.7558,
    longitude: 37.6173,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTasks().catch((err) => {
      console.error('Error fetching tasks:', err);
    });
    // Получаем текущее местоположение
    getCurrentLocation()
      .then((location) => {
        if (location) {
          setMapRegion({
            latitude: location.lat,
            longitude: location.lon,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          });
        }
      })
      .catch((err) => {
        console.error('Error getting location:', err);
        // Используем координаты по умолчанию
      });
  }, []);

  const filteredTasks = tasks.filter((task) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      task.title.toLowerCase().includes(query) ||
      task.description.toLowerCase().includes(query) ||
      task.address.toLowerCase().includes(query)
    );
  });

  return (
    <View style={styles.container}>
      <YandexMap
        tasks={filteredTasks}
        onTaskClick={selectTask}
        selectedTask={selectedTask}
        center={{ lat: mapRegion.latitude, lon: mapRegion.longitude }}
        zoom={12}
      />

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Поиск задач..."
          placeholderTextColor="#64748b"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.tasksContainer}>
        <FlatList
          data={filteredTasks}
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              onPress={() => selectTask(item)}
              isSelected={selectedTask?.id === item.id}
            />
          )}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tasksList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery ? 'Задачи не найдены' : 'Нет доступных задач'}
              </Text>
            </View>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 16,
  },
  searchContainer: {
    position: 'absolute',
    top: 50,
    left: 10,
    right: 10,
    zIndex: 1,
  },
  searchInput: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#ffffff',
  },
  tasksContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    height: 200,
  },
  tasksList: {
    paddingHorizontal: 10,
  },
});
