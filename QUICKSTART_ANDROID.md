# Быстрый запуск Android приложения с Stripe SDK

## Что было сделано

✅ Stripe Android SDK (версия 20.37.5) добавлен в проект
✅ Создан нативный Capacitor плагин `StripePaymentPlugin`
✅ Создана Supabase edge function `create-payment-intent`
✅ Обновлена логика в `WalletPage` для использования нативного SDK в приложении
✅ Веб-версия оплаты сохранена и работает как прежде

## Запуск за 3 шага

```bash
# 1. Сборка веб-версии
npm run build

# 2. Синхронизация с Android
npx cap sync android

# 3. Открыть в Android Studio
npx cap open android
```

## Настройка Stripe в Supabase

Перед запуском приложения добавьте переменные окружения для edge function `create-payment-intent`:

1. Откройте Supabase Dashboard
2. Перейдите в `Edge Functions` → `create-payment-intent` → Settings
3. Добавьте секреты:
   - `STRIPE_PUBLISHABLE_KEY` = `pk_test_...` (ваш публичный ключ)
   - `STRIPE_SECRET_KEY` уже должен быть настроен

## Как проверить, что всё работает

### В Android приложении:

1. Откройте приложение на устройстве/эмуляторе
2. Перейдите на страницу "Кошелек"
3. Нажмите кнопку "Пополнить"
4. Введите сумму
5. **Должен открыться нативный Payment Sheet** (не браузер!)
6. Используйте тестовую карту: `4242 4242 4242 4242`
7. После оплаты должно появиться уведомление об успехе

### В веб-версии:

1. Откройте приложение в браузере
2. Нажмите "Пополнить"
3. **Должен произойти редирект на сайт Stripe** (как раньше)
4. Оплата проходит через Stripe Checkout

## Отладка

Если открывается браузер вместо Payment Sheet в Android приложении:

1. **Откройте Chrome DevTools:**
   - В Chrome перейдите на `chrome://inspect`
   - Найдите ваше приложение и нажмите "Inspect"

2. **Проверьте логи консоли:**
   ```
   [Platform] isNativeMobile check: { isNative: true, platform: "android" }
   [WalletPage] Platform check: { isMobile: true, ... }
   ```

3. **Если `isNative: false`:**
   - Пересоберите: `npm run build && npx cap sync android`
   - Перезапустите приложение из Android Studio

4. **Если ошибка "plugin is not implemented on android":**
   - Проверьте, что в `MainActivity.java` есть метод `getInitialPlugins()`
   - Убедитесь, что плагин добавлен: `plugins.add(StripePaymentPlugin.class);`
   - Пересоберите проект в Android Studio (Build → Rebuild Project)

## Поддержка

Подробная документация:
- `STRIPE_MOBILE_INTEGRATION.md` - архитектура интеграции
- `ANDROID_BUILD_INSTRUCTIONS.md` - полные инструкции по сборке

## Тестовые данные Stripe

- **Карта:** 4242 4242 4242 4242
- **Дата:** 12/30 (любая будущая)
- **CVC:** 123 (любые 3 цифры)
- **ZIP:** 12345 (любой индекс)
