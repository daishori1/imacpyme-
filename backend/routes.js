const pool = require('./server.js')
const express = require('express');
const path = require('path');
const { google } = require('googleapis');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);

const app = express();

app.set('trust proxy', 1);
app.get('/', (req, res) => res.redirect('/login.html'));

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

app.use(express.json());

app.use(session({
    store: new pgSession({
        pool: pool,
        tableName: 'session'
    }),
    secret: process.env.SESSION_SECRET || 'dev-secret-cambia-esto',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 8, // 8 horas
        secure: process.env.NODE_ENV === 'production'
    }
}));

function requireAuth(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/login.html');
    }
    next();
}

app.get('/auth/google', (req, res) => {
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['openid', 'email', 'profile']
    });
    res.redirect(url);
});

app.get('/auth/google/callback', async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.status(400).send({ error: 'missing authorization code' });
    }

    try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        const ticket = await oauth2Client.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();

        if (!payload.email_verified) {
            return res.redirect('/login.html?error=unverified');
        }

        const email = payload.email.toLowerCase();

        const { rows } = await pool.query(
            'SELECT * FROM public.users WHERE LOWER(email) = $1 AND active = true;',
            [email]
        );

        if (rows.length === 0) {
            return res.redirect('/login.html?error=unauthorized');
        }

        req.session.user = {
            id: rows[0].users_id,
            name: rows[0].name,
            email: rows[0].email,
            rol: rows[0].rol
        };

        res.redirect('/main.html');

    } catch (err) {
        console.error(err);
        res.redirect('/login.html?error=server');
    }
});

// VENDORS
app.post('/vendors', requireAuth, async (req, res) => {
    const { name, email, phone, active } = req.body;
    if (!name || !email) {
        return res.status(400).send({ error: 'name and email are required' });
    }
    try {
        const { rows } = await pool.query(
            `INSERT INTO public.vendors (name, email, phone, active)
             VALUES ($1, $2, $3, $4) RETURNING *;`,
            [name, email, phone || null, active === true]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).send({ error: 'email already exists' });
        }
        res.status(500).send({ error: 'unable to reach the database' });
    }
});

// USERS
app.post('/users', requireAuth, async (req, res) => {
    const { name, email, phone, rol, active } = req.body;
    if (!name || !email || !rol) {
        return res.status(400).send({ error: 'name, email and rol are required' });
    }
    try {
        const { rows } = await pool.query(
            `INSERT INTO public.users (name, email, phone, rol, active)
             VALUES ($1, $2, $3, $4, $5) RETURNING *;`,
            [name, email, phone || null, rol, active === true]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).send({ error: 'email already exists' });
        }
        res.status(500).send({ error: 'unable to reach the database' });
    }
});

// STOCK
app.post('/stock', requireAuth, async (req, res) => {
    const { product_name, serial_number, brand, stock, cost, owner, location, vendor, users_id } = req.body;
    if (!product_name || !serial_number || !brand || stock == null || cost == null || !owner || !users_id) {
        return res.status(400).send({ error: 'missing required fields' });
    }
    try {
        const { rows } = await pool.query(
            `INSERT INTO public.stock
                (product_name, serial_number, brand, stock, cost, owner, location, vendor, users_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *;`,
            [product_name, serial_number, brand, stock, cost, owner, location || null, vendor || null, users_id]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).send({ error: 'serial number already exists' });
        }
        res.status(500).send({ error: 'unable to reach the database' });
    }
});

// UPDATE VENDOR
app.put('/vendors/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, active } = req.body;
    try {
        const { rows } = await pool.query(
            `UPDATE public.vendors
             SET name = $1, email = $2, phone = $3, active = $4
             WHERE vendor_id = $5 RETURNING *;`,
            [name, email, phone || null, active === true, id]
        );
        if (rows.length === 0) return res.status(404).send({ error: 'vendor not found' });
        res.status(200).json(rows[0]);
    } catch (err) {
        if (err.code === '23505') return res.status(409).send({ error: 'email already exists' });
        res.status(500).send({ error: 'unable to reach the database' });
    }
});

