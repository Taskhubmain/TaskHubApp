# Payment Flow - Оплата через сайт с редиректом на веб-страницу

## Обзор

Все платежи (пополнение и вывод) проходят через сайт Stripe Checkout с редиректом на веб-страницу кошелька.

## Архитектура

### 1. Пополнение баланса (Deposit)

```
Приложение → Stripe Checkout (в браузере) → Redirect на веб-страницу кошелька
```

#### Шаги:

1. **Пользователь нажимает "Пополнить"** в WalletPage (приложение или веб)
2. **Создаётся Stripe Checkout Session** через edge function `create-wallet-topup-session`
3. **Открывается браузер** с формой оплаты Stripe
4. **Пользователь вводит карту** и завершает оплату
5. **Stripe редиректит** на веб-страницу: `https://your-domain.com/#/wallet?deposit=success`
6. **Пользователь видит страницу кошелька** с результатом оплаты
7. **WalletPage показывает уведомление** и обновляет баланс

### 2. Вывод средств (Withdrawal)

```
Приложение → Stripe Connect Transfer → Успех/Ошибка
```

Вывод средств работает напрямую через Stripe Connect, без браузера.

## Edge Function: create-wallet-topup-session

Файл: `supabase/functions/create-wallet-topup-session/index.ts`

### URL'ы для редиректа

```typescript
const successUrl = `${frontendUrl}/#/wallet?deposit=success`;
const cancelUrl = `${frontendUrl}/#/wallet?deposit=cancelled`;
```

**Всегда редирект на веб-страницу:**
- Success: `https://your-domain.com/#/wallet?deposit=success`
- Cancel: `https://your-domain.com/#/wallet?deposit=cancelled`

## WalletPage - обработка результатов

Файл: `src/pages/WalletPage.tsx`

### useEffect обработчик

```typescript
const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
const depositStatus = urlParams.get('deposit');

if (depositStatus === 'success') {
  setNotification({
    type: 'success',
    title: 'Пополнение успешно',
    message: 'Средства зачислены на баланс.'
  });
  loadProfileBalance();
  loadWalletData();
  loadTransactions();
  window.history.replaceState({}, '', '#/wallet');
} else if (depositStatus === 'cancelled') {
  setNotification({
    type: 'info',
    title: 'Платёж отменён',
    message: 'Оплата не была завершена.'
  });
  window.history.replaceState({}, '', '#/wallet');
}
```

## Flow диаграмма

### Успешная оплата

```
1. User clicks "Пополнить" (10 USD)
   ↓
2. App/Web calls edge function create-wallet-topup-session
   ↓
3. Edge function creates Stripe Checkout Session
   - success_url: https://your-domain.com/#/wallet?deposit=success
   - cancel_url: https://your-domain.com/#/wallet?deposit=cancelled
   ↓
4. Opens browser with Stripe Checkout URL
   ↓
5. User enters card 4242 4242 4242 4242
   ↓
6. Stripe processes payment
   ↓
7. Stripe redirects to: https://your-domain.com/#/wallet?deposit=success
   ↓
8. User sees wallet page in browser
   ↓
9. WalletPage shows success notification
    - Reloads balance
    - Reloads transactions
    - Clears URL params
```

### Отменённая оплата

```
1-4. Same as success
   ↓
5. User clicks "Back" or "Cancel"
   ↓
6. Stripe redirects to: https://your-domain.com/#/wallet?deposit=cancelled
   ↓
7. User sees wallet page in browser
   ↓
8. WalletPage shows "Платёж отменён"
   - No balance changes
   - Clears URL params
```

## Тестирование

### 1. Тестовые карты Stripe

**Успешная оплата:**
- Карта: `4242 4242 4242 4242`
- Срок: любая будущая дата
- CVC: любые 3 цифры
- ZIP: любой

**Отклонённая карта:**
- Карта: `4000 0000 0000 0002`

### 2. Проверка deep links

```bash
# Проверить, что приложение принимает deep links:
adb shell am start -W -a android.intent.action.VIEW -d "taskhub://wallet?deposit=success" com.taskhub.app
```

### 3. Логи для отладки

**В Logcat (Android):**
```
App URL handler: taskhub://wallet?deposit=success
Navigating to: /wallet?deposit=success
```

**В Chrome DevTools:**
```
[WalletPage] Deposit status: success
Loading profile balance...
Loading wallet data...
Loading transactions...
```

## Важные моменты

### ✅ Что изменилось

1. **Удалён нативный Payment Sheet** - больше не используется
2. **Удалены зависимости:**
   - `stripe-plugin.ts` больше не импортируется
   - `isNativeMobile()` не используется в WalletPage
3. **Всегда редирект в браузер** - независимо от платформы
4. **Deep links** настроены для возврата в приложение

### ⚠️ Требования

1. **Deep link должен быть зарегистрирован** в AndroidManifest.xml
2. **Edge function должна определять платформу** через User-Agent
3. **WalletPage должен обрабатывать** URL параметры `?deposit=success/cancelled`

### 🔧 Отладка

Если deep link не работает:

1. **Проверьте AndroidManifest.xml:**
   ```bash
   grep -A 5 "taskhub" android/app/src/main/AndroidManifest.xml
   ```

2. **Проверьте useAppUrlHandler:**
   ```bash
   grep -A 10 "taskhub:" src/hooks/useAppUrlHandler.ts
   ```

3. **Проверьте логи:**
   ```bash
   adb logcat | grep -i "appUrlOpen\|taskhub"
   ```

4. **Тест вручную:**
   ```bash
   adb shell am start -W -a android.intent.action.VIEW \
     -d "taskhub://wallet?deposit=success" com.taskhub.app
   ```

## Преимущества

1. **Проще поддержка** - нет нативного кода для Payment Sheet
2. **Одинаковый UX** - веб и мобайл используют одну форму Stripe
3. **Надёжнее** - Stripe Checkout полностью управляется Stripe
4. **PCI compliance** - карточные данные не проходят через приложение
5. **Меньше багов** - нет проблем с регистрацией плагинов

## Недостатки

1. **Выход из приложения** - пользователь видит браузер
2. **Дольше** - открытие браузера + редирект занимает ~2-3 секунды
3. **Требуется интернет** - без сети deep link может не сработать

## Будущие улучшения

1. **Custom Tabs (Android)** - показывать Stripe Checkout в overlay вместо полного браузера
2. **Прогресс индикатор** - показывать loading пока открывается браузер
3. **Кэширование** - сохранять последний статус оплаты локально
