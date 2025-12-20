-- Исправление RLS политики для обеспечения доступа неавторизованных пользователей
-- Проблема: политика должна явно указывать роли для работы с разными типами пользователей

-- Удаляем все существующие политики SELECT для requests (если есть)
DROP POLICY IF EXISTS "Anyone can view requests without contact" ON requests;
DROP POLICY IF EXISTS "Anyone can view requests" ON requests;
DROP POLICY IF EXISTS "Public can view requests" ON requests;
DROP POLICY IF EXISTS "Anonymous can view requests" ON requests;
DROP POLICY IF EXISTS "Authenticated can view requests" ON requests;

-- Создаем политику для анонимных пользователей (неавторизованных)
-- Это критически важно - без явного указания роли anon политика может не работать!
CREATE POLICY "Anonymous can view requests"
  ON requests FOR SELECT
  TO anon
  USING (true);

-- Создаем политику для авторизованных пользователей
CREATE POLICY "Authenticated can view requests"
  ON requests FOR SELECT
  TO authenticated
  USING (true);

-- Убеждаемся, что RLS включен
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

-- Проверка: эти политики должны позволить всем (включая неавторизованных) читать запросы
-- contact_value все равно не должен передаваться в клиент благодаря sanitizeRequests

-- Примечание: 
-- - TO anon - для неавторизованных пользователей (это важно!)
-- - TO authenticated - для авторизованных пользователей
-- - USING (true) - означает, что все строки доступны для чтения

