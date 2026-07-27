import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env, RetailerRow, RetailerData, ShipInfo, CsvCol } from './types';
import { DEFAULT_CSV_COLS } from './types';

const app = new Hono<{ Bindings: Env }>();

app.use('*', async (c, next) => {
  const mw = cors({
    origin: (origin) => {
      const allowed = c.env.ALLOWED_ORIGIN || '*';
      if (allowed === '*') return origin || '*';
      const list = allowed.split(',').map((s) => s.trim());
      return list.includes(origin || '') ? origin : list[0];
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
  });
  return mw(c, next);
});

app.get('/api/health', (c) => c.json({ ok: true }));

// ---------------------------------------------------------------------------
// retailers
// ---------------------------------------------------------------------------

type RetailerDbRow = {
  id: string;
  name: string;
  toknm: string;
  dept: string;
  mkcd: string;
  zip: string;
  tel: string;
  fax: string;
  addr: string;
  ship_json: string;
  csv_cols_json: string;
};

function rowToRetailer(row: RetailerDbRow): RetailerRow {
  return {
    id: row.id,
    name: row.name,
    toknm: row.toknm,
    dept: row.dept,
    mkcd: row.mkcd,
    zip: row.zip,
    tel: row.tel,
    fax: row.fax,
    addr: row.addr,
    ship: JSON.parse(row.ship_json) as ShipInfo,
    csvCols: JSON.parse(row.csv_cols_json) as CsvCol[],
  };
}

app.get('/api/retailers', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT id, name, toknm, dept, mkcd, zip, tel, fax, addr, ship_json, csv_cols_json FROM retailers ORDER BY sort_order ASC, created_at ASC'
  ).all<RetailerDbRow>();
  return c.json(results.map(rowToRetailer));
});

app.post('/api/retailers', async (c) => {
  const body = await c.req.json<{ name?: string }>().catch(() => ({} as { name?: string }));
  const name = (body.name || '').trim();
  if (!name) return c.json({ error: '小売店名を入力してください' }, 400);

  const existing = await c.env.DB.prepare('SELECT id FROM retailers WHERE name = ?').bind(name).first();
  if (existing) return c.json({ error: '同名の小売店が既にあります' }, 409);

  const id = 'R' + crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  const maxOrderRow = await c.env.DB.prepare('SELECT MAX(sort_order) as m FROM retailers').first<{ m: number | null }>();
  const sortOrder = (maxOrderRow?.m ?? -1) + 1;

  const ship: ShipInfo = { datc: '2', denymd: '', gyono: '1', tokcd: '', event: '販促POP', mknm: '' };
  const data: RetailerData = {
    masters: { stores: [], categories: [], products: [] },
    sheets: [
      {
        id: 'S' + Date.now(),
        name: '黒丸表A',
        unitOptions: [4, 5, 6, 7, 8],
        cats: [],
        delivery: {},
        units: {},
        manual: {},
      },
    ],
    templates: [],
    shelfImages: {},
    productThumbs: {},
  };

  await c.env.DB.prepare(
    `INSERT INTO retailers (id, sort_order, name, toknm, dept, mkcd, zip, tel, fax, addr, ship_json, csv_cols_json, data_json)
     VALUES (?, ?, ?, ?, '', '999', '', '', '', '', ?, ?, ?)`
  )
    .bind(id, sortOrder, name, name, JSON.stringify(ship), JSON.stringify(DEFAULT_CSV_COLS), JSON.stringify(data))
    .run();

  const row = await c.env.DB.prepare(
    'SELECT id, name, toknm, dept, mkcd, zip, tel, fax, addr, ship_json, csv_cols_json FROM retailers WHERE id = ?'
  )
    .bind(id)
    .first<RetailerDbRow>();
  return c.json(rowToRetailer(row!), 201);
});

