'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { createRequest } from '@/app/actions/requests'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

type Category = 'уборка' | 'ремонт' | 'доставка' | 'уход' | 'другое'
type Urgency = 'today' | 'tomorrow' | 'week' | 'not-urgent'
type RewardType = 'thanks' | 'money'
type ContactType = 'telegram' | 'phone'

const categories: Category[] = ['уборка', 'ремонт', 'доставка', 'уход', 'другое']
const districts = ['Центральный', 'Северный', 'Южный', 'Восточный', 'Западный']
const urgencyLabels: Record<Urgency, string> = {
  'today': 'Сегодня',
  'tomorrow': 'Завтра',
  'week': 'На неделе',
  'not-urgent': 'Не срочно'
}

interface CreateRequestClientProps {
  userDistrict?: string
}

export function CreateRequestClient({ userDistrict }: CreateRequestClientProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    category: '' as Category | '',
    title: '',
    description: '',
    urgency: 'not-urgent' as Urgency,
    reward: 'thanks' as RewardType,
    amount: '',
    district: userDistrict || '',
    contactType: 'telegram' as ContactType,
    contactValue: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.category || !formData.title || !formData.description || !formData.contactValue || !formData.district) {
      toast.error('Заполните все обязательные поля')
      return
    }

    setIsLoading(true)
    try {
      await createRequest({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        urgency: formData.urgency,
        reward_type: formData.reward,
        reward_amount: formData.reward === 'money' ? Number(formData.amount) : undefined,
        district: formData.district,
        contact_type: formData.contactType,
        contact_value: formData.contactValue,
      })

      toast.success('Запрос успешно создан!')
      router.push('/dashboard/requests')
      router.refresh()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при создании запроса'
      toast.error(errorMessage)
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Создать запрос</h1>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
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
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Описание *</Label>
              <Textarea
                placeholder="Подробное описание задачи"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Район *</Label>
              <Select
                value={formData.district}
                onValueChange={(v) => setFormData({ ...formData, district: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите район" />
                </SelectTrigger>
                <SelectContent>
                  {districts.map(district => (
                    <SelectItem key={district} value={district}>{district}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  required
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
                  required
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Создание...
                  </>
                ) : (
                  'Опубликовать'
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Отмена
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

