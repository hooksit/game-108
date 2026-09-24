# Игра «108» — Браузерная карточная игра

Современная многопользовательская карточная игра на базе React, TypeScript, Node.js и Socket.IO.

## Быстрый запуск локально

1. Установка зависимостей:
```bash
npm install
npm --prefix shared install
npm --prefix server install
npm --prefix client install
```

2. Сборка общего пакета типов:
```bash
npm --prefix shared run build
```

3. Запуск тестов игрового движка:
```bash
npm test
```

4. Запуск в режиме разработки:
- В терминале 1 (сервер):
  ```bash
  npm run dev
  ```
- В терминале 2 (клиент Vite):
  ```bash
  npm run dev:client
  ```

Игра откроется в браузере по адресу `http://localhost:5173`.

---

## Запуск в Production (Docker / Ubuntu 24.04)

```bash
docker compose up -d --build
```
Игра будет доступна по адресу `http://<IP_СЕРВЕРА>:3000`.

---

## Документация проекта

- 📖 **[PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md)** — полное описание проекта, правила игры «108», архитектура и хронология доработок интерфейса.
- 🤖 **[AGENTS.md](./AGENTS.md)** — контекст и техническое руководство для AI-ассистентов (архитектура, стейт-машина, тесты).
- 🚀 **[DEPLOY_UBUNTU.md](./DEPLOY_UBUNTU.md)** — пошаговая инструкция по настройке Ubuntu 24.04, Docker, Nginx и SSL/HTTPS.