app.put('/api/retailers/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json<Partial<RetailerRow>>().catch(() => ({} as Partial<RetailerRow>));
  const existing = await c.env.DB.prepare('SELECT id FROM retailers WHERE id = ?').bind(id).first();
  if (!existing) return c.json({ error: 'not found' }, 404);

  const fields: string[] = [];
  const values: unknown[] = [];
  const simple: (keyof RetailerRow)[] = ['name', 'toknm', 'dept', 'mkcd', 'zip', 'tel', 'fax', 'addr'];
  for (const key of simple) {
    if (body[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(body[key]);
    }
  }
  if (body.ship !== undefined) {
    fields.push('ship_json = ?');
    values.push(JSON.stringify(body.ship));
  }
  if (body.csvCols !== undefined) {
    fields.push('csv_cols_json = ?');
    values.push(JSON.stringify(body.csvCols));
  }
  if (fields.length === 0) return c.json({ error: 'no fields to update' }, 400);
  fields.push("updated_at = datetime('now')");
  values.push(id);
  await c.env.DB.prepare(`UPDATE retailers SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();

  const row = await c.env.DB.prepare(
    'SELECT id, name, toknm, dept, mkcd, zip, tel, fax, addr, ship_json, csv_cols_json FROM retailers WHERE id = ?'
  )
    .bind(id)
    .first<RetailerDbRow>();
  return c.json(rowToRetailer(row!));
});

app.delete('/api/retailers/:id', async (c) => {
  const id = c.req.param('id');
  const count = await c.env.DB.prepare('SELECT COUNT(*) as n FROM retailers').first<{ n: number }>();
  if ((count?.n ?? 0) <= 1) return c.json({ error: '最後の1件は削除できません' }, 400);
  await c.env.DB.prepare('DELETE FROM retailers WHERE id = ?').bind(id).run();
  return c.json({ ok: true });
});

// ---------------------------------------------------------------------------
// retailer data blob (masters + sheets + templates)
// ---------------------------------------------------------------------------

app.get('/api/retailers/:id/data', async (c) => {
  const id = c.req.param('id');
  const row = await c.env.DB.prepare('SELECT data_json FROM retailers WHERE id = ?').bind(id).first<{ data_json: string }>();
  if (!row) return c.json({ error: 'not found' }, 404);
  const parsed = JSON.parse(row.data_json) as Partial<RetailerData>;
  const data: RetailerData = {
    masters: parsed.masters || { stores: [], categories: [], products: [] },
    sheets: parsed.sheets || [],
    templates: parsed.templates || [],
    shelfImages: parsed.shelfImages || {},
    productThumbs: parsed.productThumbs || {},
  };
  return c.json(data);
});

app.put('/api/retailers/:id/data', async (c) => {
  const id = c.req.param('id');
  const existing = await c.env.DB.prepare('SELECT id FROM retailers WHERE id = ?').bind(id).first();
  if (!existing) return c.json({ error: 'not found' }, 404);
  const body = await c.req.json<RetailerData>().catch(() => null);
  if (!body || !body.masters || !Array.isArray(body.sheets)) {
    return c.json({ error: 'invalid payload' }, 400);
  }
  await c.env.DB.prepare("UPDATE retailers SET data_json = ?, updated_at = datetime('now') WHERE id = ?")
    .bind(JSON.stringify(body), id)
    .run();
  return c.json({ ok: true });
});

// ---------------------------------------------------------------------------
// images (shelf-rule photos, product thumbnails) -> R2
// ---------------------------------------------------------------------------

app.post('/api/retailers/:id/images', async (c) => {
  const retailerId = c.req.param('id');
  const form = await c.req.parseBody();
  const file = form['file'];
  if (!(file instanceof File)) return c.json({ error: 'file field required' }, 400);
  if (file.size > 2 * 1024 * 1024) return c.json({ error: 'ファイルサイズが大きすぎます（最大2MB）' }, 400);

  const ext = (file.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
  const key = `${retailerId}/${crypto.randomUUID()}.${ext}`;
  const buf = await file.arrayBuffer();
  await c.env.IMAGES.put(key, buf, { httpMetadata: { contentType: file.type || 'application/octet-stream' } });
  return c.json({ key, url: `/api/images/${key}` }, 201);
});

app.get('/api/images/*', async (c) => {
  const key = c.req.path.replace(/^\/api\/images\//, '');
  const obj = await c.env.IMAGES.get(key);
  if (!obj) return c.notFound();
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('etag', obj.httpEtag);
  headers.set('cache-control', 'public, max-age=31536000, immutable');
  return new Response(obj.body, { headers });
});

export default app;
