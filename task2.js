const express=require('express');
const mysql=require('mysql2');
const PORT=5000;
const app1=express();
app1.use(express.json()); 

const con=mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"Sql@2024",
    database:"Assesment"
});

// database connection
con.connect((err)=>{
    if(err){
        console.console.error('Database connection failed');
    }
    console.log("connected!")
});

//fetch table
app1.get('/',(req,res)=>{
    const tableName='employees';


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
        res.status(200).json(rows);
    });

});
});
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

app1.listen(PORT,()=>{
    console.log(`server is running on http://localhost:${PORT}`);
});


