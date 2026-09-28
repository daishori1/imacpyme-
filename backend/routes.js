const pool = require('./server.js')
const express = require('express');
const app = express();



app.get('/users', async (req , res) =>{
    const {rows} = await pool.query("SELECT * FROM public.users;")
        res.send(rows).json
    
});

app.get('/stock', async (req , res) =>{
    const {rows} = await pool.query("SELECT * FROM public.stock;")
        res.send(rows).json
    
});
app.get('/vendors', async (req , res) =>{
    const {rows} = await pool.query("SELECT * FROM public.vendors;")
        res.send(rows).json
    
});
app.listen(3000,()=>{
console.log("server is runing on http://localhost:3000")});