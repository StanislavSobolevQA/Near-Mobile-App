'use client'

import { useEffect, useRef, useState } from 'react'

interface Request {
  id: string
  type: 'need' | 'offer'
  title: string
  category: string
  urgency: string
  reward: 'thanks' | 'money'
  amount?: number
  location: string
  district: string
  lat?: number
  lng?: number
  createdAt: Date
  description: string
}

interface YandexMapProps {
  requests: Request[]
  center?: [number, number]
  zoom?: number
}

// Координаты для районов (примерные для Москвы, можно настроить под ваш город)
const getCoordinates = (district: string, index: number): [number, number] => {
  const baseCoords: Record<string, [number, number]> = {
    'Центральный': [55.7558, 37.6173], // Москва, центр
    'Северный': [55.8358, 37.6173],   // Москва, север
    'Южный': [55.6758, 37.6173],      // Москва, юг
    'Восточный': [55.7558, 37.7773],  // Москва, восток
    'Западный': [55.7558, 37.4573],   // Москва, запад
    'Все районы': [55.7558, 37.6173], // Москва, центр
  }
  
  const base = baseCoords[district] || [55.7558, 37.6173]
  // Добавляем небольшое случайное смещение для разных задач в одном районе
  const offset = (index % 5) * 0.005 - 0.01
  return [
    base[0] + offset,
    base[1] + offset
  ]
}

