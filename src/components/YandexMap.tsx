import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { Task } from '../types';

interface YandexMapProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  selectedTask: Task | null;
  center?: { lat: number; lon: number };
  zoom?: number;
  onMapClick?: (lat: number, lon: number) => void;
  showClickMarker?: boolean;
}

const YANDEX_MAP_API_KEY = 'aedd8e59-be9c-4263-918c-f392f66a1445';

export default function YandexMap({
  tasks,
  onTaskClick,
  selectedTask,
  center = { lat: 55.7558, lon: 37.6173 },
  zoom = 12,
  onMapClick,
  showClickMarker = false,
}: YandexMapProps) {
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    // Обновляем маркеры при изменении задач или выбранной задачи
    if (webViewRef.current) {
      const script = `
        if (window.map && window.markers) {
          // Удаляем старые маркеры
          window.markers.forEach(marker => marker.map.geoObjects.remove(marker));
          window.markers = [];
          
          // Добавляем новые маркеры
          const tasks = ${JSON.stringify(tasks)};
          const selectedTaskId = ${selectedTask ? `"${selectedTask.id}"` : 'null'};
          
          tasks.forEach(task => {
            const marker = new ymaps.Placemark(
              [task.latitude, task.longitude],
              {
                balloonContent: task.title,
                iconCaption: task.budget + ' ₽',
              },
              {
                preset: selectedTaskId === task.id 
                  ? 'islands#blueDotIcon' 
                  : 'islands#redDotIcon',
              }
            );
            
            marker.events.add('click', () => {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'taskClick',
                taskId: task.id
              }));
            });
            
            window.map.geoObjects.add(marker);
            window.markers.push(marker);
          });
        }
      `;
      webViewRef.current.injectJavaScript(script);
    }
  }, [tasks, selectedTask]);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'taskClick') {
        const task = tasks.find(t => t.id === data.taskId);
        if (task) {
          onTaskClick(task);
        }
      } else if (data.type === 'mapClick' && onMapClick) {
        onMapClick(data.lat, data.lon);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script src="https://api-maps.yandex.ru/2.1/?apikey=${YANDEX_MAP_API_KEY}&lang=ru_RU" type="text/javascript"></script>
      <style>
        body, html {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
        }
        #map {
          width: 100%;
          height: 100%;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        ymaps.ready(function () {
          window.map = new ymaps.Map('map', {
            center: [${center.lat}, ${center.lon}],
            zoom: ${zoom},
            controls: ['zoomControl', 'fullscreenControl']
          });
          
          window.markers = [];
          
          const tasks = ${JSON.stringify(tasks)};
          const selectedTaskId = ${selectedTask ? `"${selectedTask.id}"` : 'null'};
          
          tasks.forEach(task => {
            const marker = new ymaps.Placemark(
              [task.latitude, task.longitude],
              {
                balloonContent: '<strong>' + task.title + '</strong><br/>' + 
                               task.budget + ' ₽<br/>' + 
                               task.address,
                iconCaption: task.budget + ' ₽',
              },
              {
                preset: selectedTaskId === task.id 
                  ? 'islands#blueDotIcon' 
                  : 'islands#redDotIcon',
              }
            );
            
            marker.events.add('click', function () {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'taskClick',
                taskId: task.id
              }));
            });
            
            window.map.geoObjects.add(marker);
            window.markers.push(marker);
          });
          
          ${showClickMarker ? `
          window.map.events.add('click', function (e) {
            const coords = e.get('coords');
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'mapClick',
              lat: coords[0],
              lon: coords[1]
            }));
          });
          ` : ''}
        });
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        style={styles.webview}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: '#1e293b',
  },
});
