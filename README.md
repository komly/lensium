# Appium Inspector

Современная альтернатива официальному Appium Inspector с улучшенным интерфейсом и дополнительными возможностями.

## 🚀 Возможности

- ✅ **Управление сессиями**: Подключение к активным Appium сессиям
- ✅ **Настраиваемая глубина**: Выбор `snapshotMaxDepth` для дерева элементов  
- ✅ **Интерактивное дерево**: Навигация по UI элементам
- ✅ **Скриншот + наложение**: Визуализация элементов на скриншоте устройства
- ✅ **Клик-селект**: Выбор элементов кликом по canvas
- ✅ **Генерация селекторов**: Автоматическое создание локаторов
- ✅ **Примеры кода**: Python и Java код для найденных элементов
- ✅ **Копирование в буфер**: Быстрое копирование селекторов

## 📋 Требования

- **Appium Server** запущен на `localhost:4723`
- **macOS** (Intel или Apple Silicon)
- Активная Appium сессия для инспекции

## 🔧 API Подключение

### Development режим
```bash
pnpm dev
# API: http://localhost:5173 → proxy → http://localhost:4723
```

### Electron приложение  
```bash
# API: прямое подключение к http://localhost:4723
open "release/mac/Appium Inspector.app"
```

### ⚠️ Важно для Electron
- Убедитесь что **Appium Server запущен** на порту 4723
- Проверьте что нет блокировки CORS
- При проблемах с подключением проверьте Developer Tools в приложении

## 🛠️ Разработка

```bash
# Установка зависимостей
pnpm install

# Запуск в development режиме
pnpm dev

# Запуск Electron с hot reload
pnpm electron:dev

# Сборка production версии
pnpm electron:build
```

## 🏗️ Архитектура

- **Frontend**: React 18 + TypeScript + Tailwind CSS v4
- **Desktop**: Electron 37 + electron-builder
- **Build**: Vite 5 + TypeScript
- **API**: Прямое подключение к Appium REST API

## 📱 Поддерживаемые платформы

- **iOS**: XCUITest элементы
- **Android**: UIAutomator2 элементы  
- **Универсальные**: Accessibility ID, XPath селекторы