// UPDATE USER
app.put('/users/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, rol, active } = req.body;
    try {
        const { rows } = await pool.query(
            `UPDATE public.users
             SET name = $1, email = $2, phone = $3, rol = $4, active = $5
             WHERE users_id = $6 RETURNING *;`,
            [name, email, phone || null, rol, active === true, id]
        );
        if (rows.length === 0) return res.status(404).send({ error: 'user not found' });
        res.status(200).json(rows[0]);
    } catch (err) {
        if (err.code === '23505') return res.status(409).send({ error: 'email already exists' });
        res.status(500).send({ error: 'unable to reach the database' });
    }
});

// UPDATE STOCK (dispara updated_at, aparece en "últimos movimientos")
app.put('/stock/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    const { product_name, serial_number, brand, stock, cost, owner, location, min_stock, max_stock } = req.body;
    try {
        const { rows } = await pool.query(
            `UPDATE public.stock
             SET product_name = $1, serial_number = $2, brand = $3, stock = $4,
                 cost = $5, owner = $6, location = $7, min_stock = $8, max_stock = $9
             WHERE item_id = $10 RETURNING *;`,
            [product_name, serial_number, brand, stock, cost, owner, location || null, min_stock, max_stock, id]
        );
        if (rows.length === 0) return res.status(404).send({ error: 'item not found' });
        res.status(200).json(rows[0]);
    } catch (err) {
        if (err.code === '23505') return res.status(409).send({ error: 'serial number already exists' });
        res.status(500).send({ error: 'unable to reach the database' });
    }
});

app.get('/vendors/:id', requireAuth, async (req, res) => {
    try {
        const { rows } = await pool.query(`SELECT * FROM public.vendors WHERE vendor_id = $1;`, [req.params.id]);
        if (rows.length === 0) return res.status(404).send({ error: 'vendor not found' });
        res.status(200).json(rows[0]);
    } catch {
        res.status(500).send({ error: 'unable to reach the database' });
    }
});

app.get('/users/:id', requireAuth, async (req, res) => {
    try {
        const { rows } = await pool.query(`SELECT * FROM public.users WHERE users_id = $1;`, [req.params.id]);
        if (rows.length === 0) return res.status(404).send({ error: 'user not found' });
        res.status(200).json(rows[0]);
    } catch {
        res.status(500).send({ error: 'unable to reach the database' });
    }
});

app.patch('/vendors/:id/active', requireAuth, async (req, res) => {
    const { active } = req.body;
    try {
        const { rows } = await pool.query(
            `UPDATE public.vendors SET active = $1 WHERE vendor_id = $2 RETURNING *;`,
            [active, req.params.id]
        );
        if (rows.length === 0) return res.status(404).send({ error: 'vendor not found' });
        res.status(200).json(rows[0]);
    } catch {
        res.status(500).send({ error: 'unable to reach the database' });
    }
});

app.patch('/users/:id/active', requireAuth, async (req, res) => {
    const { active } = req.body;
    try {
        const { rows } = await pool.query(
            `UPDATE public.users SET active = $1 WHERE users_id = $2 RETURNING *;`,
            [active, req.params.id]
        );
        if (rows.length === 0) return res.status(404).send({ error: 'user not found' });
        res.status(200).json(rows[0]);
    } catch {
        res.status(500).send({ error: 'unable to reach the database' });
    }
});

app.get('/main.html', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/main.html'));
});

app.get('/users.html', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/users.html'));
});

app.get('/stock.html', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/stock.html'));
});

app.get('/vendors.html', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/vendors.html'));
});

app.get('/users-add.html', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/users-add.html'));
});

app.get('/vendors-add.html', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/vendors-add.html'));
});

app.get('/stock-add.html', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/stock-add.html'));
});

app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/users', requireAuth, async (req, res) => {
    try {
        const { rows } = await pool.query("SELECT * FROM public.users;");
        if (rows.length === 0) {
            return res.status(404).send({ 'error': 'no data found in the treat' });
        }
        res.status(200).json(rows);
    } catch {
        res.status(500).send({ 'error': 'unable to reach the database' });
    }
});

