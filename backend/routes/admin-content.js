/**
 * ROYAL RP - /api/admin  (content management)
 * ---------------------------------------------------------------
 * The CRUD the owner needs to run the site without touching code:
 * staff list, gallery, FAQ, rules, media library and file uploads.
 *
 * Mounted by routes/admin.js. Every route re-checks its permission
 * server-side, same as the rest of the panel.
 * ---------------------------------------------------------------
 */
import { Router } from 'express';
import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { db } from '../database/db.js';
import { config, ROOT } from '../config/index.js';
import {
  asyncRoute, requirePermission, validate, z,
  limitWrites, notFound, badRequest
} from '../middleware/index.js';
import { audit } from '../services/logger.js';
import { stripTags, slugify } from '../utils/index.js';

const router = Router();

/* ===============================================================
   UPLOADS
   Stored under backend/uploads and served at /uploads.
   The extension is derived from the detected MIME type, never from
   the filename the browser sent, so a .php cannot sneak through.
   =============================================================== */
const EXT = {
  'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp',
  'image/gif': '.gif', 'image/svg+xml': '.svg',
  'video/mp4': '.mp4', 'video/webm': '.webm', 'application/pdf': '.pdf'
};

const storage = multer.diskStorage({
  destination(req, file, cb) {
    fs.mkdirSync(config.uploads.dir, { recursive: true });
    cb(null, config.uploads.dir);
  },
  filename(req, file, cb) {
    const ext = EXT[file.mimetype] || '';
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: config.uploads.maxBytes, files: config.uploads.maxFiles },
  fileFilter(req, file, cb) {
    if (!config.uploads.allowedMime.includes(file.mimetype)) {
      return cb(new Error(`نوع فایل مجاز نیست: ${file.mimetype}`));
    }
    cb(null, true);
  }
});

router.post('/upload', requirePermission('content.write'), limitWrites,
  upload.array('files', config.uploads.maxFiles),
  asyncRoute(async (req, res) => {
    const files = (req.files || []).map(f => ({
      name: f.originalname,
      url: `/uploads/${f.filename}`,
      size: f.size,
      mime: f.mimetype
    }));
    if (!files.length) throw badRequest('هیچ فایلی ارسال نشد', 'no_files');
    await audit(req, { action: 'media.upload', target: `${files.length} file(s)`, after: files.map(f => f.url) });
    res.status(201).json({ files });
  })
);

/* ---------------------------------------------------------------
   MEDIA LIBRARY
   Lists what is already in /assets plus anything uploaded, so the
   product editor can pick an existing image instead of re-uploading.
   --------------------------------------------------------------- */
const MEDIA_DIRS = [
  ['assets/images/products',    'محصولات'],
  ['assets/images/gta',         'GTA'],
  ['assets/images/vehicles',    'خودروها'],
  ['assets/images/characters',  'شخصیت‌ها'],
  ['assets/images/backgrounds', 'پس‌زمینه‌ها'],
  ['assets/images/staff',       'تیم'],
  ['assets/gifs',               'متحرک'],
  ['assets/vectors',            'وکتور']
];

router.get('/media', requirePermission('content.write'), asyncRoute(async (req, res) => {
  const groups = [];

  for (const [rel, label] of MEDIA_DIRS) {
    const dir = path.join(ROOT, rel);
    if (!fs.existsSync(dir)) continue;
    const items = fs.readdirSync(dir)
      .filter(f => /\.(svg|png|jpe?g|webp|gif)$/i.test(f))
      .sort()
      .map(f => ({
        name: f,
        url: `${rel}/${f}`,
        size: fs.statSync(path.join(dir, f)).size
      }));
    if (items.length) groups.push({ label, dir: rel, items });
  }

  // Uploaded files
  if (fs.existsSync(config.uploads.dir)) {
    const items = fs.readdirSync(config.uploads.dir)
      .filter(f => /\.(svg|png|jpe?g|webp|gif)$/i.test(f))
      .sort().reverse()
      .map(f => ({
        name: f,
        url: `/uploads/${f}`,
        size: fs.statSync(path.join(config.uploads.dir, f)).size
      }));
    if (items.length) {
      groups.unshift({ label: 'آپلودشده', dir: 'uploads', items });
    }
  }

  res.json({ groups, total: groups.reduce((n, g) => n + g.items.length, 0) });
}));

/* ===============================================================
   STAFF
   =============================================================== */
