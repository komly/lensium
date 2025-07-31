# CI/CD Pipeline

## 🚀 Автоматическая сборка в GitHub Actions

### 📋 Доступные Workflows

#### 1. **Build Electron App** (`.github/workflows/build.yml`)
**Триггеры:**
- Push в ветки `main`, `develop`  
- Pull Request в `main`

**Что делает:**
- ✅ Собирает приложение для **macOS** (Intel + Apple Silicon)
- ✅ Загружает артефакты сборки в GitHub
- ✅ Проверяет код линтером

#### 2. **Release** (`.github/workflows/release.yml`)
**Триггеры:**
- Push тега в формате `v*.*.*` (например, `v1.0.0`)

**Что делает:**
- ✅ Собирает финальные версии для macOS
- ✅ Автоматически создает GitHub Release
- ✅ Прикрепляет DMG файлы к релизу

## 📦 Артефакты сборки

### macOS
- `Appium Inspector-{version}.dmg` - Intel Mac установщик
- `Appium Inspector-{version}-arm64.dmg` - Apple Silicon установщик

## 🔄 Процесс релиза

### 1. Создание релиза
```bash
# 1. Обновите версию в package.json
npm version patch  # или minor/major

# 2. Создайте и отправьте тег
git push origin main --tags

# 3. GitHub Actions автоматически:
#    - Соберет приложения
#    - Создаст релиз  
#    - Прикрепит файлы
```

### 2. Ручной релиз через GitHub UI
1. Перейдите в **Releases** на GitHub
2. Нажмите **Create a new release**
3. Создайте тег в формате `v1.0.0`
4. GitHub Actions запустится автоматически

## ⚙️ Настройка проекта

### Локальная разработка
```bash
# Установка зависимостей
pnpm install

# Запуск в dev режиме с hot reload
pnpm electron:dev

# Сборка для текущей платформы
pnpm electron:build
```

### Требования для CI
- ✅ Node.js 20
- ✅ pnpm 8
- ✅ GitHub Token (автоматически предоставляется)

## 🛠️ Кастомизация

### Изменение триггеров
Отредактируйте секцию `on` в workflow файлах:
```yaml
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
```

## 🐛 Troubleshooting

### Сборка падает на macOS
- Проверьте настройки code signing в `package.json`
- Убедитесь что DMG creation не требует дополнительных разрешений

### Артефакты не загружаются
- Проверьте что пути в `uses: actions/upload-artifact@v4` корректные
- Убедитесь что DMG файлы действительно создались

## 📈 Статистика сборки

GitHub Actions показывает:
- ⏱️ Время сборки каждой платформы
- 📊 Размер артефактов
- ✅/❌ Статус каждого шага
- 📋 Логи для отладки

## 🔐 Безопасность

- ✅ Используется `actions/checkout@v4` (последняя версия)
- ✅ pnpm устанавливается с фиксированной версией
- ✅ Зависимости кешируются для ускорения
- ✅ GitHub Token передается безопасно через secrets 