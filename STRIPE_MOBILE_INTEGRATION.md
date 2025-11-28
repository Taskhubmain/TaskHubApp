# Stripe Mobile Integration

Эта документация описывает интеграцию Stripe SDK для Android приложения TaskHub.

## Обзор

Платёжная система работает по-разному в зависимости от платформы:

- **Веб-версия**: использует Stripe Checkout Sessions с редиректом на страницу оплаты Stripe
- **Android приложение**: использует нативный Stripe Android SDK с Payment Sheet

Старая веб-версия оплаты **сохранена и продолжает работать**.

## Архитектура

### 1. Платформо-зависимая логика

Файл `src/lib/platform.ts` определяет, работает ли приложение в веб или нативном окружении:

```typescript
isNativeMobile() // true для Android/iOS, false для веба
getPlatform() // 'web' | 'android' | 'ios'
```

### 2. Supabase Edge Functions

#### Для веб-версии (существующая)
- `create-wallet-topup-session` - создаёт Stripe Checkout Session
- Возвращает URL для редиректа

#### Для мобильной версии (новая)
- `create-payment-intent` - создаёт Payment Intent для нативного SDK
- Возвращает `client_secret` и `publishable_key`

### 3. Capacitor Plugin

Создан нативный плагин `StripePaymentPlugin` для интеграции со Stripe Android SDK:

**Android код:**
- `android/app/src/main/java/com/taskhub/app/StripePaymentPlugin.java`
- Использует `com.stripe:stripe-android:20.37.5`

**TypeScript интерфейс:**
- `src/lib/stripe-plugin.ts` - определение плагина
- `src/lib/stripe-plugin-web.ts` - заглушка для веб-версии

### 4. Логика оплаты в WalletPage

В `src/pages/WalletPage.tsx` добавлена проверка платформы:

```typescript
if (isNativeMobile()) {
  // Используем Payment Intent + нативный SDK
  const data = await fetch('.../create-payment-intent', ...)
  await StripePayment.initializePaymentSheet({
    publishableKey: data.publishable_key,
    clientSecret: data.client_secret
  })
} else {
  // Используем старый метод с редиректом
  const data = await fetch('.../create-wallet-topup-session', ...)
  window.location.href = data.url
}
```

## Настройка

### 1. Stripe Publishable Key

Необходимо добавить переменную окружения в Supabase для edge function `create-payment-intent`:

```
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 2. Сборка Android приложения

После изменений выполните:

```bash
npm run build
npx cap sync android
npx cap open android
```

Соберите APK в Android Studio.

## Workflow пополнения баланса

### Веб-версия (как было)
1. Пользователь вводит сумму
2. Создаётся транзакция в статусе `pending`
3. Создаётся Stripe Checkout Session
4. Редирект на страницу оплаты Stripe
5. После оплаты редирект обратно на `/wallet?deposit=success`
6. Webhook обновляет транзакцию в `completed`

### Мобильная версия (новое)
1. Пользователь вводит сумму
2. Создаётся транзакция в статусе `pending`
3. Создаётся Payment Intent
4. Открывается нативный Payment Sheet
5. Пользователь вводит карту и оплачивает без выхода из приложения
6. Результат возвращается в callback
7. Webhook обновляет транзакцию в `completed`

## Webhook обработка

Существующий webhook `stripe-webhook` обрабатывает оба типа платежей:
- `checkout.session.completed` - для веб-версии
- `payment_intent.succeeded` - для мобильной версии

## Вывод средств

Вывод средств продолжает работать через существующую систему с Stripe Connect и использует одинаковую логику для веба и мобильного приложения.

## Тестирование

Для тестирования в Android приложении используйте тестовые карты Stripe:
- Успешная оплата: `4242 4242 4242 4242`
- Отклонённая оплата: `4000 0000 0000 0002`

Дата: любая будущая дата
CVC: любые 3 цифры
ZIP: любой почтовый индекс
