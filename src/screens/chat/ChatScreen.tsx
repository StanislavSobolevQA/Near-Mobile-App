import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useChatStore } from '../../store/chat';
import { useAuthStore } from '../../store/auth';
import { Message } from '../../types';
import { format } from 'date-fns';
import ru from 'date-fns/locale/ru';

export default function ChatScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { chatId } = route.params as { chatId: string };
  const { currentChat, messages, fetchChat, sendMessage, unsubscribeFromChat } = useChatStore();
  const { user } = useAuthStore();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (chatId) {
      fetchChat(chatId);
    }

    return () => {
      unsubscribeFromChat();
    };
  }, [chatId, fetchChat, unsubscribeFromChat]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || !chatId) return;

    setSending(true);
    try {
      await sendMessage(chatId, message.trim());
      setMessage('');
    } catch (error: any) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwn = item.user_id === user?.id;

    return (
      <View
        style={[
          styles.messageContainer,
          isOwn ? styles.messageOwn : styles.messageOther,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isOwn ? styles.messageBubbleOwn : styles.messageBubbleOther,
          ]}
        >
          <Text style={styles.messageText}>{item.content}</Text>
          <Text
            style={[
              styles.messageTime,
              isOwn ? styles.messageTimeOwn : styles.messageTimeOther,
            ]}
          >
            {format(new Date(item.created_at), 'HH:mm', { locale: ru })}
          </Text>
        </View>
      </View>
    );
  };

  if (!currentChat) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Написать сообщение..."
          placeholderTextColor="#64748b"
          value={message}
          onChangeText={setMessage}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, (!message.trim() || sending) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!message.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.sendButtonText}>➤</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 12,
  },
  messageOwn: {
    alignItems: 'flex-end',
  },
  messageOther: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
  },
  messageBubbleOwn: {
    backgroundColor: '#3b82f6',
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    backgroundColor: '#1e293b',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 12,
  },
  messageTimeOwn: {
    color: '#bfdbfe',
  },
  messageTimeOther: {
    color: '#64748b',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#ffffff',
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: '#3b82f6',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 20,
  },
});