export function YandexMap({ requests, center = [55.7558, 37.6173], zoom = 11 }: YandexMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [ymaps, setYmaps] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Загрузка Яндекс карт
    if (typeof window === 'undefined') return
    
    // Таймаут для лоадера (если карта не загрузится за 10 секунд)
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        setError('Карта загружается слишком долго. Попробуйте обновить страницу.')
        setIsLoading(false)
      }
    }, 10000)
    
    // Проверяем, не загружен ли уже скрипт
    const existingScript = document.querySelector('script[src*="api-maps.yandex.ru"]')
    
    if (existingScript) {
      // Скрипт уже есть, ждем загрузки
      if (window.ymaps) {
        window.ymaps.ready(() => {
          setYmaps(window.ymaps)
          setIsLoading(false)
          clearTimeout(timeoutId)
        })
      } else {
        const checkYmaps = setInterval(() => {
          if (window.ymaps) {
            window.ymaps.ready(() => {
              setYmaps(window.ymaps)
              setIsLoading(false)
              clearInterval(checkYmaps)
              clearTimeout(timeoutId)
            })
          }
        }, 100)
        
        // Очистка через 10 секунд
        setTimeout(() => {
          clearInterval(checkYmaps)
        }, 10000)
      }
      return () => clearTimeout(timeoutId)
    }
    
    // Создаем новый скрипт
    // Примечание: для использования API ключа добавьте &apikey=YOUR_API_KEY
    // Получить ключ можно на https://developer.tech.yandex.ru/
    const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY
    const script = document.createElement('script')
    script.src = apiKey 
      ? `https://api-maps.yandex.ru/2.1/?lang=ru_RU&apikey=${apiKey}`
      : 'https://api-maps.yandex.ru/2.1/?lang=ru_RU'
    script.async = true
    
    script.onload = () => {
      // Даем время на инициализацию ymaps
      let attempts = 0
      const maxAttempts = 20 // 2 секунды максимум
      
      const checkYmaps = setInterval(() => {
        attempts++
        if (window.ymaps) {
          clearInterval(checkYmaps)
          window.ymaps.ready(() => {
            setYmaps(window.ymaps)
            setIsLoading(false)
            clearTimeout(timeoutId)
          })
        } else if (attempts >= maxAttempts) {
          clearInterval(checkYmaps)
          setError('Яндекс.Карты не загрузились. Попробуйте обновить страницу.')
          setIsLoading(false)
          clearTimeout(timeoutId)
        }
      }, 100)
    }
    
    script.onerror = () => {
      setError('Не удалось загрузить Яндекс.Карты. Проверьте подключение к интернету.')
      setIsLoading(false)
      clearTimeout(timeoutId)
      console.error('Failed to load Yandex Maps')
    }
    
    document.head.appendChild(script)
    
    return () => {
      clearTimeout(timeoutId)
    }
  }, [isLoading])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!ymaps || !mapRef.current) return
    
    // Если карта уже создана, не создаем заново
    if (map) return

    // Проверяем, что контейнер существует и имеет размеры
    if (!mapRef.current || mapRef.current.offsetWidth === 0) {
      // Ждем, пока контейнер получит размеры
      const checkSize = setInterval(() => {
        if (mapRef.current && mapRef.current.offsetWidth > 0) {
          clearInterval(checkSize)
          initializeMap()
        }
      }, 100)
      
      setTimeout(() => clearInterval(checkSize), 5000)
      return
    }

    initializeMap()

    function initializeMap() {
      try {
        if (!mapRef.current || !ymaps) return
        
        const newMap = new ymaps.Map(mapRef.current, {
          center: center,
          zoom: zoom,
          controls: ['zoomControl', 'fullscreenControl']
        })

        // Устанавливаем карту сразу
        setMap(newMap)
        setIsLoading(false)

        // Обработка ошибок карты
        newMap.events.add('error', (e: any) => {
          console.error('Map error:', e)
          setError('Ошибка при загрузке карты')
          setIsLoading(false)
        })

        // Обработка успешной загрузки тайлов
        newMap.events.add('tilesload', () => {
          setIsLoading(false)
        })

      } catch (error) {
        console.error('Error creating Yandex Map:', error)
        setError('Ошибка при создании карты. Попробуйте обновить страницу.')
        setIsLoading(false)
      }
    }
  }, [ymaps, center, zoom, map])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!map || !ymaps) return

    try {
      // Очищаем старые маркеры
      map.geoObjects.removeAll()

      // Добавляем маркеры для каждой задачи
      requests.forEach((request, index) => {
        const [lat, lng] = request.lat && request.lng 
          ? [request.lat, request.lng]
          : getCoordinates(request.district, index)

        const iconColor = request.type === 'need' ? '#dc2626' : '#059669'

        const placemark = new ymaps.Placemark(
          [lat, lng],
          {
            balloonContentHeader: `<div style="font-weight: 600; font-size: 16px; margin-bottom: 8px; color: #111827;">${request.title}</div>`,
            balloonContentBody: `
              <div style="margin-bottom: 12px;">
                <div style="margin-bottom: 6px; font-size: 14px;"><strong>Категория:</strong> <span style="color: #4b5563;">${request.category}</span></div>
                <div style="margin-bottom: 6px; font-size: 14px;"><strong>Район:</strong> <span style="color: #4b5563;">${request.district}</span></div>
                <div style="margin-bottom: 6px; font-size: 14px;"><strong>Вознаграждение:</strong> <span style="color: #059669; font-weight: 600;">${
                  request.reward === 'money' ? `${request.amount} ₽` : 'Спасибо'
                }</span></div>
              </div>
              <div style="color: #6b7280; font-size: 14px; margin-bottom: 12px; line-height: 1.5;">${request.description.substring(0, 150)}${request.description.length > 150 ? '...' : ''}</div>
              <a href="/requests/${request.id}" style="display: inline-block; padding: 8px 16px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500; transition: background 0.2s;" onmouseover="this.style.background='#2563eb'" onmouseout="this.style.background='#3b82f6'">Подробнее →</a>
            `,
            balloonContentFooter: `<div style="font-size: 12px; color: #9ca3af; margin-top: 8px;">${new Date(request.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</div>`,
            hintContent: request.title
          },
          {
            preset: 'islands#circleIcon',
            iconColor: iconColor,
            iconImageSize: [32, 32],
            iconImageOffset: [-16, -16]
          }
        )

        map.geoObjects.add(placemark)
      })

      // Если есть задачи, центрируем карту на них
      if (requests.length > 0) {
        const bounds = requests.map((req, idx) => {
          const [lat, lng] = req.lat && req.lng 
            ? [req.lat, req.lng]
            : getCoordinates(req.district, idx)
          return [lat, lng] as [number, number]
        })

        if (bounds.length > 0 && ymaps.util && ymaps.util.bounds) {
          map.setBounds(ymaps.util.bounds.fromPoints(bounds), {
            checkZoomRange: true,
            duration: 300
          })
        }
      }
    } catch (error) {
      console.error('Error adding markers to map:', error)
    }
  }, [map, ymaps, requests])

  if (error) {
    return (
      <div className="w-full h-[600px] rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="text-red-500 mb-2 text-4xl">⚠️</div>
          <p className="text-gray-700 font-medium mb-2">{error}</p>
          <p className="text-sm text-gray-500 mb-4">
            Карта временно недоступна. Задачи можно просмотреть в списке ниже.
          </p>
          <button
            onClick={() => {
              setError(null)
              setIsLoading(true)
              window.location.reload()
            }}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
          >
            Обновить страницу
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border border-gray-200 relative">
      {isLoading && (
        <div className="absolute inset-0 bg-gray-50 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 mb-2">Загрузка карты...</p>
            <p className="text-xs text-gray-400">Это может занять несколько секунд</p>
          </div>
        </div>
      )}
      <div 
        ref={mapRef} 
        className="w-full h-[600px] bg-gray-100"
        style={{ minHeight: '600px', width: '100%' }}
      />
      {!isLoading && !map && !error && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <p className="text-gray-500">Инициализация карты...</p>
        </div>
      )}
    </div>
  )
}

// Расширяем Window для TypeScript
declare global {
  interface Window {
    ymaps: any
  }
}

