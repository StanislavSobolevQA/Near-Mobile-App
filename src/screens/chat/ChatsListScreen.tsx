import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useChatStore } from '../../store/chat';
import { Chat } from '../../types';
import { format } from 'date-fns';
import ru from 'date-fns/locale/ru';

export default function ChatsListScreen() {
  const navigation = useNavigation();
  const { chats, fetchChats, loading } = useChatStore();

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  const renderChat = ({ item }: { item: Chat }) => {
    const otherUser = item.customer?.id === item.executor_id
      ? item.executor
      : item.customer;

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => navigation.navigate('Chat', { chatId: item.id })}
      >
        <View style={styles.chatContent}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {otherUser?.full_name?.[0] || '?'}
            </Text>
          </View>
          <View style={styles.chatInfo}>
            <View style={styles.chatHeader}>
              <Text style={styles.chatName} numberOfLines={1}>
                {otherUser?.full_name || 'Пользователь'}
              </Text>
              {item.last_message && (
                <Text style={styles.chatTime}>
                  {format(new Date(item.last_message.created_at), 'HH:mm', { locale: ru })}
                </Text>
              )}
            </View>
            {item.task && (
              <Text style={styles.taskTitle} numberOfLines={1}>
                {item.task.title}
              </Text>
            )}
            {item.last_message && (
              <Text style={styles.lastMessage} numberOfLines={1}>
                {item.last_message.content}
              </Text>
            )}
          </View>
          {item.unread_count && item.unread_count > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.unread_count}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <FlatList
          data={chats}
          renderItem={renderChat}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Нет чатов</Text>
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
  list: {
    padding: 16,
  },
  chatItem: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
  },
  chatContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  chatTime: {
    color: '#64748b',
    fontSize: 12,
    marginLeft: 8,
  },
  taskTitle: {
    color: '#3b82f6',
    fontSize: 14,
    marginBottom: 4,
  },
  lastMessage: {
    color: '#94a3b8',
    fontSize: 14,
  },
  badge: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginLeft: 8,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
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
