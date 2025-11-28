# Отладка платежей через Stripe в Android приложении

## Обзор

Добавлено детальное логирование на всех уровнях для отладки проблем с платежами:

1. **TypeScript/React** - логи в консоли браузера
2. **Java Plugin** - логи в Android Logcat
3. **Edge Function** - логи в Supabase

## Как отлаживать

### 1. Проверка платформы

При открытии страницы "Кошелек" в консоли должны появиться логи:

```
[WalletPage] Initial platform check on mount: { isNative: true/false, userAgent: "..." }
[Platform] isNativeMobile check: { isNative: true/false, platform: "android/web", userAgent: "..." }
```

**Если `isNative: false` в Android приложении:**
- Приложение не определяется как нативное
- Проверьте, что запускаете через Android Studio, а не в браузере
- Пересоберите: `npm run build && npx cap sync android`

### 2. Отладка через Chrome DevTools

1. Откройте Chrome и перейдите на `chrome://inspect`
2. Найдите ваше устройство и приложение в списке
3. Нажмите "Inspect" для открытия DevTools
4. Перейдите на вкладку "Console"

### 3. Отладка через Android Logcat

В Android Studio откройте панель Logcat (View → Tool Windows → Logcat) и отфильтруйте по тегу `StripePaymentPlugin`:

```
adb logcat -s StripePaymentPlugin:*
```

### 4. Последовательность логов при успешной оплате

#### В консоли браузера (Chrome DevTools):

```
[Platform] isNativeMobile check: { isNative: true, platform: "android", ... }
[WalletPage] Platform check: { isMobile: true, ... }
[WalletPage] Initializing Payment Sheet with: { publishableKey: "pk_test_...", hasClientSecret: true }
[WalletPage] Payment Sheet result: { status: "success", message: "..." }
```

#### В Android Logcat:

```
D/StripePaymentPlugin: StripePaymentPlugin loaded
D/StripePaymentPlugin: initializePaymentSheet called
D/StripePaymentPlugin: publishableKey: pk_test_...
D/StripePaymentPlugin: clientSecret present: true
D/StripePaymentPlugin: Initializing PaymentConfiguration
D/StripePaymentPlugin: Running on UI thread
D/StripePaymentPlugin: Creating PaymentSheet
D/StripePaymentPlugin: Creating PaymentSheet configuration
D/StripePaymentPlugin: Setting pending call and presenting payment sheet
D/StripePaymentPlugin: Payment sheet presented successfully
D/StripePaymentPlugin: onPaymentSheetResult called with result type: Completed
D/StripePaymentPlugin: Payment completed successfully
D/StripePaymentPlugin: Payment sheet result processed
```

#### В Supabase Edge Function логах:

```
[create-payment-intent] Function called
[create-payment-intent] Stripe keys configured
[create-payment-intent] Auth header present
[create-payment-intent] User authenticated: user_id_here
[create-payment-intent] Request params: { amount: 10, currency: "USD", ... }
[create-payment-intent] Creating payment intent
[create-payment-intent] Payment intent created: pi_...
[create-payment-intent] Transaction updated
[create-payment-intent] Returning response with publishable_key: pk_test_...
```

## Частые проблемы и решения

### Ошибка: "STRIPE_PUBLISHABLE_KEY is not configured"

**Проблема:** Не настроена переменная окружения в Supabase

**Решение:**
1. Откройте Supabase Dashboard
2. Перейдите в Edge Functions → `create-payment-intent`
3. Откройте Settings/Secrets
4. Добавьте `STRIPE_PUBLISHABLE_KEY` = `pk_test_...` или `pk_live_...`

### Ошибка: "Missing publishableKey" или "Missing clientSecret"

**Проблема:** Данные не передаются в плагин

**Решение:**
1. Проверьте логи edge function - успешно ли создаётся Payment Intent
2. Проверьте логи в консоли браузера - приходит ли `publishable_key` от API
3. Убедитесь, что `STRIPE_PUBLISHABLE_KEY` настроен в Supabase

### Ошибка: "Plugin StripePayment does not have method initializePaymentSheet"

**Проблема:** Плагин не зарегистрирован или не синхронизирован

**Решение:**
1. Убедитесь, что в `MainActivity.java` есть строка: `registerPlugin(StripePaymentPlugin.class);`
2. Выполните синхронизацию: `npx cap sync android`
3. Пересоберите проект в Android Studio

### Ошибка: "UI thread error"

**Проблема:** Ошибка при создании UI компонентов Stripe

**Решение:**
1. Проверьте логи Logcat для деталей ошибки
2. Убедитесь, что Activity является `AppCompatActivity`
3. Проверьте, что Stripe SDK правильно подключён в `build.gradle`

### Платежи открываются в браузере вместо Payment Sheet

**Проблема:** Определение платформы не работает

**Решение:**
1. Проверьте логи: `[Platform] isNativeMobile check: { isNative: ... }`
2. Если `isNative: false`, пересоберите:
   ```bash
   npm run build
   npx cap sync android
   ```
3. Перезапустите приложение из Android Studio

### Ошибка: "Payment sheet error: ..."

**Проблема:** Ошибка внутри Stripe Payment Sheet

**Решение:**
1. Проверьте детальные логи в консоли:
   ```
   [WalletPage] Payment error details: { message: "...", code: "...", ... }
   ```
2. Проверьте логи Android Logcat для деталей от Stripe SDK
3. Убедитесь, что используете правильный тестовый режим (test/live keys должны совпадать)

## Проверка настроек Stripe

### Убедитесь, что используете правильные ключи:

1. **Test mode** (для тестирования):
   - `STRIPE_SECRET_KEY` = `sk_test_...`
   - `STRIPE_PUBLISHABLE_KEY` = `pk_test_...`

2. **Live mode** (для продакшена):
   - `STRIPE_SECRET_KEY` = `sk_live_...`
   - `STRIPE_PUBLISHABLE_KEY` = `pk_live_...`

**ВАЖНО:** Test и Live ключи нельзя смешивать!

## Дополнительная отладка

### Проверить вызов Edge Function вручную:

```bash
curl -X POST https://your-project.supabase.co/functions/v1/create-payment-intent \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 10, "currency": "USD", "idempotency_key": "test-123"}'
```

Должен вернуться JSON с `client_secret`, `payment_intent_id` и `publishable_key`.

### Проверить логи Supabase Edge Function:

1. Откройте Supabase Dashboard
2. Перейдите в Edge Functions → `create-payment-intent`
3. Откройте Logs
4. Отфильтруйте по времени вашего теста

## Поддержка

Если проблема не решается:

1. Соберите все логи:
   - Консоль браузера (Chrome DevTools)
   - Android Logcat
   - Supabase Edge Function логи

2. Проверьте конфигурацию:
   - Версия Stripe SDK в `build.gradle`: `com.stripe:stripe-android:20.37.5`
   - Наличие всех файлов плагина
   - Правильность ключей Stripe

3. Создайте issue с детальным описанием проблемы и всеми логами
