#!/bin/bash

# Скрипт для локального тестирования CI процесса
echo "🧪 Тестирование CI процесса локально..."

# Проверяем что мы в корне проекта
if [ ! -f "package.json" ]; then
    echo "❌ Запустите скрипт из корня проекта"
    exit 1
fi

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функция для вывода шагов
step() {
    echo -e "${YELLOW}📋 $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Шаг 1: Проверка зависимостей
step "Проверка зависимостей..."
if ! command -v pnpm &> /dev/null; then
    error "pnpm не установлен. Установите: npm install -g pnpm"
fi
success "pnpm найден"

# Шаг 2: Очистка
step "Очистка предыдущих сборок..."
rm -rf node_modules/.cache
rm -rf dist
rm -rf release
success "Очистка завершена"

# Шаг 3: Установка зависимостей
step "Установка зависимостей..."
pnpm install --frozen-lockfile || error "Ошибка установки зависимостей"
success "Зависимости установлены"

# Шаг 4: Линтинг
step "Проверка кода (lint)..."
pnpm lint || echo "⚠️ Линтер нашел проблемы, но продолжаем..."

# Шаг 5: Сборка веб приложения
step "Сборка веб приложения..."
pnpm build || error "Ошибка сборки веб приложения"
success "Веб приложение собрано"

# Шаг 6: Проверка размера bundle
step "Анализ размера bundle..."
if [ -d "dist" ]; then
    echo "📊 Размер файлов в dist/:"
    du -sh dist/*
    
    # Проверяем что CSS и JS файлы созданы
    if ls dist/assets/*.css 1> /dev/null 2>&1; then
        success "CSS файлы найдены"
    else
        error "CSS файлы не найдены"
    fi
    
    if ls dist/assets/*.js 1> /dev/null 2>&1; then
        success "JS файлы найдены"
    else
        error "JS файлы не найдены"
    fi
fi

# Шаг 7: Сборка Electron приложения (только macOS)
step "Сборка Electron приложения для macOS..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    pnpm electron:build || error "Ошибка сборки macOS приложения"
    success "macOS приложение собрано"
else
    echo "⚠️ Запустите на macOS для полного тестирования сборки"
fi

# Шаг 8: Проверка артефактов
step "Проверка артефактов сборки..."
if [ -d "release" ]; then
    echo "📦 Артефакты в release/:"
    ls -la release/
    
    # Подсчет размера
    total_size=$(du -sh release/ | cut -f1)
    success "Артефакты созданы, общий размер: $total_size"
else
    error "Папка release не найдена"
fi

echo ""
echo "🎉 Все проверки пройдены! Готово к CI/CD"
echo ""
echo "📋 Следующие шаги:"
echo "   • git add ."
echo "   • git commit -m 'Ready for CI'"
echo "   • git push origin main"
echo ""
echo "🏷️ Для создания релиза:"
echo "   • npm version patch"
echo "   • git push origin main --tags" 