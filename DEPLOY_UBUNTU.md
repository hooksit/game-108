# Руководство по развертыванию игры «108» на Ubuntu 24.04 LTS

## 1. Загрузка проекта на сервер

Вы можете скопировать проект на сервер через `git`, `rsync` или `scp`:

```bash
# Пример копирования через scp с локального компьютера:
scp -r "c:\Users\Admin\Game 108" user@YOUR_SERVER_IP:/home/user/game-108
```

Либо склонировать репозиторий прямо на сервере:
```bash
git clone <URL_РЕПОЗИТОРИЯ> /home/user/game-108
cd /home/user/game-108
```

---

## 2. Способ А: Запуск через Docker Compose (Рекомендуемый)

На сервере Ubuntu 24.04 выполните скрипт авторазвертывания:
```bash
chmod +x scripts/deploy-ubuntu.sh
./scripts/deploy-ubuntu.sh
```

Либо запустите вручную:
```bash
docker compose up -d --build
```

Игра сразу станет доступна по адресу:
`http://<IP_ВАШЕГО_СЕРВЕРА>:3000`

---

## 3. Способ Б: Запуск напрямую через Node.js 22 + PM2

Если вы предпочитаете запуск без Docker:

```bash
# 1. Установка Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

# 2. Установка зависимостей и сборка
npm --prefix shared install && npm --prefix shared run build
npm --prefix client install && npm --prefix client run build
npm --prefix server install && npm --prefix server run build

# 3. Запуск через PM2 с автоперезапуском при сбоях и перезагрузке ОС
cd server
pm2 start dist/server.js --name "game-108"
pm2 save
pm2 startup
```

---

## 4. Настройка Nginx и HTTPS (Бесплатный SSL от Let's Encrypt)

Для открытия игры по домену с шифрованием WebSocket (WSS):

1. Установите Nginx и Certbot:
```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

2. Создайте конфигурационный файл `/etc/nginx/sites-available/game108`:
```nginx
server {
    server_name yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

3. Активируйте и перезапустите:
```bash
sudo ln -s /etc/nginx/sites-available/game108 /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

4. Получите бесплатный SSL-сертификат:
```bash
sudo certbot --nginx -d yourdomain.com
```

---

## 5. Проверка работы игры
1. Откройте браузер по адресу `http://<IP_СЕРВЕРА>:3000` (или `https://yourdomain.com`).
2. Введите имя игрока и выберите аватар.
3. Нажмите **«Создать новую комнату»** — появится 4-значный код комнаты (например, `GAME`).
4. Передайте код комнаты друзьям — они вводят свои имена и код, нажимая **«Войти по коду»**.
5. За столом отображаются все имена, оригинальные карты и атмосфера чайного стола!
