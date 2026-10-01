const pool = require('./server.js')
const express = require('express');
const path = require('path');
const app = express();



app.use(express.json());

// VENDORS
app.post('/vendors', async (req, res) => {
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
app.post('/users', async (req, res) => {
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
app.post('/stock', async (req, res) => {
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



app.use(express.static(path.join(__dirname, '../frontend')));
app.get('/users', async (req , res) =>{
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
app.get('/stock', async (req , res) =>{
    try{
    const {rows} = await pool.query("SELECT * FROM public.stock;");
    if(rows.length===0){
    return  res.status(404).send({'error':'no data found in the treat'});
 }       
 res.status(200).json(rows);
 } catch{
res.status(500).send({'errror':'unable to reach the data base'});
 }});

app.get('/vendors', async (req , res) =>{
    try {
    const {rows} = await pool.query("SELECT * FROM public.vendors;");
        if(rows.length===0){
       return res.status(404).send({'error':'no data found in the treat'});
 }       
 res.status(200).json(rows);
 } catch{
res.status(500).send({'errror':'unable to reach the data base'});
 }});

app.get('/stock/recent', async (req, res) => {
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


app.listen(5050,()=>{
console.log("server is runing on http://localhost:3000")});
