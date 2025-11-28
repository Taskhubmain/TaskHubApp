# Инструкции по сборке Android приложения с Stripe SDK

## Предварительные требования

1. Android Studio установлена
2. JDK 11 или выше
3. Android SDK установлен
4. Gradle настроен

## Шаги сборки

### 1. Установка зависимостей

```bash
npm install
```

### 2. Сборка веб-версии

```bash
npm run build
```

### 3. Синхронизация с Android проектом

```bash
npx cap sync android
```

### 4. Открыть проект в Android Studio

```bash
npx cap open android
```

Или вручную откройте папку `android` в Android Studio.

### 5. Настройка Stripe

Убедитесь, что в вашем Supabase проекте настроены переменные окружения для edge function `create-payment-intent`:

- `STRIPE_SECRET_KEY` - секретный ключ Stripe
- `STRIPE_PUBLISHABLE_KEY` - публичный ключ Stripe (начинается с `pk_`)

### 6. Сборка APK в Android Studio

1. В меню выберите `Build > Build Bundle(s) / APK(s) > Build APK(s)`
2. Дождитесь завершения сборки
3. APK файл будет находиться в `android/app/build/outputs/apk/debug/app-debug.apk`

### 7. Установка на устройство

**Через Android Studio:**
- Подключите Android устройство или запустите эмулятор
- Нажмите кнопку Run (зелёный треугольник)

**Через adb:**
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

## Проверка работы Stripe SDK

### В консоли приложения

При открытии страницы "Кошелек" в консоли должны появиться логи:

```
[WalletPage] Initial platform check on mount: { isNative: true, userAgent: "..." }
[Platform] isNativeMobile check: { isNative: true, platform: "android", userAgent: "..." }
```

### При нажатии кнопки "Пополнить"

1. Должна открыться модальное окно с полем ввода суммы
2. После ввода суммы и нажатия "Пополнить" должен открыться **нативный Payment Sheet от Stripe** (не браузер!)
3. Payment Sheet показывает форму для ввода карты прямо в приложении
4. После успешной оплаты должно появиться уведомление об успехе

### Если открывается браузер вместо Payment Sheet

Это означает, что Capacitor не определяет платформу как нативную. Проверьте:

1. **Проверьте логи в консоли** - должно быть `isNative: true`
2. **Убедитесь, что приложение запущено через Android Studio**, а не открыто в браузере
3. **Пересоберите проект:**
   ```bash
   npm run build
   npx cap sync android
   ```

## Тестовые карты Stripe

Для тестирования используйте тестовые карты:

- **Успешная оплата:** `4242 4242 4242 4242`
- **Отклонённая оплата:** `4000 0000 0000 0002`
- **Требуется 3D Secure:** `4000 0027 6000 3184`

Параметры:
- Дата: любая будущая дата (например, 12/30)
- CVC: любые 3 цифры (например, 123)
- ZIP: любой почтовый индекс (например, 12345)

## Troubleshooting

### Проблема: "Plugin StripePayment does not have method initializePaymentSheet"

**Решение:**
1. Убедитесь, что плагин зарегистрирован в `MainActivity.java`
2. Пересинхронизируйте проект: `npx cap sync android`
3. Очистите кэш Gradle: `./gradlew clean` в папке `android`

### Проблема: Приложение не запускается

**Решение:**
1. Проверьте, что все зависимости установлены
2. В Android Studio выполните: `File > Invalidate Caches / Restart`
3. Пересоберите проект

### Проблема: Payment Sheet не показывается

**Решение:**
1. Проверьте логи Logcat в Android Studio на наличие ошибок
2. Убедитесь, что `STRIPE_PUBLISHABLE_KEY` настроен в Supabase
3. Проверьте, что вызывается правильная edge function (`create-payment-intent`)

## Отладка

Для отладки используйте Android Studio Logcat:

1. Откройте Logcat в Android Studio
2. Фильтруйте по тегу `StripePaymentPlugin`
3. Проверьте логи на наличие ошибок

Также можно использовать Chrome DevTools для отладки WebView:

1. Откройте Chrome и перейдите на `chrome://inspect`
2. Найдите ваше устройство и приложение
3. Нажмите "Inspect" для открытия DevTools
4. Перейдите на вкладку Console для просмотра логов

## Следующие шаги

После успешной сборки и тестирования:

1. Настройте подпись APK для release версии
2. Настройте ProGuard для оптимизации
3. Создайте release APK/AAB для публикации в Google Play Store
