'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { createOffer, getRequestContact, closeRequest, getRequestById } from '@/app/actions/requests'
import { Clock, MapPin, User, CheckCircle, MessageCircle, Copy, ArrowRight, Shield, Zap, Info } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
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

export function RequestViewClient({ request, offers: initialOffers, isAuthor, userId }: RequestViewClientProps) {
  const router = useRouter()
  const [offers, setOffers] = useState(initialOffers)
  const [isLoading, setIsLoading] = useState(false)
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false)
  const [contact, setContact] = useState<{ contact_type: string; contact_value: string } | null>(null)
  const [loadingContact, setLoadingContact] = useState(false)

  const handleRespond = async () => {
    setIsLoading(true)
    try {
      const result = await createOffer(request.id)
      
      if (!result.success) {
        const errorMessages: Record<string, string> = {
          'ALREADY_OFFERED': 'Вы уже откликнулись на этот запрос',
          'CANNOT_OFFER_OWN_REQUEST': 'Вы не можете откликнуться на свой запрос',
          'REQUEST_CLOSED': 'Этот запрос уже закрыт',
          'REQUEST_NOT_FOUND': 'Запрос не найден'
        }
        const message = result.message || errorMessages[result.error || ''] || 'Ошибка при отклике'
        toast.error(message)
        return
      }

      // Получаем контакты после успешного отклика
      const contactData = await getRequestContact(request.id)
      if (contactData) {
        setContact(contactData)
      }
      setIsOfferDialogOpen(false)
      router.refresh()
      toast.success('Отклик успешно отправлен!')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при отклике'
      toast.error(errorMessage)
      console.error('Error creating offer:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = async () => {
    if (!confirm('Вы уверены, что хотите закрыть этот запрос?')) return

    setIsLoading(true)
    try {
      const result = await closeRequest(request.id)
      if (result.success) {
        toast.success('Запрос успешно закрыт')
        router.push('/dashboard/requests')
      } else {
        toast.error(result.error || 'Ошибка при закрытии запроса')
      }
    } catch (error) {
      toast.error('Ошибка при закрытии запроса')
      console.error('Error closing request:', error)
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
  const urgencyColors: Record<string, "destructive" | "default" | "secondary" | "outline"> = {
    'today': 'destructive',
    'tomorrow': 'default',
    'week': 'secondary',
    'not-urgent': 'outline'
  }

  // Check if user already offered (client-side approximation or implicit via contact check?)
  // Ideally, we'd check `offers` if available or some `hasOffered` prop, but for now we can try to fetch contact if we suspect.
  // Actually, simplified mechanism: if not author and logged in, maybe we check if we can see contact.
  // We can add a "Check Contact" button if we previously offered.
  // But let's keep it simple: "Offer Help" -> (Server checks/creates) -> Returns contact.

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6 hover:bg-gray-200 transition-colors">
          ← Назад к списку
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-8">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 leading-tight">{request.title}</h1>
                    <div className="flex items-center text-gray-500 text-sm mb-4">
                      <Clock className="h-4 w-4 mr-1" />
                      {formatTimeAgo(request.created_at)}
                      <span className="mx-2">•</span>
                      {request.category}
                    </div>
                  </div>
                  {request.status !== 'open' && (
                    <Badge variant={request.status === 'closed' ? 'secondary' : 'default'} className="text-sm px-3 py-1">
                      {request.status === 'closed' ? 'Закрыто' : 'В работе'}
                    </Badge>
                  )}
                </div>

                <div className="prose max-w-none text-gray-700 leading-relaxed mb-8">
                  {request.description}
                </div>

                <div className="flex flex-wrap gap-4 py-6 border-t border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Район</p>
                      <p className="font-semibold text-gray-900">{request.district}</p>
                    </div>
                  </div>
                  <div className="w-px h-10 bg-gray-200 hidden sm:block"></div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                      <Zap className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Срочность</p>
                      <Badge variant={urgencyColors[request.urgency]} className="mt-0.5">
                        {urgencyLabels[request.urgency]}
                      </Badge>
                    </div>
                  </div>
                  <div className="w-px h-10 bg-gray-200 hidden sm:block"></div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-50 rounded-lg text-green-600">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Вознаграждение</p>
                      <p className="font-semibold text-gray-900">
                        {request.reward_type === 'money' ? `${request.reward_amount} ₽` : 'Благодарность'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-3 pt-4">
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {request.profiles?.display_name || 'Пользователь'}
                    </p>
                    <p className="text-xs text-gray-500">Автор запроса</p>
                  </div>
                </div>
              </div>
            </div>

            {isAuthor && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Отклики ({offers.length})</h2>
                {offers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>Пока никто не откликнулся</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {offers.map((offer: any) => (
                      <div key={offer.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-all">
                        <div className="mb-4 sm:mb-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900">{offer.profiles?.display_name || 'Аноним'}</span>
                            <span className="text-gray-400 text-sm">• {formatTimeAgo(offer.created_at)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs font-normal">
                              Готов помочь
                            </Badge>
                          </div>
                        </div>
                        {offer.profiles?.telegram && (
                          <Button
                            size="sm"
                            className="bg-[#24A1DE] hover:bg-[#24A1DE]/90 text-white shadow-sm"
                            onClick={() => window.open(`https://t.me/${offer.profiles.telegram.replace('@', '')}`, '_blank')}
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Написать в Telegram
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar / Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sticky top-24">
              {request.status === 'open' ? (
                isAuthor ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg text-blue-800 text-sm">
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 mt-0.5" />
                        <p>Это ваш запрос. Вы будете получать уведомления о новых откликах.</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      onClick={handleClose}
                      disabled={isLoading}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Закрыть запрос (выполнено)
                    </Button>
                  </div>
                ) : userId ? (
                  <div className="space-y-6">
                    {contact ? (
                      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4 text-center">
                          <p className="text-sm text-green-800 mb-1 font-medium">Контактные данные:</p>
                          <p className="text-xl font-bold text-gray-900 mb-3 select-all">
                            {contact.contact_value}
                          </p>
                          <div className="grid grid-cols-1 gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(contact.contact_value)
                                toast.success('Скопировано!')
                              }}
                              className="w-full"
                            >
                              <Copy className="h-3 w-3 mr-2" />
                              Копировать
                            </Button>
                            {contact.contact_type === 'telegram' && (
                              <Button
                                size="sm"
                                className="w-full bg-[#24A1DE] hover:bg-[#24A1DE]/90 text-white"
                                onClick={() => window.open(`https://t.me/${contact.contact_value.replace('@', '')}`, '_blank')}
                              >
                                <MessageCircle className="h-3 w-3 mr-2" />
                                Открыть Telegram
                              </Button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 text-center">
                          Не забудьте сказать, что вы от сервиса "Рядом"
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <h3 className="font-semibold text-gray-900">Готовы помочь?</h3>
                          <p className="text-sm text-gray-600">
                            Автор увидит, что вы откликнулись. Мы покажем вам контакты для связи.
                          </p>
                        </div>
                        <Button
                          className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg text-white font-medium py-6"
                          onClick={() => setIsOfferDialogOpen(true)}
                          disabled={isLoading}
                        >
                          Откликнуться
                          <ArrowRight className="h-5 w-5 ml-2" />
                        </Button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="bg-gray-100 rounded-full h-12 w-12 flex items-center justify-center mx-auto">
                      <User className="h-6 w-6 text-gray-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Войдите в аккаунт</h3>
                      <p className="text-sm text-gray-500 mt-1">Чтобы увидеть контакты и предложить помощь, необходимо авторизоваться.</p>
                    </div>
                    <Button asChild className="w-full" variant="default">
                      <Link href="/login">Войти или создать аккаунт</Link>
                    </Button>
                  </div>
                )
              ) : (
                <div className="p-4 bg-gray-100 rounded-lg text-center text-gray-500">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="font-medium">Запрос закрыт</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isOfferDialogOpen} onOpenChange={setIsOfferDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Предложить помощь</DialogTitle>
            <DialogDescription>
              Мы уведомим автора о вашем желании помочь. После этого вам откроются его контакты.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg dark:bg-yellow-900/10">
              <Shield className="h-5 w-5 text-yellow-600 mt-0.5" />
              <p className="text-sm text-yellow-700">
                Пожалуйста, будьте вежливы и осторожны. Договаривайтесь о деталях и оплате напрямую с автором.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOfferDialogOpen(false)}>Отмена</Button>
            <Button onClick={handleRespond} disabled={isLoading} className="bg-primary text-white">
              {isLoading ? 'Отправка...' : 'Подтвердить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

