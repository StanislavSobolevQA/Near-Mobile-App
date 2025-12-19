'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, MapPin, MessageCircle } from 'lucide-react'
import { getRequestContact } from '@/app/actions/requests'
import { toast } from 'sonner'
import { useState } from 'react'
import Link from 'next/link'

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

interface MyOffersClientProps {
  initialOffers: any[]
}

export function MyOffersClient({ initialOffers }: MyOffersClientProps) {
  const [loadingContact, setLoadingContact] = useState<string | null>(null)
  const [contacts, setContacts] = useState<Record<string, { contact_type: string; contact_value: string }>>({})

  const handleGetContact = async (requestId: string) => {
    if (contacts[requestId]) return

    setLoadingContact(requestId)
    try {
      const contact = await getRequestContact(requestId)
      if (contact) {
        setContacts((prev) => ({ ...prev, [requestId]: contact as { contact_type: string; contact_value: string } }))
        toast.success('Контакт получен')
      } else {
        throw new Error('Contact not found')
      }
    } catch (error) {
      toast.error('Не удалось получить контакт. Убедитесь, что вы откликнулись на запрос.')
      console.error('Error getting contact:', error)
    } finally {
      setLoadingContact(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Мои отклики</h1>

        {initialOffers.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-600 mb-4">У вас пока нет откликов</p>
            <Button asChild>
              <Link href="/dashboard">Найти запросы</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {initialOffers.map((offer: any) => {
              const request = offer.requests
              if (!request) return null

              const contact = contacts[request.id]

              return (
                <div
                  key={offer.id}
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{request.title}</h3>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="outline">{request.category}</Badge>
                        <Badge
                          variant={request.status === 'closed' ? 'secondary' : 'default'}
                        >
                          {request.status === 'open' ? 'Открыт' : request.status === 'in_progress' ? 'В работе' : 'Закрыт'}
                        </Badge>
                        <Badge variant="default">
                          {request.reward_type === 'money'
                            ? `${request.reward_amount} ₽`
                            : 'Спасибо'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-4">{request.description}</p>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{request.district}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>Отклик: {formatTimeAgo(offer.created_at)}</span>
                    </div>
                  </div>

                  {contact ? (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <p className="text-sm font-semibold mb-2">Контакт:</p>
                      <p className="text-lg">
                        {contact.contact_type === 'telegram' ? 'Telegram' : 'Телефон'}: {contact.contact_value}
                      </p>
                      {contact.contact_type === 'telegram' && (
                        <Button
                          variant="outline"
                          className="mt-2"
                          onClick={() => window.open(`https://t.me/${contact.contact_value.replace('@', '')}`, '_blank')}
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Открыть Telegram
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => handleGetContact(request.id)}
                      disabled={loadingContact === request.id}
                    >
                      {loadingContact === request.id ? 'Загрузка...' : 'Получить контакт'}
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

