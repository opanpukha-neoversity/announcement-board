import express from 'express';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();
const PORT = 3000;
const PER_PAGE = 10;

const categories = {
  sale: 'Продаж',
  service: 'Послуги',
  job: 'Робота',
  other: 'Інше',
};

function formatDate(date) {
  return new Intl.DateTimeFormat('uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function truncate(text, maxLength = 100) {
  if (!text) return '';
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
}

function buildPageUrl(page, search, sort) {
  const params = new URLSearchParams();
  params.set('page', String(page));

  if (search) {
    params.set('search', search);
  }

  if (sort) {
    params.set('sort', sort);
  }

  return `/?${params.toString()}`;
}

function validateAnnouncement(data) {
  const errors = {};
  const validCategories = ['sale', 'service', 'job', 'other'];
  const { title, description, price, category, contactInfo } = data;

  if (!validCategories.includes(category)) {
    errors.category = 'Оберіть категорію';
  }

  if (!title || title.trim().length < 5) {
    errors.title = 'Назва має бути не менше 5 символів';
  } else if (title.trim().length > 100) {
    errors.title = 'Назва має бути не більше 100 символів';
  }

  if (!description || description.trim().length < 10) {
    errors.description = 'Опис має бути не менше 10 символів';
  }

  if (!price || Number.isNaN(Number(price)) || Number(price) <= 0) {
    errors.price = 'Ціна має бути додатним числом';
  }

  if (!contactInfo || contactInfo.trim().length < 5) {
    errors.contactInfo = 'Контактна інформація має бути не менше 5 символів';
  }

  return errors;
}

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

app.locals.categories = categories;
app.locals.formatDate = formatDate;
app.locals.truncate = truncate;

app.get('/', async (req, res, next) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const sort = req.query.sort === 'oldest' ? 'oldest' : 'newest';
    const pageFromQuery = Number(req.query.page);
    const currentPage = Number.isInteger(pageFromQuery) && pageFromQuery > 0 ? pageFromQuery : 1;

    const where = {};

    if (search) {
      where.title = {
        contains: search,
      };
    }

    const orderBy = {
      createdAt: sort === 'oldest' ? 'asc' : 'desc',
    };

    const total = await prisma.announcement.count({ where });
    const totalPages = Math.ceil(total / PER_PAGE);
    const skip = (currentPage - 1) * PER_PAGE;

    const announcements = await prisma.announcement.findMany({
      where,
      orderBy,
      skip,
      take: PER_PAGE,
    });

    res.render('index', {
      announcements,
      search,
      sort,
      currentPage,
      totalPages,
      buildPageUrl,
    });
  } catch (error) {
    next(error);
  }
});

app.get('/announcements', (req, res) => {
  res.render('new', {
    errors: {},
    data: null,
  });
});

app.post('/announcements', async (req, res, next) => {
  try {
    const errors = validateAnnouncement(req.body);

    if (Object.keys(errors).length > 0) {
      return res.status(400).render('new', {
        errors,
        data: req.body,
      });
    }

    const announcement = await prisma.announcement.create({
      data: {
        category: req.body.category,
        title: req.body.title.trim(),
        description: req.body.description.trim(),
        price: Number(req.body.price),
        contactInfo: req.body.contactInfo.trim(),
      },
    });

    res.redirect(`/announcements/${announcement.id}`);
  } catch (error) {
    next(error);
  }
});

app.get('/announcements/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(404).render('404', {
        message: 'Оголошення не знайдено',
      });
    }

    const announcement = await prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      return res.status(404).render('404', {
        message: 'Оголошення не знайдено',
      });
    }

    res.render('announcement', { announcement });
  } catch (error) {
    next(error);
  }
});

app.delete('/announcements/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(404).end();
    }

    await prisma.announcement.delete({
      where: { id },
    });

    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

// 404 Handler
app.use((req, res) => {
  res.status(404).render('404', {
    message: 'Сторінку не знайдено',
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('error');
});

app.listen(PORT, () => {
  console.log(`Server running: http://localhost:${PORT}`);
});
