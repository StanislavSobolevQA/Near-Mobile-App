import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Task, TASK_CATEGORIES } from '../types';

interface TaskCardProps {
  task: Task;
  onPress?: () => void;
  isSelected?: boolean;
}

export default function TaskCard({ task, onPress, isSelected = false }: TaskCardProps) {
  const category = TASK_CATEGORIES[task.category as keyof typeof TASK_CATEGORIES] || TASK_CATEGORIES.other;

  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.cardSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.userInfo}>
          {task.user?.avatar_url ? (
            <Image source={{ uri: task.user.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {task.user?.full_name?.[0] || '?'}
              </Text>
            </View>
          )}
          <View style={styles.userDetails}>
            <Text style={styles.userName} numberOfLines={1}>
              {task.user?.full_name || 'Пользователь'}
            </Text>
            <View style={styles.ratingContainer}>
              <Text style={styles.rating}>⭐ {task.user?.rating?.toFixed(1) || '5.0'}</Text>
              <Text style={styles.reviews}>
                ({task.user?.reviews_count || 0})
              </Text>
            </View>
          </View>
        </View>
        <Text style={styles.price}>{task.budget} ₽</Text>
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {task.title}
      </Text>

      <Text style={styles.description} numberOfLines={3}>
        {task.description}
      </Text>

      <View style={styles.footer}>
        <Text style={styles.address} numberOfLines={1}>
          📍 {task.address}
        </Text>
        <Text style={styles.category}>
          {category.icon} {category.label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    width: 300,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardSelected: {
    borderColor: '#3b82f6',
    borderWidth: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 8,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    color: '#fbbf24',
    fontSize: 12,
    marginRight: 4,
  },
  reviews: {
    color: '#94a3b8',
    fontSize: 12,
  },
  price: {
    color: '#3b82f6',
    fontSize: 24,
    fontWeight: 'bold',
  },
  title: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  address: {
    color: '#64748b',
    fontSize: 12,
    flex: 1,
    marginRight: 8,
  },
  category: {
    color: '#94a3b8',
    fontSize: 12,
    backgroundColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
});
