const pool = require('./server.js')
const express = require('express');
const path = require('path');
const { google } = require('googleapis');
const app = express();
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);


app.use(express.json());

const session = require('express-session');

app.use(session({
    secret: process.env.SESSION_SECRET || 'dev-secret-cambia-esto',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 8 // 8 horas
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
app.post('/vendors',requireAuth, async (req, res) => {
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
app.post('/users',requireAuth, async (req, res) => {
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
app.post('/stock',requireAuth, async (req, res) => {
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
app.get('/users',requireAuth , async (req , res) =>{
    try{
    const {rows} = await pool.query("SELECT * FROM public.users;");
    if(rows.length===0){
     return res.status(404).send({'error':'no data found in the treat'});
 }       
 res.status(200).json(rows);
 } catch{
res.status(500).send({'errror':'unable to reach the data base'});
 
}});
//get stock 
app.get('/stock',requireAuth, async (req , res) =>{
    try{
    const {rows} = await pool.query("SELECT * FROM public.stock;");
    if(rows.length===0){
    return  res.status(404).send({'error':'no data found in the treat'});
 }       
 res.status(200).json(rows);
 } catch{
res.status(500).send({'errror':'unable to reach the data base'});
 }});

app.get('/vendors',requireAuth, async (req , res) =>{
    try {
    const {rows} = await pool.query("SELECT * FROM public.vendors;");
        if(rows.length===0){
       return res.status(404).send({'error':'no data found in the treat'});
 }       
 res.status(200).json(rows);
 } catch{
res.status(500).send({'errror':'unable to reach the data base'});
 }});

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
        res.status(500).send({'error':'unable to reach the database'});
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
            SELECT item_id, product_name, brand, stock, min_stock
            FROM public.stock
            WHERE stock < min_stock
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

app.listen(5050,()=>{
console.log("server is runing on http://localhost:3000")});