app.get('/stock', requireAuth, async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT s.*, v.name AS vendor_name
            FROM public.stock s
            LEFT JOIN public.vendors v ON v.vendor_id = s.vendor
            ORDER BY s.item_id;
        `);
        if (rows.length === 0) return res.status(404).send({ error: 'no data found' });
        res.status(200).json(rows);
    } catch {
        res.status(500).send({ error: 'unable to reach the database' });
    }
});

app.get('/vendors', requireAuth, async (req, res) => {
    try {
        const { rows } = await pool.query("SELECT * FROM public.vendors;");
        if (rows.length === 0) {
            return res.status(404).send({ 'error': 'no data found in the treat' });
        }
        res.status(200).json(rows);
    } catch {
        res.status(500).send({ 'error': 'unable to reach the database' });
    }
});

app.get('/stock/recent', requireAuth, async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT item_id, product_name, brand, stock, cost, location, create_at, updated_at
            FROM public.stock
            ORDER BY updated_at DESC
            LIMIT 10;
        `);
        res.status(200).json(rows);
    } catch {
        res.status(500).send({ error: 'unable to reach the database' });
    }
});

app.get('/stock/summary', requireAuth, async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT brand, SUM(cost * stock) AS total_value
            FROM public.stock
            GROUP BY brand
            ORDER BY total_value DESC;
        `);
        res.status(200).json(rows);
    } catch {
        res.status(500).send({ error: 'unable to reach the database' });
    }
});

app.get('/auth/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login.html');
    });
});

app.get('/api/me', requireAuth, (req, res) => {
    res.json(req.session.user);
});

app.get('/stock/low', requireAuth, async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT item_id, product_name, brand, stock, min_stock, max_stock,
                   CASE
                       WHEN stock < min_stock THEN 'low'
                       WHEN stock > max_stock THEN 'high'
                   END AS alert_type
            FROM public.stock
            WHERE stock < min_stock OR stock > max_stock
            ORDER BY stock ASC;
        `);
        res.status(200).json(rows);
    } catch {
        res.status(500).send({ error: 'unable to reach the database' });
    }
});

app.get('/dashboard/stats', requireAuth, async (req, res) => {
    try {
        const [stockTotals, vendorsCount, usersCount] = await Promise.all([
            pool.query(`SELECT COUNT(*) AS items, COALESCE(SUM(stock),0) AS total_units, COALESCE(SUM(stock*cost),0) AS total_value FROM public.stock;`),
            pool.query(`SELECT COUNT(*) AS count FROM public.vendors WHERE active = true;`),
            pool.query(`SELECT COUNT(*) AS count FROM public.users WHERE active = true;`)
        ]);

        res.status(200).json({
            total_items: stockTotals.rows[0].items,
            total_units: stockTotals.rows[0].total_units,
            total_value: stockTotals.rows[0].total_value,
            active_vendors: vendorsCount.rows[0].count,
            active_users: usersCount.rows[0].count
        });
    } catch {
        res.status(500).send({ error: 'unable to reach the database' });
    }
});

app.post('/stock/notify-low', requireAuth, async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT item_id, product_name, stock, min_stock, max_stock,
                   CASE
                       WHEN stock < min_stock THEN 'low'
                       WHEN stock > max_stock THEN 'high'
                   END AS alert_type
            FROM public.stock
            WHERE stock < min_stock OR stock > max_stock
            ORDER BY stock ASC;
        `);

        if (rows.length === 0) {
            return res.status(200).send({ message: 'no stock alerts, no notification sent' });
        }

        const lowItems = rows.filter(r => r.alert_type === 'low');
        const highItems = rows.filter(r => r.alert_type === 'high');

        let content = ` **Stock Alert** — ${rows.length} item(s) need attention:\n\n`;

        if (lowItems.length > 0) {
            content += `**⬇ Below minimum:**\n`;
            content += lowItems.map(r => `• ${r.product_name} — ${r.stock} units (min: ${r.min_stock})`).join('\n');
            content += '\n\n';
        }

        if (highItems.length > 0) {
            content += `**⬆ Overstocked:**\n`;
            content += highItems.map(r => `• ${r.product_name} — ${r.stock} units (max: ${r.max_stock})`).join('\n');
        }

        await fetch(process.env.DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content })
        });

        res.status(200).send({ message: 'notification sent', count: rows.length });

    } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'failed to send notification' });
    }
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(5050, () => {
        console.log("server is running on http://localhost:5050");
    });
}

module.exports = app;