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

## 📦 Установка

### Скачать готовую сборку
1. Перейдите в [Releases](../../releases)
2. Скачайте `.dmg` файл для вашей архитектуры:
   - Intel Mac: `Appium Inspector-{version}.dmg`
   - Apple Silicon: `Appium Inspector-{version}-arm64.dmg`
3. Установите перетаскиванием в Applications

### Сборка из исходников
```bash
# Клонируйте репозиторий
git clone <repository-url>
cd appium

# Установите зависимости  
pnpm install

# Соберите приложение
pnpm electron:build
```

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

## 🔄 CI/CD Pipeline

### 🚀 Автоматическая сборка
GitHub Actions автоматически собирает приложение для **macOS**:
- **Intel Mac** (x64)
- **Apple Silicon** (ARM64)

### 📋 Доступные Workflows
- **Build**: Сборка на каждый push/PR
- **Release**: Автоматический релиз по тегам

### 🏷️ Создание релиза
```bash
# Обновите версию
npm version patch

# Отправьте тег 
git push origin main --tags

# GitHub Actions автоматически создаст релиз!
```

📖 **Подробная документация**: [CI/CD Guide](docs/CI-CD.md)

## 🏗️ Архитектура

- **Frontend**: React 18 + TypeScript + Tailwind CSS v4
- **Desktop**: Electron 37 + electron-builder
- **Build**: Vite 5 + TypeScript
- **API**: Прямое подключение к Appium REST API
- **CI/CD**: GitHub Actions + macOS builds

## 📱 Поддерживаемые платформы

- **iOS**: XCUITest элементы
- **Android**: UIAutomator2 элементы  
- **Универсальные**: Accessibility ID, XPath селекторы

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте feature ветку (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'Add amazing feature'`)
4. Push в ветку (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

GitHub Actions автоматически проверит вашу сборку!

## 📄 Лицензия

MIT License - см. [LICENSE](LICENSE) файл.
