'use client'

import { useState, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/navbar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Plus, Search, Clock, MapPin, Heart } from 'lucide-react'
import { createRequest, createOffer } from '@/app/actions/requests'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { SafeRequest } from '@/lib/types'

type Category = 'уборка' | 'ремонт' | 'доставка' | 'уход' | 'другое'
type Urgency = 'today' | 'tomorrow' | 'week' | 'not-urgent'
type RewardType = 'thanks' | 'money'
type ContactType = 'telegram' | 'phone'

const categories: Category[] = ['уборка', 'ремонт', 'доставка', 'уход', 'другое']
const districts = ['Все районы', 'Центральный', 'Северный', 'Южный', 'Восточный', 'Западный']
const urgencyLabels: Record<Urgency, string> = {
  'today': 'Сегодня',
  'tomorrow': 'Завтра',
  'week': 'На неделе',
  'not-urgent': 'Не срочно'
}

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

interface DashboardClientProps {
  initialRequests: SafeRequest[]
  initialMyOffers?: SafeRequest[]
  userOfferIds?: string[]
  userDistrict?: string
}

export function DashboardClient({ initialRequests, initialMyOffers = [], userOfferIds = [], userDistrict }: DashboardClientProps) {
  const router = useRouter()
  const [selectedDistrict, setSelectedDistrict] = useState(userDistrict || 'Все районы')
  const [activeTab, setActiveTab] = useState<'need' | 'offer'>('need')
  const [requests, setRequests] = useState<SafeRequest[]>(initialRequests)
  const [myOffers, setMyOffers] = useState<SafeRequest[]>(initialMyOffers)
  const [userOffersSet, setUserOffersSet] = useState<Set<string>>(new Set(userOfferIds))
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingContact, setIsLoadingContact] = useState(false)

  // Фильтры
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all')
  const [onlyPaid, setOnlyPaid] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Форма создания запроса
  const [formData, setFormData] = useState({
    category: '' as Category | '',
    title: '',
    description: '',
    urgency: 'not-urgent' as Urgency,
    reward: 'thanks' as RewardType,
    amount: '',
    contactType: 'telegram' as ContactType,
    contactValue: '',
  })

  // Фильтрация запросов для таба "Нужна помощь"
  const filteredRequests = useMemo(() => {
    const source = activeTab === 'need' ? requests : myOffers
    return source.filter(req => {
      if (selectedDistrict !== 'Все районы' && req.district !== selectedDistrict) return false
      if (categoryFilter !== 'all' && req.category !== categoryFilter) return false
      if (urgencyFilter !== 'all' && req.urgency !== urgencyFilter) return false
      if (onlyPaid && req.reward_type !== 'money') return false
      if (searchQuery && !req.title.toLowerCase().includes(searchQuery.toLowerCase()) && !req.description.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
  }, [requests, myOffers, activeTab, selectedDistrict, categoryFilter, urgencyFilter, onlyPaid, searchQuery])

  const handleCreateRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Валидация обязательных полей
    if (!formData.category || !formData.title || !formData.description || !formData.contactValue) {
      toast.error('Заполните все обязательные поля')
      return
    }

    // Валидация суммы вознаграждения
    if (formData.reward === 'money') {
      const amount = Number(formData.amount)
      if (isNaN(amount) || amount <= 0) {
        toast.error('Укажите корректную сумму больше 0')
        return
      }
      if (amount > 1000000) {
        toast.error('Сумма не может превышать 1 000 000 ₽')
        return
      }
    }

    // Валидация длины полей
    if (formData.title.length < 5 || formData.title.length > 100) {
      toast.error('Заголовок должен быть от 5 до 100 символов')
      return
    }

    if (formData.description.length < 10 || formData.description.length > 2000) {
      toast.error('Описание должно быть от 10 до 2000 символов')
      return
    }

    setIsLoading(true)
    try {
      const newRequest = await createRequest({
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        urgency: formData.urgency,
        reward_type: formData.reward,
        reward_amount: formData.reward === 'money' ? Number(formData.amount) : null,
        district: selectedDistrict === 'Все районы' ? 'Центральный' : selectedDistrict,
        contact_type: formData.contactType,
        contact_value: formData.contactValue.trim(),
      })

      // Обновляем список и перенаправляем
      // Удаляем contact_value для безопасности перед добавлением в состояние
      const { contact_value, ...safeRequest } = newRequest as any
      setRequests([safeRequest as SafeRequest, ...requests])
      setIsCreateDialogOpen(false)
      router.refresh()
      toast.success('Запрос успешно создан!')
      setFormData({
        category: '' as Category | '',
        title: '',
        description: '',
        urgency: 'not-urgent',
        reward: 'thanks',
        amount: '',
        contactType: 'telegram',
        contactValue: '',
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при создании запроса'
      toast.error(errorMessage)
      console.error('Error creating request:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRespond = async (request: SafeRequest) => {
    setIsLoadingContact(true)
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

      // Обновляем состояние - добавляем ID в множество откликов
      setUserOffersSet(prev => new Set([...prev, request.id]))
      
      // Если это таб "Могу помочь", обновляем список
      if (activeTab === 'offer') {
        router.refresh()
      }
      
      toast.success('Отклик успешно отправлен!')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при отклике'
      toast.error(errorMessage)
      console.error('Error creating offer:', error)
    } finally {
      setIsLoadingContact(false)
    }
  }


  const activeFiltersCount = [
    categoryFilter !== 'all',
    urgencyFilter !== 'all',
    onlyPaid,
    searchQuery.length > 0
  ].filter(Boolean).length

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        selectedDistrict={selectedDistrict}
        onDistrictChange={setSelectedDistrict}
        onCreateRequest={() => setIsCreateDialogOpen(true)}
      />
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'need' | 'offer')} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="need">Нужна помощь</TabsTrigger>
            <TabsTrigger value="offer">Могу помочь</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-6">
            {/* Фильтры */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Фильтры</h2>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary">{activeFiltersCount} активных</Badge>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Категория</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Все категории" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все категории</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Срочность</Label>
                  <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Любая" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Любая</SelectItem>
                      {Object.entries(urgencyLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Вознаграждение</Label>
                  <div className="flex items-center space-x-2 h-10 px-3 border rounded-md">
                    <Checkbox
                      id="only-paid"
                      checked={onlyPaid}
                      onCheckedChange={(checked) => setOnlyPaid(checked as boolean)}
                    />
                    <Label htmlFor="only-paid" className="cursor-pointer">Только платные</Label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Поиск</Label>
                  <div className="relative group">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                    <Input
                      placeholder="Поиск..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 border-2 focus:border-primary transition-all shadow-sm hover:shadow-md"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Счетчик результатов */}
            <div className="text-sm text-gray-600">
              Найдено: <span className="font-semibold">{filteredRequests.length}</span>
            </div>

            {/* Лента запросов */}
            {filteredRequests.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Нет результатов</h3>
                <p className="text-gray-600 mb-6">
                  {activeTab === 'offer' 
                    ? 'Вы еще не откликнулись ни на один запрос'
                    : 'Попробуйте изменить фильтры или создайте свой запрос'}
                </p>
                {activeTab === 'need' && (
                  <Button
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg hover:shadow-xl transition-all text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Создать запрос
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRequests.map(request => (
                  <div key={request.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <a href={`/requests/${request.id}`} className="block">
                          <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-primary transition-colors">
                            {request.title}
                          </h3>
                        </a>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="outline">{request.category}</Badge>
                          <Badge
                            variant={request.urgency === 'today' ? 'destructive' : 'secondary'}
                          >
                            {urgencyLabels[request.urgency as Urgency]}
                          </Badge>
                          <Badge variant="default">
                            {request.reward_type === 'money'
                              ? `${request.reward_amount} ₽`
                              : 'Спасибо'}
                          </Badge>
                          {userOffersSet.has(request.id) && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                              Вы откликнулись
                            </Badge>
                          )}
                          {request.status !== 'open' && (
                            <Badge variant="outline">
                              {request.status === 'in_progress' ? 'В работе' : 'Закрыт'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{request.district}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatTimeAgo(request.created_at)}</span>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-4">{request.description}</p>
                    <div className="flex gap-2">
                      {request.status === 'open' && !userOffersSet.has(request.id) && (
                        <Button
                          onClick={() => handleRespond(request)}
                          className="w-full md:w-auto bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-md hover:shadow-lg transition-all text-white"
                          disabled={isLoadingContact}
                        >
                          {isLoadingContact ? 'Загрузка...' : 'Откликнуться'}
                        </Button>
                      )}
                      {userOffersSet.has(request.id) && (
                        <Button
                          variant="outline"
                          className="w-full md:w-auto border-green-300 text-green-700 bg-green-50"
                          disabled
                        >
                          Вы уже откликнулись
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>


      {/* Модалка создания запроса */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Создать запрос</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateRequest}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Категория *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v as Category })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Заголовок *</Label>
                <Input
                  placeholder="Краткое описание задачи"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Описание *</Label>
                <Textarea
                  placeholder="Подробное описание задачи"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>Когда нужно *</Label>
                <Select
                  value={formData.urgency}
                  onValueChange={(v) => setFormData({ ...formData, urgency: v as Urgency })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(urgencyLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Вознаграждение *</Label>
                <RadioGroup
                  value={formData.reward}
                  onValueChange={(v) => setFormData({ ...formData, reward: v as RewardType, amount: '' })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="thanks" id="thanks" />
                    <Label htmlFor="thanks" className="cursor-pointer">Спасибо</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="money" id="money" />
                    <Label htmlFor="money" className="cursor-pointer">₽</Label>
                  </div>
                </RadioGroup>
                {formData.reward === 'money' && (
                  <Input
                    type="number"
                    placeholder="Сумма"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="mt-2"
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label>Контакт *</Label>
                <div className="flex gap-2">
                  <Select
                    value={formData.contactType}
                    onValueChange={(v) => setFormData({ ...formData, contactType: v as ContactType })}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="telegram">Telegram</SelectItem>
                      <SelectItem value="phone">Телефон</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder={formData.contactType === 'telegram' ? '@username' : '+7 999 123-45-67'}
                    value={formData.contactValue}
                    onChange={(e) => setFormData({ ...formData, contactValue: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg hover:shadow-xl transition-all text-white"
              >
                {isLoading ? 'Создание...' : 'Опубликовать'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  )
}

