'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MockMap } from '@/components/mock-map'
import { Search, MapPin, Clock, Heart, ArrowRight, Users, Shield, Zap } from 'lucide-react'
import Link from 'next/link'
import type { Request } from '@/lib/types'

interface HomeClientProps {
  initialRequests: Request[]
}

const districts = ['Все районы', 'Центральный', 'Северный', 'Южный', 'Восточный', 'Западный']
const categories = ['Все категории', 'уборка', 'ремонт', 'доставка', 'уход', 'другое']

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

export function HomeClient({ initialRequests }: HomeClientProps) {
  const [selectedDistrict, setSelectedDistrict] = useState('Все районы')
  const [selectedCategory, setSelectedCategory] = useState('Все категории')
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredRequests, setFilteredRequests] = useState<Request[]>(initialRequests)

  useEffect(() => {
    let filtered = [...initialRequests]

    if (selectedDistrict !== 'Все районы') {
      filtered = filtered.filter(req => req.district === selectedDistrict)
    }

    if (selectedCategory !== 'Все категории') {
      filtered = filtered.filter(req => req.category === selectedCategory)
    }

    if (searchQuery) {
      filtered = filtered.filter(req => 
        req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredRequests(filtered)
  }, [selectedDistrict, selectedCategory, searchQuery, initialRequests])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Навигация */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Рядом
            </h1>
            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild className="hover:bg-gray-100/80">
                <Link href="/dashboard">Войти</Link>
              </Button>
              <Button asChild className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg hover:shadow-xl transition-all">
                <Link href="/dashboard">Регистрация</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero секция */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 border-b border-gray-200 py-20 overflow-hidden">
        {/* Декоративные элементы */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent leading-tight">
              Сервис срочных поручений
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Находите исполнителей для срочных поручений или предлагайте свои услуги. 
              <span className="font-semibold text-gray-700"> Быстро, безопасно, удобно.</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
              <Button 
                size="lg" 
                asChild 
                className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
              >
                <Link href="/dashboard">
                  Создать поручение
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                asChild 
                className="text-lg px-8 py-6 border-2 border-gray-300 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all group relative overflow-hidden"
              >
                <Link href="#map" className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  Посмотреть на карте
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Фильтры и поиск */}
      <section className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 py-8 sticky top-[73px] z-40">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Поиск задач..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-2 focus:border-primary transition-all shadow-sm hover:shadow-md"
                />
              </div>
              <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                <SelectTrigger className="border-2 shadow-sm hover:shadow-md transition-all">
                  <SelectValue placeholder="Выберите район" />
                </SelectTrigger>
                <SelectContent>
                  {districts.map(district => (
                    <SelectItem key={district} value={district}>{district}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="border-2 shadow-sm hover:shadow-md transition-all">
                  <SelectValue placeholder="Выберите категорию" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Примеры задач */}
      <section className="py-16 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Актуальные задачи</h3>
              <p className="text-gray-600 text-lg">Найдено задач: <span className="font-semibold text-primary">{filteredRequests.length}</span></p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRequests.slice(0, 6).map((request, index) => (
                <div 
                  key={request.id} 
                  className="bg-white rounded-xl border border-gray-200/50 p-6 card-hover group relative overflow-hidden shadow-sm hover:shadow-xl"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <a href={`/requests/${request.id}`} className="block flex-1">
                      <h4 className="text-lg font-bold text-gray-900 flex-1 group-hover:text-primary transition-colors pr-2">
                        {request.title}
                      </h4>
                    </a>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="outline" className="bg-gray-50 hover:bg-gray-100 transition-colors">
                      {request.category}
                    </Badge>
                    <Badge 
                      variant="secondary" 
                      className={`${
                        request.reward_type === 'money' 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      } font-semibold`}
                    >
                      {request.reward_type === 'money' ? `💰 ${request.reward_amount} ₽` : '🙏 Спасибо'}
                    </Badge>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-5 line-clamp-2 leading-relaxed">
                    {request.description}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-5 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      <span className="font-medium">{request.district}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-gray-400" />
                      <span>{formatTimeAgo(request.created_at)}</span>
                    </div>
                  </div>
                  
                  <Button variant="outline" className="w-full border-2 hover:border-primary hover:bg-primary hover:text-white transition-all font-medium group/btn" asChild>
                    <Link href={`/requests/${request.id}`} className="flex items-center justify-center gap-2">
                      Подробнее
                      <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
            {filteredRequests.length === 0 && (
              <div className="text-center py-12">
                <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h4 className="text-xl font-semibold text-gray-900 mb-2">Нет результатов</h4>
                <p className="text-gray-600 mb-6">Попробуйте изменить фильтры</p>
                <Button asChild>
                  <Link href="/dashboard">Создать задачу</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Карта */}
      <section id="map" className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Задачи на карте</h3>
              <p className="text-gray-600 text-lg">
                Найдено задач: <span className="font-semibold text-primary">{filteredRequests.length}</span>
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200/50 p-6 shadow-xl hover:shadow-2xl transition-shadow">
              <MockMap requests={filteredRequests.map(r => ({
                id: r.id,
                type: 'need' as const,
                title: r.title,
                category: r.category,
                urgency: r.urgency,
                reward: r.reward_type,
                amount: r.reward_amount || undefined,
                location: r.district,
                district: r.district,
                createdAt: new Date(r.created_at),
                description: r.description,
              }))} />
            </div>
          </div>
        </div>
      </section>

      {/* Преимущества */}
      <section className="py-20 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Почему выбирают нас</h3>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Мы делаем выполнение поручений простым, быстрым и безопасным
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center group">
                <div className="bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg group-hover:shadow-xl">
                  <Users className="h-10 w-10 text-primary" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors">Проверенные исполнители</h4>
                <p className="text-gray-600 leading-relaxed">
                  Исполнители рядом с вами. Быстро, удобно, безопасно.
                </p>
              </div>
              <div className="text-center group">
                <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg group-hover:shadow-xl">
                  <Shield className="h-10 w-10 text-green-600" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors">Безопасность</h4>
                <p className="text-gray-600 leading-relaxed">
                  Все пользователи проверяются. Ваши данные защищены и конфиденциальны.
                </p>
              </div>
              <div className="text-center group">
                <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg group-hover:shadow-xl">
                  <Zap className="h-10 w-10 text-orange-600" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-orange-600 transition-colors">Быстро и просто</h4>
                <p className="text-gray-600 leading-relaxed">
                  Создайте задачу за минуту. Находите помощь или предлагайте услуги мгновенно.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-primary via-purple-600 to-primary text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-4xl md:text-5xl font-bold mb-6">Готовы начать?</h3>
            <p className="text-xl md:text-2xl mb-10 opacity-95 leading-relaxed">
              Присоединяйтесь к сервису и начните выполнять поручения уже сегодня
            </p>
            <Button 
              size="lg" 
              variant="secondary" 
              asChild
              className="text-lg px-10 py-7 bg-white text-primary hover:bg-gray-100 shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all font-bold"
            >
              <Link href="/dashboard">
                Зарегистрироваться бесплатно
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Футер */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h4 className="text-xl font-bold text-gray-900 mb-2">Рядом</h4>
              <p className="text-gray-600 text-sm">Сервис срочных поручений</p>
            </div>
            <div className="flex gap-6">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">О сервисе</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">Контакты</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">Помощь</Link>
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