const staffSchema = z.object({
  name: z.string().trim().min(2).max(64),
  tag: z.string().trim().max(64).nullish(),
  role: z.string().trim().min(2).max(24),
  bio: z.string().trim().max(600).nullish(),
  bioFa: z.string().trim().max(600).nullish(),
  avatar: z.string().trim().max(255).nullish(),
  since: z.string().trim().max(16).nullish(),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  visible: z.coerce.boolean().default(true)
});

router.get('/staff', requirePermission('content.write'), asyncRoute(async (req, res) => {
  const rows = await db.all('SELECT * FROM staff_members ORDER BY sort_order, name');
  res.json({
    items: rows.map(r => ({
      id: r.id, name: r.name, tag: r.tag, role: r.role,
      bio: r.bio, bioFa: r.bio_fa, avatar: r.avatar,
      since: r.since, sortOrder: r.sort_order, visible: !!r.visible
    }))
  });
}));

router.post('/staff', requirePermission('content.write'), limitWrites,
  validate(staffSchema), asyncRoute(async (req, res) => {
    const b = req.body;
    const r = await db.run(
      `INSERT INTO staff_members (name, tag, role, bio, bio_fa, avatar, since, sort_order, visible)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [stripTags(b.name), b.tag ?? null, b.role, b.bio ?? null, b.bioFa ?? null,
       b.avatar ?? 'assets/images/staff/staff-generic.svg', b.since ?? null,
       b.sortOrder, b.visible ? 1 : 0]
    );
    await audit(req, { action: 'staff.create', target: `staff:${r.lastId}`, after: b });
    res.status(201).json({ ok: true, id: r.lastId });
  })
);

router.patch('/staff/:id', requirePermission('content.write'), limitWrites,
  validate(staffSchema.partial()), asyncRoute(async (req, res) => {
    const id = Number(req.params.id) || 0;
    const before = await db.get('SELECT * FROM staff_members WHERE id = ?', [id]);
    if (!before) throw notFound('عضو پیدا نشد');

    const COLS = { name: 'name', tag: 'tag', role: 'role', bio: 'bio',
                   bioFa: 'bio_fa', avatar: 'avatar', since: 'since', sortOrder: 'sort_order' };
    const sets = [], params = [];
    for (const [k, col] of Object.entries(COLS)) {
      if (req.body[k] !== undefined) { sets.push(`${col} = ?`); params.push(req.body[k]); }
    }
    if (req.body.visible !== undefined) { sets.push('visible = ?'); params.push(req.body.visible ? 1 : 0); }
    if (!sets.length) return res.json({ ok: true, unchanged: true });

    params.push(id);
    await db.run(`UPDATE staff_members SET ${sets.join(', ')} WHERE id = ?`, params);
    await audit(req, { action: 'staff.update', target: `staff:${id}`, before: { name: before.name }, after: req.body });
    res.json({ ok: true });
  })
);

router.delete('/staff/:id', requirePermission('content.write'), limitWrites, asyncRoute(async (req, res) => {
  const id = Number(req.params.id) || 0;
  const before = await db.get('SELECT id, name FROM staff_members WHERE id = ?', [id]);
  if (!before) throw notFound('عضو پیدا نشد');
  await db.run('DELETE FROM staff_members WHERE id = ?', [id]);
  await audit(req, { action: 'staff.delete', target: `staff:${id}`, before });
  res.json({ ok: true });
}));

/* ===============================================================
   GALLERY
   =============================================================== */
const gallerySchema = z.object({
  src: z.string().trim().min(3).max(255),
  title: z.string().trim().max(160).nullish(),
  titleFa: z.string().trim().max(160).nullish(),
  tag: z.string().trim().max(32).nullish(),
  size: z.enum(['', 'wide', 'tall']).nullish(),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  visible: z.coerce.boolean().default(true)
});

router.get('/gallery', requirePermission('content.write'), asyncRoute(async (req, res) => {
  const rows = await db.all('SELECT * FROM gallery ORDER BY sort_order, id DESC');
  res.json({
    items: rows.map(r => ({
      id: r.id, src: r.src, title: r.title, titleFa: r.title_fa,
      tag: r.tag, size: r.size, sortOrder: r.sort_order, visible: !!r.visible
    }))
  });
}));

router.post('/gallery', requirePermission('content.write'), limitWrites,
  validate(gallerySchema), asyncRoute(async (req, res) => {
    const b = req.body;
    const r = await db.run(
      `INSERT INTO gallery (src, title, title_fa, tag, size, sort_order, visible, created_at)
       VALUES (?,?,?,?,?,?,?,?)`,
      [b.src, b.title ?? null, b.titleFa ?? null, b.tag ?? null,
       b.size || null, b.sortOrder, b.visible ? 1 : 0, db.now()]
    );
    await audit(req, { action: 'gallery.create', target: `gallery:${r.lastId}`, after: b });
    res.status(201).json({ ok: true, id: r.lastId });
  })
);

router.patch('/gallery/:id', requirePermission('content.write'), limitWrites,
  validate(gallerySchema.partial()), asyncRoute(async (req, res) => {
    const id = Number(req.params.id) || 0;
    const COLS = { src: 'src', title: 'title', titleFa: 'title_fa',
                   tag: 'tag', size: 'size', sortOrder: 'sort_order' };
    const sets = [], params = [];
    for (const [k, col] of Object.entries(COLS)) {
      if (req.body[k] !== undefined) { sets.push(`${col} = ?`); params.push(req.body[k] || null); }
    }
    if (req.body.visible !== undefined) { sets.push('visible = ?'); params.push(req.body.visible ? 1 : 0); }
    if (!sets.length) return res.json({ ok: true, unchanged: true });
    params.push(id);
    const r = await db.run(`UPDATE gallery SET ${sets.join(', ')} WHERE id = ?`, params);
    if (!r.changes) throw notFound('تصویر پیدا نشد');
    await audit(req, { action: 'gallery.update', target: `gallery:${id}`, after: req.body });
    res.json({ ok: true });
  })
);

router.delete('/gallery/:id', requirePermission('content.write'), limitWrites, asyncRoute(async (req, res) => {
  const id = Number(req.params.id) || 0;
  const r = await db.run('DELETE FROM gallery WHERE id = ?', [id]);
  if (!r.changes) throw notFound('تصویر پیدا نشد');
  await audit(req, { action: 'gallery.delete', target: `gallery:${id}` });
  res.json({ ok: true });
}));

/* ===============================================================
   FAQ + RULES
   Stored as JSON blobs in `settings` so they can be edited from the
   panel without a migration. The public site reads them through
   GET /api/content/faq and /api/content/rules.
   =============================================================== */
const faqSchema = z.object({
  items: z.array(z.object({
    cat: z.string().trim().max(32).default('general'),
    q: z.string().trim().min(3).max(300),
    a: z.string().trim().min(3).max(4000)
  })).max(200)
});

router.get('/faq', requirePermission('content.write'), asyncRoute(async (req, res) => {
  const row = await db.get('SELECT value FROM settings WHERE key_name = ?', ['content.faq']);
  res.json({ items: db.json(row?.value, []) });
}));

router.put('/faq', requirePermission('content.write'), limitWrites,
  validate(faqSchema), asyncRoute(async (req, res) => {
    const clean = req.body.items.map(i => ({
      cat: i.cat, q: stripTags(i.q), a: stripTags(i.a)
    }));
    await db.upsert('settings', {
      key_name: 'content.faq',
      value: JSON.stringify(clean),
      updated_at: db.now(),
      updated_by: req.user.id
    }, ['key_name']);
    await audit(req, { action: 'faq.update', target: `${clean.length} entries` });
    res.json({ ok: true, count: clean.length });
  })
);

const rulesSchema = z.object({
  sections: z.array(z.object({
    id: z.string().trim().max(32),
    icon: z.string().trim().max(32).default('shield'),
    title: z.string().trim().min(2).max(160),
    intro: z.string().trim().max(600).nullish(),
    items: z.array(z.object({
      n: z.string().trim().max(10),
      t: z.string().trim().min(2).max(200),
      d: z.string().trim().max(2000),
      p: z.string().trim().max(200).nullish()
    })).max(60)
  })).max(30)
});

router.get('/rules', requirePermission('content.write'), asyncRoute(async (req, res) => {
  const row = await db.get('SELECT value FROM settings WHERE key_name = ?', ['content.rules']);
  res.json({ sections: db.json(row?.value, []) });
}));

router.put('/rules', requirePermission('content.write'), limitWrites,
  validate(rulesSchema), asyncRoute(async (req, res) => {
    await db.upsert('settings', {
      key_name: 'content.rules',
      value: JSON.stringify(req.body.sections),
      updated_at: db.now(),
      updated_by: req.user.id
    }, ['key_name']);
    await audit(req, { action: 'rules.update', target: `${req.body.sections.length} sections` });
    res.json({ ok: true });
  })
);

export default router;
