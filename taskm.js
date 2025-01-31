const express=require('express');
const mysql=require('mysql2');
const PORT=3000;
const app1=express();
app1.use(express.json()); 
require('dotenv').config();
const con = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
});
// database connection
con.connect((err)=>{
    if(err){
        console.error('Database connection failed:',err.message);
        return
    }
    console.log("connected!");
});

//fetch table
app1.get('/',(req,res)=>{
    const tableName='employees';
    const format = req.query.format||'json';


//checking for table
const checkTableQuery=`SHOW TABLES LIKE'${tableName}'`;
con.query(checkTableQuery,(err,result)=>{
    if(err){
        return res.status(500).send('Error checking table existence');
    }
    if(result.length===0){
        return res.status(404).send(`Table "${tableName}" does not exist`);
    }

    //fetching data from table
    const fetchquery=`SELECT * FROM ${tableName}`;
    con.query(fetchquery,(err,rows)=>{
        if(err){
            console.error('MySQL error: ', err);
            return res.status(500).send('Error in fetching data from table')
        }
        if(rows.length===0){
            return res.status(404).send('No data found in the table');
        }
        // Handle  formats
        if (format === "json") {
            res.setHeader("Content-Type", "application/json");
            return res.json(rows); 
        } else if (format === "html") {
            res.setHeader("Content-Type", "text/html");
            return res.send(`<html><body><pre>${JSON.stringify(rows, null, 2)}</pre></body></html>`); 
        } else if (format === "text") {
            res.setHeader("Content-Type", "text/plain");
            return res.send(JSON.stringify(rows, null, 2));
        } else {
            return res.status(400).send("Invalid format. Use ?format=json, ?format=html, or ?format=text.");
        }
    
});
});});
//post method
app1.post('/', (req, res) => {
    const { employee_id, first_name, last_name, email, department_id } = req.body;
    console.log('Request Body:', req.body);

    
    if (!employee_id || !first_name || !last_name || !email || !department_id) {
        return res.status(400).send('Please provide employee_id, first_name, last_name, email, department_id');
    }

    
    const insertQuery = `INSERT INTO employees (employee_id, first_name, last_name, email, department_id) VALUES (?, ?, ?, ?, ?)`;

    
    con.query(insertQuery, [employee_id, first_name, last_name, email, department_id], (err, result) => {
        if (err) {
            console.error('Error inserting employee: ', err);
            return res.status(500).send('Error inserting employee');
        }

        
        res.set({
            'Content-Type': 'application/json'
        });

        
        res.status(201).send(`Employee added with ID: ${result.insertId}`);
    });
});
//put method
// Update details by employee_id
app1.put('/:employee_id', (req, res) => {
    const { employee_id } = req.params; 
    const { first_name, last_name, email, department_id } = req.body;

    console.log('Request Body:', req.body);

    if (!first_name || !last_name || !email || !department_id) {
        return res.status(400).send('Please provide first_name, last_name, email, and departmentt_id');
    }

    
    const updateQuery = `UPDATE employees
        SET first_name = ?, last_name = ?, email = ?, department_id = ?
        WHERE employee_id = ?`;

    
    con.query(updateQuery, [first_name, last_name, email, department_id, employee_id], (err, result) => {
        if (err) {
            console.error('Error updating employee: ', err);
            return res.status(500).send('Error updating employee');
        }

    
        if (result.affectedRows === 0) {
            return res.status(404).send(`Employee with ID ${employee_id} not found`);
        }

        res.status(200).send(`Employee with ID ${employee_id} successfully updated`);
    });
});
// Handling errors
app1.use((req, res, next) => {
    res.status(404).json({ error: "Oops! Page not found" });
});

app1.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Oops! Something went wrong' });
});

app1.listen(PORT,()=>{
    console.log(`server is running on http://localhost:${PORT}`);
});
