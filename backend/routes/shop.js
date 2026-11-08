/**
 * ROYAL RP - /api/shop   (public catalogue)
 */
import { Router } from 'express';
import { db } from '../database/db.js';
import { asyncRoute, validate, schemas, z, notFound } from '../middleware/index.js';
import { validateCoupon } from '../services/orders.js';

const router = Router();

function shapeProduct(r) {
  return {
    id: r.id,
    slug: r.slug,
    category: r.category_id,
    name: r.name,
    nameFa: r.name_fa,
    short: r.short,
    shortFa: r.short_fa,
    description: r.description,
    features: db.json(r.features, []),
    image: r.image,
    gallery: db.json(r.gallery, []),
    price: Number(r.price),
    oldPrice: r.old_price === null ? null : Number(r.old_price),
    currency: r.currency,
    stock: r.stock,
    maxPerOrder: r.max_per_order,
    duration: r.duration,
    badge: r.badge,
    featured: !!r.featured,
    popular: !!r.popular,
    deliveryNote: r.delivery_note
    // delivery_type and delivery_payload are deliberately NOT exposed:
    // the client has no business knowing how fulfilment works.
  };
}

/* ---------- categories ---------- */
router.get('/categories', asyncRoute(async (req, res) => {
  const rows = await db.all(
    'SELECT * FROM categories WHERE visible = 1 ORDER BY sort_order, name'
  );
  res.json({
    items: rows.map(c => ({
      id: c.id, slug: c.slug, name: c.name, nameFa: c.name_fa, icon: c.icon
    }))
  });
}));

/* ---------- products ---------- */
const listSchema = z.object({
  category: z.string().trim().max(32).optional(),
  featured: z.coerce.boolean().optional(),
  popular: z.coerce.boolean().optional(),
  q: z.string().trim().max(80).optional(),
  sort: z.enum(['popular', 'newest', 'priceAsc', 'priceDesc', 'name']).default('popular'),
  page: schemas.page,
  limit: z.coerce.number().int().min(1).max(200).default(60)
});

router.get('/products', validate(listSchema, 'query'), asyncRoute(async (req, res) => {
  const q = req.validatedQuery;

  const clauses = ['visible = 1'];
  const params = [];
  if (q.category && q.category !== 'all') { clauses.push('category_id = ?'); params.push(q.category); }
  if (q.featured) clauses.push('featured = 1');
  if (q.popular) clauses.push('popular = 1');
  if (q.q) {
    clauses.push('(name LIKE ? OR name_fa LIKE ? OR short LIKE ?)');
    const like = `%${q.q}%`;
    params.push(like, like, like);
  }

  const ORDER = {
    popular:   'popular DESC, featured DESC, sort_order, price DESC',
    newest:    'created_at DESC',
    priceAsc:  'price ASC',
    priceDesc: 'price DESC',
    name:      'name ASC'
  };

  const whereSql = ' WHERE ' + clauses.join(' AND ');
  const total = Number(await db.scalar(`SELECT COUNT(*) AS n FROM products${whereSql}`, params)) || 0;

  const { limit, offset, page } = db.paginate(q.page, q.limit, 200);
  const rows = await db.all(
    `SELECT * FROM products${whereSql} ORDER BY ${ORDER[q.sort]} LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  res.json({
    items: rows.map(shapeProduct),
    total, page, perPage: limit, pages: Math.max(1, Math.ceil(total / limit))
  });
}));

router.get('/products/:slug', asyncRoute(async (req, res) => {
  const slug = String(req.params.slug).slice(0, 80);
  const row = await db.get(
    'SELECT * FROM products WHERE (slug = ? OR id = ?) AND visible = 1',
    [slug, slug]
  );
  if (!row) throw notFound('That product does not exist or is no longer on sale');

  const related = await db.all(
    'SELECT * FROM products WHERE category_id = ? AND id != ? AND visible = 1 ORDER BY popular DESC LIMIT 4',
    [row.category_id, row.id]
  );

  res.json({ ...shapeProduct(row), related: related.map(shapeProduct) });
}));

/* ---------- coupon check ----------
   Returns only what the UI needs to preview a discount. The real
   discount is recalculated server-side when the order is created,
   so a tampered response changes nothing.                        */
router.post('/coupon/validate',
  validate(z.object({
    code: z.string().trim().max(32),
    subtotal: z.coerce.number().min(0).optional().default(0)
  })),
  asyncRoute(async (req, res) => {
    const coupon = await validateCoupon(req.body.code, {
      subtotal: req.body.subtotal,
      userId: req.user?.id ?? null
    });
    res.json({ coupon });
  })
);

export default router;
