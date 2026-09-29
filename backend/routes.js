const pool = require('./server.js')
const express = require('express');
const app = express();



app.get('/users', async (req , res) =>{
    try{
    const {rows} = await pool.query("SELECT * FROM public.users;");
    if(rows.length===0){
      res.status(404).send({'error':'no data found in the treat'});
 }       
 res.status(200).json(rows);
 } catch{
res.status(500).send({'errror':'unable to reach the data base'});
 
}});

app.get('/stock', async (req , res) =>{
    try{
    const {rows} = await pool.query("SELECT * FROM public.stock;");
    if(rows.length===0){
      res.status(404).send({'error':'no data found in the treat'});
 }       
 res.status(200).json(rows);
 } catch{
res.status(500).send({'errror':'unable to reach the data base'});
 }});

app.get('/vendors', async (req , res) =>{
    try {
    const {rows} = await pool.query("SELECT * FROM public.vendors;");
        res.send(rows).json
        if(rows.length===0){
      res.status(404).send({'error':'no data found in the treat'});
 }       
 res.status(200).json(rows);
 } catch{
res.status(500).send({'errror':'unable to reach the data base'});
 }});

app.listen(3000,()=>{
console.log("server is runing on http://localhost:3000")});