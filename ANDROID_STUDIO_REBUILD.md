# Полная пересборка проекта в Android Studio

## КРИТИЧЕСКИ ВАЖНО!

После изменений в MainActivity.java **ОБЯЗАТЕЛЬНО** нужно выполнить полную пересборку проекта в Android Studio, иначе изменения не вступят в силу!

## Шаги для полной пересборки:

### 1. Откройте проект в Android Studio

```bash
npx cap open android
```

### 2. Очистите проект

В меню Android Studio:
- **Build → Clean Project**
- Дождитесь завершения очистки (смотрите статус внизу экрана)

### 3. Инвалидируйте кэш (ОБЯЗАТЕЛЬНО!)

В меню Android Studio:
- **File → Invalidate Caches / Restart...**
- Выберите **"Invalidate and Restart"**
- Android Studio перезапустится

### 4. После перезапуска - пересоберите проект

В меню Android Studio:
- **Build → Rebuild Project**
- Дождитесь завершения сборки (может занять 1-3 минуты)

### 5. Проверьте логи сборки

В панели "Build" внизу экрана должно быть:
```
BUILD SUCCESSFUL
```

Если есть ошибки - сообщите о них.

### 6. Запустите приложение

- Убедитесь, что устройство/эмулятор подключен
- Нажмите зелёную кнопку "Run" (▶️)
- ИЛИ: **Run → Run 'app'**

### 7. Проверьте логи при запуске

После запуска приложения откройте Logcat (внизу экрана) и отфильтруйте по `MainActivity`:

Должны увидеть:
```
D/MainActivity: onCreate called
D/MainActivity: StripePaymentPlugin registered
D/StripePaymentPlugin: StripePaymentPlugin loaded
```

Если этих логов нет - значит старая версия всё ещё запущена!

### 8. Если всё ещё ошибка "plugin is not implemented"

Выполните **принудительную переустановку**:

1. **Удалите приложение с устройства:**
   - Вручную на устройстве/эмуляторе
   - Или через adb: `adb uninstall com.taskhub.app`

2. **В Android Studio:**
   - **Build → Clean Project**
   - **Build → Rebuild Project**

3. **Установите заново:**
   - Нажмите Run (▶️)

## Проверка успешности

После запуска проверьте в Logcat (фильтр: `StripePaymentPlugin`):

✅ **Успешная регистрация:**
```
D/MainActivity: StripePaymentPlugin registered
D/StripePaymentPlugin: StripePaymentPlugin loaded
D/StripePaymentPlugin: initializePaymentSheet called
```

❌ **Плагин не загружен (если НЕТ логов выше):**
- Вернитесь к шагу 2 и повторите все шаги
- Убедитесь, что вы выполнили "Invalidate Caches / Restart"

## Альтернативный метод (если всё выше не помогло)

Если после всех шагов плагин всё ещё не работает:

### 1. Полностью закройте Android Studio

### 2. Удалите кэш Gradle вручную:

```bash
cd android
./gradlew clean
rm -rf .gradle
rm -rf app/build
rm -rf build
cd ..
```

### 3. Пересинхронизируйте:

```bash
npx cap sync android
```

### 4. Откройте в Android Studio и пересоберите:

```bash
npx cap open android
```

Затем:
- **File → Invalidate Caches / Restart**
- После перезапуска: **Build → Rebuild Project**
- Запустите приложение

## Важные примечания

1. **НИКОГДА не пропускайте "Invalidate Caches"** - это ключевой шаг!
2. Всегда проверяйте логи Logcat - они покажут, загружен ли плагин
3. Если приложение уже запущено - остановите его перед новой сборкой
4. После каждого изменения в Java файлах - обязательна пересборка

## Что делать, если ничего не помогает

1. Соберите логи:
   - Logcat при запуске (MainActivity и StripePaymentPlugin)
   - Ошибки сборки из Build панели
   - Ошибки из Chrome DevTools (`chrome://inspect`)

2. Проверьте файлы:
   ```bash
   ls -la android/app/src/main/java/com/taskhub/app/
   ```
   Должны быть:
   - MainActivity.java
   - StripePaymentPlugin.java

3. Убедитесь, что в MainActivity.java есть строка:
   ```java
   registerPlugin(StripePaymentPlugin.class);
   ```

4. Проверьте версию Capacitor:
   ```bash
   npm list @capacitor/core @capacitor/android
   ```
