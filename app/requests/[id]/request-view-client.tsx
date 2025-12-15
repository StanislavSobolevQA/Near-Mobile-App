'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createOffer, getRequestContact, closeRequest } from '@/app/actions/requests'
import { Clock, MapPin, User, CheckCircle, MessageCircle, Copy } from 'lucide-react'
import type { Request } from '@/lib/types'

function formatTimeAgo(date: string): string {
  const now = new Date()
  const dateObj = new Date(date)
  const diffMs = now.getTime() - dateObj.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) return `${diffMins} мин назад`
  if (diffHours < 24) return `${diffHours} ч назад`
  return `${diffDays} дн назад`
}

interface RequestViewClientProps {
  request: any
  offers: any[]
  isAuthor: boolean
  userId?: string
}

export function RequestViewClient({ request, offers, isAuthor, userId }: RequestViewClientProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [contact, setContact] = useState<{ contact_type: string; contact_value: string } | null>(null)
  const [loadingContact, setLoadingContact] = useState(false)

  const handleRespond = async () => {
    setIsLoading(true)
    try {
      await createOffer(request.id)
      const contactData = await getRequestContact(request.id)
      setContact(contactData)
      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Ошибка при отклике')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGetContact = async () => {
    setLoadingContact(true)
    try {
      const contactData = await getRequestContact(request.id)
      setContact(contactData)
    } catch (error) {
      alert('Не удалось получить контакт')
    } finally {
      setLoadingContact(false)
    }
  }

  const handleClose = async () => {
    if (!confirm('Закрыть этот запрос?')) return

    setIsLoading(true)
    try {
      await closeRequest(request.id)
      router.push('/dashboard/requests')
    } catch (error) {
      alert('Ошибка при закрытии запроса')
    } finally {
      setIsLoading(false)
    }
  }

  const urgencyLabels: Record<string, string> = {
    'today': 'Сегодня',
    'tomorrow': 'Завтра',
    'week': 'На неделе',
    'not-urgent': 'Не срочно'
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          ← Назад
        </Button>

        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{request.title}</h1>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="outline">{request.category}</Badge>
                <Badge variant="secondary">{urgencyLabels[request.urgency] || request.urgency}</Badge>
                <Badge variant="default">
                  {request.reward_type === 'money'
                    ? `${request.reward_amount} ₽`
                    : 'Спасибо'}
                </Badge>
                <Badge
                  variant={
                    request.status === 'open'
                      ? 'default'
                      : request.status === 'in_progress'
                      ? 'secondary'
                      : 'outline'
                  }
                >
                  {request.status === 'open'
                    ? 'Открыт'
                    : request.status === 'in_progress'
                    ? 'В работе'
                    : 'Закрыт'}
                </Badge>
              </div>
            </div>
          </div>

          <div className="prose max-w-none mb-6">
            <p className="text-gray-700 text-lg leading-relaxed">{request.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="h-5 w-5" />
              <span className="font-medium">Район:</span>
              <span>{request.district}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="h-5 w-5" />
              <span className="font-medium">Опубликовано:</span>
              <span>{formatTimeAgo(request.created_at)}</span>
            </div>
            {request.profiles && (
              <div className="flex items-center gap-2 text-gray-600">
                <User className="h-5 w-5" />
                <span className="font-medium">Автор:</span>
                <span>{request.profiles.display_name || 'Аноним'}</span>
              </div>
            )}
          </div>

          {isAuthor ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-3">Отклики ({offers.length})</h3>
                {offers.length === 0 ? (
                  <p className="text-gray-600">Пока нет откликов</p>
                ) : (
                  <div className="space-y-2">
                    {offers.map((offer: any) => (
                      <div
                        key={offer.id}
                        className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {offer.profiles?.display_name || 'Аноним'}
                            </p>
                            <p className="text-sm text-gray-600">
                              Откликнулся {formatTimeAgo(offer.created_at)}
                            </p>
                          </div>
                          {offer.profiles?.telegram && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                window.open(
                                  `https://t.me/${offer.profiles.telegram.replace('@', '')}`,
                                  '_blank'
                                )
                              }
                            >
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Telegram
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {request.status !== 'closed' && (
                <Button onClick={handleClose} variant="outline" disabled={isLoading}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Закрыть запрос
                </Button>
              )}
            </div>
          ) : userId && request.status === 'open' ? (
            <div className="space-y-4">
              {contact ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="font-semibold mb-2">Контакт автора:</p>
                  <p className="text-lg mb-3">
                    {contact.contact_type === 'telegram' ? 'Telegram' : 'Телефон'}:{' '}
                    {contact.contact_value}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => navigator.clipboard.writeText(contact.contact_value)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Копировать
                    </Button>
                    {contact.contact_type === 'telegram' && (
                      <Button
                        variant="outline"
                        onClick={() =>
                          window.open(
                            `https://t.me/${contact.contact_value.replace('@', '')}`,
                            '_blank'
                          )
                        }
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Открыть Telegram
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <Button onClick={handleRespond} disabled={isLoading} className="w-full">
                  {isLoading ? 'Обработка...' : 'Откликнуться на запрос'}
                </Button>
              )}
            </div>
          ) : !userId ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 mb-3">
                Войдите, чтобы откликнуться на этот запрос
              </p>
              <Button asChild>
                <a href="/login">Войти</a>
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

