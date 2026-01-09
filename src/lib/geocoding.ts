import * as Location from 'expo-location'

export interface GeocodeResult {
  lat: number
  lon: number
  formattedAddress: string
}

// Геокодинг адреса через Yandex Geocoding API (можно использовать бесплатный API ключ)
// Для мобильного приложения лучше использовать сервис геокодинга
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  try {
    // Используем Yandex Geocoding API
    const YANDEX_GEOCODE_API = 'https://geocode-maps.yandex.ru/1.x/'
    const API_KEY = 'aedd8e59-be9c-4263-918c-f392f66a1445'
    
    const response = await fetch(
      `${YANDEX_GEOCODE_API}?apikey=${API_KEY}&geocode=${encodeURIComponent(address)}&format=json`
    )
    
    const data = await response.json()
    
    if (data.response?.GeoObjectCollection?.featureMember?.[0]) {
      const geoObject = data.response.GeoObjectCollection.featureMember[0].GeoObject
      const coords = geoObject.Point.pos.split(' ').map(Number)
      
      return {
        lat: coords[1], // Широта
        lon: coords[0], // Долгота
        formattedAddress: geoObject.metaDataProperty.GeocoderMetaData.text,
      }
    }
    
    return null
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}

// Обратный геокодинг (координаты -> адрес)
export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const YANDEX_GEOCODE_API = 'https://geocode-maps.yandex.ru/1.x/'
    const API_KEY = 'aedd8e59-be9c-4263-918c-f392f66a1445'
    
    const response = await fetch(
      `${YANDEX_GEOCODE_API}?apikey=${API_KEY}&geocode=${lon},${lat}&format=json`
    )
    
    const data = await response.json()
    
    if (data.response?.GeoObjectCollection?.featureMember?.[0]) {
      const geoObject = data.response.GeoObjectCollection.featureMember[0].GeoObject
      return geoObject.metaDataProperty.GeocoderMetaData.text
    }
    
    return null
  } catch (error) {
    console.error('Reverse geocoding error:', error)
    return null
  }
}

// Получить текущее местоположение
export async function getCurrentLocation(): Promise<{ lat: number; lon: number } | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') {
      console.log('Permission to access location was denied, using default location')
      return null
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    })
    return {
      lat: location.coords.latitude,
      lon: location.coords.longitude,
    }
  } catch (error) {
    console.log('Error getting location:', error)
    return null
  }
}
