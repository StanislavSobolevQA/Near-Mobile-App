import { getRequests } from '@/app/actions/requests'
import { sanitizeRequests } from '@/lib/utils'
import { HomeClient } from './page-client'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

// ISR: обновление каждые 60 секунд
export const revalidate = 60

export default async function HomePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Загружаем открытые запросы для главной страницы
  try {
    logger.info('Loading requests for home page', { userId: user?.id || 'anonymous', isAuthenticated: !!user })
    const requests = await getRequests(undefined, 'open') // Только открытые запросы
    
    // Удаляем contact_value для безопасности (не передаем в клиентский компонент)
    const rawRequests = Array.isArray(requests) ? requests : requests.data || []
    // Дополнительная фильтрация: оставляем только открытые запросы (исключаем закрытые и в работе)
    const openRequests = rawRequests.filter((req: any) => req.status === 'open')
    const safeRequests = sanitizeRequests(openRequests)
    
    // Всегда логируем результат (важно для диагностики)
    logger.info('Home page loaded requests', { 
      count: safeRequests.length, 
      userId: user?.id || 'anonymous',
      isAuthenticated: !!user,
      rawRequestsCount: Array.isArray(requests) ? requests.length : requests.data?.length || 0
    })
    
    // Если запросов нет, но пользователь авторизован - это может быть проблемой
    if (safeRequests.length === 0 && user) {
      logger.warn('No requests found for authenticated user on home page')
    }
    
    return <HomeClient initialRequests={safeRequests} user={user} />
  } catch (error) {
    logger.error('Error loading requests on home page', error, { 
      userId: user?.id || 'anonymous',
      isAuthenticated: !!user,
      errorType: error instanceof Error ? error.constructor.name : typeof error
    })
    // Возвращаем пустой массив если ошибка (таблицы еще не созданы)
    return <HomeClient initialRequests={[]} user={user} />
  }
}
