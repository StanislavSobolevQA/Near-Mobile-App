import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { useTasksStore } from '../../store/tasks';
import { useAuthStore } from '../../store/auth';
import { TASK_CATEGORIES, TaskCategory } from '../../types';
import YandexMap from '../../components/YandexMap';
import { geocodeAddress, reverseGeocode, getCurrentLocation } from '../../lib/geocoding';

export default function CreateTaskScreen() {
  const navigation = useNavigation();
  const { createTask } = useTasksStore();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [showMap, setShowMap] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: '',
    address: '',
    phone: user?.phone || '',
    category: 'other' as TaskCategory,
    latitude: 55.7558,
    longitude: 37.6173,
    photos: [] as string[],
  });

  const handleSubmit = async () => {
    if (step < 3) {
      setStep(step + 1);
      return;
    }

    if (!formData.title || !formData.description || !formData.budget || !formData.address) {
      Alert.alert('Ошибка', 'Заполните все обязательные поля');
      return;
    }

    setLoading(true);
    try {
      await createTask({
        title: formData.title,
        description: formData.description,
        budget: parseInt(formData.budget),
        address: formData.address,
        category: formData.category,
        latitude: formData.latitude,
        longitude: formData.longitude,
        photos: formData.photos,
        phone: formData.phone || user?.phone || '',
      });

      Alert.alert('Успешно', 'Задача создана', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Не удалось создать задачу');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Создать поручение</Text>

        {step === 1 && (
          <View style={styles.step}>
            <Text style={styles.stepTitle}>Основная информация</Text>
            <TextInput
              style={styles.input}
              placeholder="Название задания *"
              placeholderTextColor="#64748b"
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Описание *"
              placeholderTextColor="#64748b"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
              numberOfLines={6}
            />
            <TouchableOpacity
              style={[styles.button, (!formData.title || !formData.description) && styles.buttonDisabled]}
              onPress={() => setStep(2)}
              disabled={!formData.title || !formData.description}
            >
              <Text style={styles.buttonText}>Продолжить</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <View style={styles.step}>
            <Text style={styles.stepTitle}>Категория и бюджет</Text>
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
              placeholder="Бюджет (₽) *"
              placeholderTextColor="#64748b"
              value={formData.budget}
              onChangeText={(text) => setFormData({ ...formData, budget: text })}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Телефон *"
              placeholderTextColor="#64748b"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              keyboardType="phone-pad"
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => setStep(1)}
              >
                <Text style={styles.buttonText}>Назад</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  (!formData.budget || !formData.phone) && styles.buttonDisabled,
                ]}
                onPress={() => setStep(3)}
                disabled={!formData.budget || !formData.phone}
              >
                <Text style={styles.buttonText}>Продолжить</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.step}>
            <Text style={styles.stepTitle}>Местоположение</Text>
            <TextInput
              style={styles.input}
              placeholder="Адрес *"
              placeholderTextColor="#64748b"
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
            />
            <View style={styles.locationButtons}>
              <TouchableOpacity
                style={[styles.locationButton, geocoding && styles.buttonDisabled]}
                onPress={async () => {
                  if (!formData.address.trim()) {
                    Alert.alert('Ошибка', 'Введите адрес');
                    return;
                  }
                  setGeocoding(true);
                  try {
                    const result = await geocodeAddress(formData.address);
                    if (result) {
                      setFormData({
                        ...formData,
                        latitude: result.lat,
                        longitude: result.lon,
                        address: result.formattedAddress,
                      });
                      setShowMap(true);
                    } else {
                      Alert.alert('Ошибка', 'Адрес не найден');
                    }
                  } catch (err: any) {
                    Alert.alert('Ошибка', err.message || 'Не удалось найти адрес');
                  } finally {
                    setGeocoding(false);
                  }
                }}
                disabled={geocoding}
              >
                <Text style={styles.locationButtonText}>
                  {geocoding ? 'Поиск...' : 'Найти на карте'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.locationButton}
                onPress={async () => {
                  try {
                    const location = await getCurrentLocation();
                    if (location) {
                      setFormData({
                        ...formData,
                        latitude: location.lat,
                        longitude: location.lon,
                      });
                      const address = await reverseGeocode(location.lat, location.lon);
                      if (address) {
                        setFormData(prev => ({ ...prev, address }));
                      }
                      setShowMap(true);
                    } else {
                      Alert.alert('Ошибка', 'Не удалось определить местоположение');
                    }
                  } catch (err: any) {
                    Alert.alert('Ошибка', err.message || 'Ошибка получения местоположения');
                  }
                }}
              >
                <Text style={styles.locationButtonText}>Моё местоположение</Text>
              </TouchableOpacity>
            </View>
            {showMap && (
              <View style={styles.mapContainer}>
                <YandexMap
                  tasks={[]}
                  onTaskClick={() => {}}
                  selectedTask={null}
                  center={{ lat: formData.latitude, lon: formData.longitude }}
                  zoom={15}
                  onMapClick={async (lat, lon) => {
                    setFormData({
                      ...formData,
                      latitude: lat,
                      longitude: lon,
                    });
                    const address = await reverseGeocode(lat, lon);
                    if (address) {
                      setFormData(prev => ({ ...prev, address }));
                    }
                  }}
                  showClickMarker={true}
                />
              </View>
            )}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => setStep(2)}
              >
                <Text style={styles.buttonText}>Назад</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  (!formData.address || loading) && styles.buttonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!formData.address || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.buttonText}>Создать</Text>
                )}
              </TouchableOpacity>
            </View>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 24,
  },
  step: {
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
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
    flex: 1,
  },
  buttonSecondary: {
    backgroundColor: '#334155',
    marginRight: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  locationButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  locationButton: {
    flex: 1,
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  locationButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  mapContainer: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
});
