# 🚀 Быстрый старт Android приложения

## Шаг 1: Установка Android Studio

1. Скачайте Android Studio с [официального сайта](https://developer.android.com/studio)
2. Установите Android Studio
3. При первом запуске установите Android SDK (минимум API 24)

## Шаг 2: Открытие проекта

1. Запустите Android Studio
2. Выберите `File > Open`
3. Выберите папку `android-app`
4. Дождитесь синхронизации Gradle (может занять несколько минут при первом запуске)

## Шаг 3: Настройка эмулятора

1. В Android Studio откройте `Tools > Device Manager`
2. Нажмите `Create Device`
3. Выберите устройство (например, Pixel 5)
4. Выберите системный образ (рекомендуется API 34)
5. Завершите создание эмулятора

## Шаг 4: Запуск приложения

1. Убедитесь, что эмулятор запущен или подключено реальное устройство
2. Нажмите кнопку `Run` (зеленая стрелка) или `Shift+F10`
3. Приложение установится и запустится автоматически

## Альтернативный способ (через командную строку)

### Windows:
```bash
cd android-app
gradlew.bat assembleDebug
gradlew.bat installDebug
```

### Linux/Mac:
```bash
cd android-app
chmod +x gradlew
./gradlew assembleDebug
./gradlew installDebug
```

## Требования

- **JDK 17+** (проверьте: `java -version`)
- **Android SDK 24+**
- **Gradle 8.1+** (устанавливается автоматически)

## Решение проблем

### Ошибка: "SDK location not found"
Создайте файл `local.properties` в корне проекта:
```properties
sdk.dir=C\:\\Users\\YourUsername\\AppData\\Local\\Android\\Sdk
```

### Ошибка: "Gradle sync failed"
1. Проверьте подключение к интернету
2. В Android Studio: `File > Invalidate Caches / Restart`
3. Попробуйте: `File > Sync Project with Gradle Files`

### Ошибка: "No matching variant"
Обновите версии библиотек в `app/build.gradle` или используйте более новую версию Android Studio.

## Следующие шаги

После успешного запуска:
- Изучите код в `MainActivity.kt`
- Посмотрите структуру проекта в `README.md`
- Начните добавлять свой функционал!

---

**Удачи в разработке!** 🎉

