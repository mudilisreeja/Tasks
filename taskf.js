const express=require('express');
const mysql=require('mysql2');
const PORT=3000;
const app1=express();
app1.use(express.json());
require('dotenv').config();
const tableName='employees';
const js2xmlparser = require('js2xmlparser');
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

//checking for table
app1.use((req, res, next) => {
   const checkTableQuery=`SHOW TABLES LIKE'${tableName}'`;
   con.query(checkTableQuery,(err,result)=>{
      if(err){
         return res.status(500).send('Error checking table existence');
        }
      if(result.length===0){
          return res.status(404).send(`Table "${tableName}" does not exist`);
        }
       next();
       console.log(`Table ${tableName} exists`);

    
}); });
app1.use((req,res,next)=>{
    res.set("x-Powered-BY","Employees API");
    res.set("X-Developer","sreeja");
    next();
});
//create employee details by post method
app1.post('/api/employees', async (req, res) => {
    try {
        const { employee_id, first_name, last_name, email, department_id } = req.body;
        console.log('Request Body:', req.body);

        // Validation for required fields
        if (!employee_id || !first_name || !last_name || !email || !department_id) {
            return res.status(400).send('Please provide employee_id, first_name, last_name, email, department_id');
        }
        
        const insertQuery = `INSERT INTO employees (employee_id, first_name, last_name, email, department_id) VALUES (?, ?, ?, ?, ?)`;

        const [result] = await con.promise().query(insertQuery, [employee_id, first_name, last_name, email, department_id]);

        res.status(201).json({ message: `Employee added successfully`});

    } catch (err) {
        
        console.error('Error inserting employee:', err);
        return res.status(500).send('Duplicates found while  inserting  an employee');
    }
});

//Read  employee by their columns using GET method
app1.get("/api/employees",(req,res)=>{
    const { employee_id, first_name, last_name, email, department_id } = req.query;
    const queryBase = "SELECT * FROM employees WHERE 1=1";
    const conditions = [];
    const params = [];

    if (employee_id) {
       conditions.push("employee_id = ?");
       params.push(employee_id);
    }
    if (first_name) {
       conditions.push("first_name LIKE ?");
       params.push(`%${first_name}%`);
    }
    if(last_name){
      conditions.push (" last_name LIKE ?");
      params.push(`%${last_name}%`);
    }
    if(email){
      conditions.push ("email LIKE ?");
      params.push(`%${email}%`);
    }
    if(department_id){
      conditions.push ("department_id =?");
      params.push(department_id);
    }
    const query = conditions.length > 0 ? `${queryBase} AND ${conditions.join(" AND ")}` : queryBase;
    con.query(query,params, (err,result)=>{
        if(err){
            return res.status(500).send("error in fetching details");
        }
        if(result.length===0){
            return res.status(404).send("Employee not found");
        }
        const acceptHeader = req.headers['accept'];
        const responseSent = false;
        if (acceptHeader && acceptHeader.includes('application/json')) {
            res.setHeader('X-Response-Type', 'JSON');
            return res.json(result);
        }

        if (acceptHeader && acceptHeader.includes('text/html')) {
            res.setHeader('X-Response-Type', 'HTML');
            let htmlResponse = '<h1>Employee List</h1><table border="1"><tr><th>Employee ID</th><th>First Name</th><th>Last Name</th><th>Email</th><th>Department ID</th></tr>';
            result.forEach(emp => {
            htmlResponse += `<tr><td>${emp.employee_id}</td><td>${emp.first_name}</td><td>${emp.last_name}</td><td>${emp.email}</td><td>${emp.department_id}</td></tr>`;
            });
            htmlResponse += '</table>';
            return res.send(htmlResponse);
        }

        if (acceptHeader && acceptHeader.includes('text/plain')) {
            res.setHeader('X-Response-Type', 'Plain Text');
            let textResponse = 'Employee List:\n';
            result.forEach(emp => {
            textResponse += `ID: ${emp.employee_id}, Name: ${emp.first_name} ${emp.last_name}, Email: ${emp.email}, Department ID: ${emp.department_id}\n`;
            });
            return res.send(textResponse);
        }

        if (acceptHeader && acceptHeader.includes('application/xml')) {
            res.setHeader('X-Response-Type', 'XML');
            const xmlResponse = js2xmlparser.parse('employees', { employee: result });
            return res.header('Content-Type', 'application/xml').send(xmlResponse);
        }

        res.setHeader('X-Response-Type', 'JSON');
        return res.json(result);
          
        
    });
});     

// Update details by employee_id by using put method
app1.put('/api/employees/:employee_id', async (req, res) => {
    const { employee_id } = req.params; 
    const { first_name, last_name, email, department_id } = req.body;

    console.log('Request Body:', req.body);

    // Validate if all necessary fields are provided
    if (!first_name || !last_name || !email || !department_id) {
        return res.status(400).send("Please provide details for all the columns");
    }

    const updateQuery = `UPDATE employees
        SET first_name = ?, last_name = ?, email = ?, department_id = ?
        WHERE employee_id = ?`;

    try {
        // Use promise-based MySQL2 to execute the query
        const [result] = await con.promise().query(updateQuery, [first_name, last_name, email, department_id, employee_id]);

        // If no rows were affected, the employee ID doesn't exist
        if (result.affectedRows === 0) {
            return res.status(404).send(`Employee with ID ${employee_id} not found`);
        }

        // If the update is successful, return a success message
        res.status(200).send(`Employee with ID ${employee_id} successfully updated`);
    } catch (err) {
        // Catch any errors that occur during the database query
        console.error('Error updating employee: ', err);
        return res.status(500).send('Error updating employee');
    }
});

//Delete employee by DELETE method
app1.delete("/api/employees",(req,res)=>{
    const{ employee_id,first_name,last_name,email,salary,department_id}=req.query;
    const queryBase="DELETE FROM employees WHERE 1=1";
    const params = [];
    const conditions=[];
    if (employee_id) {
        conditions.push("employee_id = ?");
        params.push(employee_id);
     }
     if (first_name) {
        conditions.push("first_name LIKE ?");
        params.push(`%${first_name}%`);
     }
     if(last_name){
       conditions.push (" last_name LIKE ?");
       params.push(`%${last_name}%`);
     }
     if(email){
       conditions.push ("email LIKE ?");
       params.push(`%${email}%`);
     }
     if(department_id){
       conditions.push ("department_id =?");
       params.push(department_id);
     }
     if (conditions.length === 0) {
        return res.status(400).send("Please provide at least one parameter to delete");
    }
    
     const query = conditions.length > 0 ? `${queryBase} AND ${conditions.join(" AND ")}` : queryBase;
    
    con.query(query,params, (err,result)=>{
        if(err){
            return res.status(500).send("error in deleting employee");
        }
        if(result.length=== 0){
            return res.status(404).send("employee not found");
        }
        else{
            res.send("Employee deleted successfully");

        }

});
});

// Handling errors
app1.use((req, res) => {
    res.status(404).json({error: `Route not found: ${req.originalUrl}`});
});

app1.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Oops! Something went wrong' });
});

app1.listen(PORT,()=>{
    console.log(`server is running on http://localhost:${PORT}`);
});
