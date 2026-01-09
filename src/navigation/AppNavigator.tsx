import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import MapScreen from '../screens/map/MapScreen';
import TasksListScreen from '../screens/tasks/TasksListScreen';
import CreateTaskScreen from '../screens/tasks/CreateTaskScreen';
import TaskDetailScreen from '../screens/tasks/TaskDetailScreen';
import EditTaskScreen from '../screens/tasks/EditTaskScreen';
import ChatsListScreen from '../screens/chat/ChatsListScreen';
import ChatScreen from '../screens/chat/ChatScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import PublicProfileScreen from '../screens/profile/PublicProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TasksStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="TasksList" 
        component={TasksListScreen}
        options={{ title: 'Задачи' }}
      />
      <Stack.Screen 
        name="TaskDetail" 
        component={TaskDetailScreen}
        options={{ title: 'Детали задачи' }}
      />
      <Stack.Screen 
        name="EditTask" 
        component={EditTaskScreen}
        options={{ title: 'Редактировать' }}
      />
    </Stack.Navigator>
  );
}

function ChatsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ChatsList" 
        component={ChatsListScreen}
        options={{ title: 'Чаты' }}
      />
      <Stack.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{ title: 'Чат' }}
      />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: '#1e293b',
          borderTopColor: '#334155',
        },
      }}
    >
      <Tab.Screen 
        name="Map" 
        component={MapScreen}
        options={{
          title: 'Карта',
          tabBarIcon: ({ color }) => <TabIcon name="map" color={color} />,
        }}
      />
      <Tab.Screen 
        name="Tasks" 
        component={TasksStack}
        options={{
          title: 'Задачи',
          tabBarIcon: ({ color }) => <TabIcon name="list" color={color} />,
        }}
      />
      <Tab.Screen 
        name="CreateTask" 
        component={CreateTaskScreen}
        options={{
          title: 'Создать',
          tabBarIcon: ({ color }) => <TabIcon name="plus" color={color} />,
        }}
      />
      <Tab.Screen 
        name="Chats" 
        component={ChatsStack}
        options={{
          title: 'Чаты',
          tabBarIcon: ({ color }) => <TabIcon name="message" color={color} />,
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: 'Профиль',
          tabBarIcon: ({ color }) => <TabIcon name="user" color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

// Простой компонент для иконок (можно заменить на react-native-vector-icons)
function TabIcon({ name, color }: { name: string; color: string }) {
  const icons: Record<string, string> = {
    map: '🗺️',
    list: '📋',
    plus: '➕',
    message: '💬',
    user: '👤',
  };
  
  return <Text style={{ fontSize: 24 }}>{icons[name] || '•'}</Text>;
}
