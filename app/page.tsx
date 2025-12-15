import { getRequests } from '@/app/actions/requests'
import { HomeClient } from './page-client'

export default async function HomePage() {
  // Загружаем открытые запросы для главной страницы
  try {
    const requests = await getRequests()
    return <HomeClient initialRequests={requests as any} />
  } catch (error) {
    console.error('Error loading requests:', error)
    // Возвращаем пустой массив если ошибка (таблицы еще не созданы)
    return <HomeClient initialRequests={[]} />
  }
}
