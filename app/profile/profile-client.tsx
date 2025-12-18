'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useRouter } from 'next/navigation'
import { Save, Loader2, Upload, Camera } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const districts = ['Центральный', 'Северный', 'Южный', 'Восточный', 'Западный']

interface ProfileClientProps {
  user: any
  initialProfile: any
}

export function ProfileClient({ user, initialProfile }: ProfileClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    display_name: initialProfile?.display_name || user?.email?.split('@')[0] || '',
    district: initialProfile?.district || '',
    telegram: initialProfile?.telegram || '',
    avatar_url: initialProfile?.avatar_url || null,
  })

  // Функция загрузки аватара
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setIsUploading(true)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Вы должны выбрать изображение для загрузки.')
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      // Загрузка в Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      // Получение публичной ссылки
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      setFormData({ ...formData, avatar_url: publicUrl })
    } catch (error) {
      console.error('Error uploading avatar:', error)
      alert('Ошибка при загрузке аватара. Убедитесь, что бакет "avatars" существует и доступен.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (!user?.id) {
        throw new Error('Пользователь не авторизован')
      }

      // Подготавливаем данные для сохранения (без avatar_url, так как его может не быть в схеме)
      const profileData: {
        id: string
        display_name: string | null
        district: string | null
        telegram: string | null
      } = {
        id: user.id,
        display_name: formData.display_name || null,
        district: formData.district || null,
        telegram: formData.telegram || null,
      }

      // Сначала проверяем, существует ли профиль
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      let result
      if (existingProfile) {
        // Обновляем существующий профиль
        result = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', user.id)
          .select()
      } else {
        // Создаем новый профиль
        result = await supabase
          .from('profiles')
          .insert(profileData)
          .select()
      }

      const { data, error } = result

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        })
        throw new Error(`Ошибка при обновлении профиля: ${error.message}${error.code ? ` (код: ${error.code})` : ''}`)
      }

      console.log('Profile updated successfully:', data)
      router.refresh()
      alert('Профиль успешно обновлен!')
    } catch (error) {
      console.error('Error updating profile:', error)
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Ошибка при обновлении профиля'
      alert(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="grid gap-8 md:grid-cols-[300px_1fr]">

          {/* Карточка профиля / Аватар */}
          <div className="h-fit space-y-6 rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <Avatar className="h-32 w-32 border-4 border-white shadow-lg transition-transform group-hover:scale-105">
                  <AvatarImage src={formData.avatar_url || ''} alt={formData.display_name} className="object-cover" />
                  <AvatarFallback className="text-4xl bg-gradient-to-br from-blue-100 to-blue-50 text-blue-500">
                    {(formData.display_name?.[0] || 'U').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <Camera className="h-8 w-8 text-white" />
                </div>
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                  </div>
                )}
              </div>

              <input
                type="file"
                id="avatar"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={isUploading}
              />

              <div>
                <h2 className="text-xl font-bold text-gray-900">{formData.display_name || 'Пользователь'}</h2>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>

              <div className="w-full pt-4 border-t border-gray-100">
                <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Статус</div>
                <div className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-3 py-1 text-sm font-medium text-green-700">
                  <span className="mr-2 h-2 w-2 rounded-full bg-green-500"></span>
                  Активен
                </div>
              </div>
            </div>
          </div>

          {/* Форма редактирования */}
          <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Настройки профиля</h1>
              <p className="text-gray-500 mt-1">Управляйте своей личной информацией и предпочтениями</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-600">Email адрес</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-400">Email адрес привязан к аккаунту и не может быть изменен</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="display_name" className="text-gray-600">Отображаемое имя</Label>
                  <Input
                    id="display_name"
                    value={formData.display_name}
                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                    placeholder="Как к вам обращаться?"
                    className="border-gray-200 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="district" className="text-gray-600">Ваш район</Label>
                    <Select
                      value={formData.district}
                      onValueChange={(value) => setFormData({ ...formData, district: value })}
                    >
                      <SelectTrigger className="border-gray-200">
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
                    <Label htmlFor="telegram" className="text-gray-600">Telegram</Label>
                    <div className="relative">
                      <Input
                        id="telegram"
                        value={formData.telegram}
                        onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                        placeholder="@username"
                        className="pl-9 border-gray-200 focus:border-blue-500 transition-colors"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 flex justify-end">
                <Button
                  type="submit"
                  className="bg-gray-900 hover:bg-gray-800 text-white min-w-[150px] shadow-lg shadow-gray-200 transition-all hover:shadow-xl hover:-translate-y-0.5"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Сохранение...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Сохранить изменения
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
