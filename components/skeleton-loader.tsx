'use client'

import { cn } from '@/lib/utils'

// Скелетон для карточки запроса
export function RequestCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('bg-white rounded-lg border border-gray-200 p-6 animate-pulse', className)}>
      <div className="space-y-4">
        {/* Заголовок */}
        <div className="space-y-2">
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>

        {/* Бейджи */}
        <div className="flex gap-2">
          <div className="h-6 bg-gray-200 rounded-full w-20"></div>
          <div className="h-6 bg-gray-200 rounded-full w-24"></div>
          <div className="h-6 bg-gray-200 rounded-full w-16"></div>
        </div>

        {/* Описание */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>

        {/* Метаданные */}
        <div className="flex items-center gap-4">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </div>

        {/* Кнопка */}
        <div className="h-10 bg-gray-200 rounded w-full"></div>
      </div>
    </div>
  )
}

// Скелетон для списка запросов
export function RequestListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <RequestCardSkeleton key={i} />
      ))}
    </div>
  )
}

// Скелетон для плиток категорий
export function CategoryTilesSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-gray-50 rounded-2xl p-8 animate-pulse">
          <div className="flex flex-col items-center space-y-4">
            <div className="h-24 w-24 bg-gray-200 rounded-xl"></div>
            <div className="h-5 bg-gray-200 rounded w-20"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Скелетон для профиля
export function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="grid gap-8 md:grid-cols-[300px_1fr]">
          {/* Аватар */}
          <div className="h-fit space-y-6 rounded-2xl bg-white p-6 shadow-sm border border-gray-100 animate-pulse">
            <div className="flex flex-col items-center space-y-4">
              <div className="h-32 w-32 bg-gray-200 rounded-full"></div>
              <div className="h-6 bg-gray-200 rounded w-32"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
          </div>

          {/* Форма */}
          <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100 animate-pulse">
            <div className="space-y-6">
              <div className="h-8 bg-gray-200 rounded w-48"></div>
              <div className="space-y-4">
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-24 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Скелетон для карты
export function MapSkeleton() {
  return (
    <div className="w-full h-[600px] rounded-lg border border-gray-200 bg-gray-100 animate-pulse flex items-center justify-center">
      <div className="text-center">
        <div className="h-12 w-12 border-4 border-gray-300 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Загрузка карты...</p>
      </div>
    </div>
  )
}


