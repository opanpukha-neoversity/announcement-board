# Дошка оголошень

Навчальний Node.js застосунок на Express, EJS, Prisma та SQLite.

## Запуск

```bash
npm install
npx prisma migrate dev --name init
npm run dev
```

Після запуску відкрийте:

```text
http://localhost:3000
```

## Prisma Studio

```bash
npx prisma studio
```

## Функції

- список оголошень картками;
- пошук по назві;
- сортування за датою;
- пагінація по 10 оголошень;
- перегляд одного оголошення;
- створення оголошення з серверною валідацією;
- видалення через `fetch` з HTTP методом `DELETE`;
- сторінки 404 та 500.
