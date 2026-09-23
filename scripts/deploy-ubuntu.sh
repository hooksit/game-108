#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "  🃏 Автоматическое развертывание игры «108» на Ubuntu 24.04"
echo "=========================================================="

# 1. Update packages
echo "📦 Обновление системных пакетов..."
sudo apt-get update -y

# 2. Check or install Docker and Docker Compose
if ! command -v docker &> /dev/null; then
    echo "🐳 Установка Docker..."
    sudo apt-get install -y ca-certificates curl gnupg
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg

    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    sudo usermod -aG docker "$USER"
    echo "✅ Docker успешно установлен!"
else
    echo "✅ Docker уже установлен."
fi

# 3. Build & Run Docker Container
echo "🚀 Сборка и запуск контейнера «108»..."
docker compose down || true
docker compose up -d --build

echo ""
echo "=========================================================="
echo "🎉 Игра «108» успешно развернута и запущена!"
echo "🌐 Порт: 3000 (http://<IP_СЕРВЕРА>:3000)"
echo "=========================================================="
echo ""
echo "Для подключения домена с SSL (HTTPS + WSS) используйте Nginx."
echo "Подробная инструкция в файле DEPLOY_UBUNTU.md"
