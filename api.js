const express = require('express');
const path = require('path');
const mysql = require('mysql2/promise');
const js2xmlparser = require('js2xmlparser');
const PORT = 5000;
const app1 = express();
app1.use(express.json());
require('dotenv').config();
const tableName="employees";


// Database connection pools for different databases
const employeePool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE1,  
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const departmentsPool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE2,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});
//  to check for table existence
app1.use(async (req, res, next) => {
    try {
        const [result] = await employeePool.query(`SHOW TABLES LIKE '${tableName}'`);
        if (result.length === 0) {
            return res.status(404).send(`Table "${tableName}" does not exist`);
        }
        console.log(`Table ${tableName} exists`);
        next();
    } catch (err) {
        console.error('Error checking table existence:', err);
        res.status(500).send('Error checking table existence');
    }
});

// setting custom headers
app1.use((req, res, next) => {
    res.set("X-Powered-By", "Employees API");
    res.set("X-Developer", "sreeja");
    next();
});

// Validation  for employee data
const validateEmployeeData = (req, res, next) => {
    const { first_name, last_name, email, department_name } = req.body;

    const nameRegex = /^[A-Za-z\s]{2,20}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!first_name || !nameRegex.test(first_name)) {
        return res.status(400).json({
            status: "error",
            error_code: "INVALID_FIRST_NAME",
            message: "First name must contain only letters and spaces, and be 2-20 characters long"
        });
    }
    if (!last_name || !nameRegex.test(last_name)) {
        return res.status(400).json({
            status: "error",
            error_code: "INVALID_LAST_NAME",
            message: "Last name must contain only letters and spaces, and be 2-20 characters long"
        });
    }
    if (!email || !emailRegex.test(email)) {
        return res.status(400).json({
            status: "error",
            error_code: "INVALID_EMAIL",
            message: "Please provide a valid email address"
        });
    }
    if (!department_name || !nameRegex.test(department_name)) {
        return res.status(400).json({
            status: "error",
            error_code: "INVALID_DEPARTMENT_NAME",
            message: "Department name must contain only letters and spaces, and be 2-20 characters long"
        });
    }

    next();
};

// format response based on Accept header
const formatResponse = (req, res, next) => {
    res.formatResponse = (data) => {
        const acceptHeader = req.headers['accept'] || 'application/json';

        if (acceptHeader.includes('application/json')) {
            res.setHeader('X-Response-Type', 'JSON');
            return res.json(data);
        }
        if (acceptHeader.includes('text/html')) {
            res.setHeader('X-Response-Type', 'HTML');
            let htmlResponse = '<h1>Employee List</h1><table border="1"><tr><th>Employee ID</th><th>First Name</th><th>Last Name</th><th>Email</th><th>Department Name</th></tr>';
            data.forEach(emp => {
                htmlResponse += `<tr><td>${emp.employee_id}</td><td>${emp.first_name}</td><td>${emp.last_name}</td><td>${emp.email}</td><td>${emp.department_name}</td></tr>`;
            });
            htmlResponse += '</table>';
            return res.send(htmlResponse);
        }
        if (acceptHeader.includes('text/plain')) {
            res.setHeader('X-Response-Type', 'Plain Text');
            let textResponse = 'Employee List:\n';
            data.forEach(emp => {
                textResponse += `ID: ${emp.employee_id}, Name: ${emp.first_name} ${emp.last_name}, Email: ${emp.email}, Department Name: ${emp.department_name}\n`;
            });
            return res.send(textResponse);
        }
        if (acceptHeader.includes('application/xml')) {
            res.setHeader('X-Response-Type', 'XML');
            const xmlResponse = js2xmlparser.parse('employees', { employee: data });
            return res.header('Content-Type', 'application/xml').send(xmlResponse);
        }

        // Default to JSON
        res.setHeader('X-Response-Type', 'JSON');
        return res.json(data);
    };
    next();
};

// Create employee by POST method
app1.post('/api/employees', validateEmployeeData, async (req, res) => {
    try {
        const { first_name, last_name, email, department_name } = req.body;
        const insertQuery = `INSERT INTO employees (first_name, last_name, email, department_name) VALUES (?, ?, ?, ?)`;
        const [result] = await employeePool.query(insertQuery, [first_name, last_name, email, department_name]);

        res.status(201).json({
            status: "success",
            message: `Employee added successfully with employee_id: ${result.insertId}`
        });
    } catch (err) {
        console.error('Error inserting an employee:', err);
        res.status(500).json({
            status: "error",
            error_code: "INTERNAL_SERVER_ERROR",
            message: "Error inserting an employee",
    
        });
    }
});
app1.get('/',(req,res)=>{
    res.sendFile(path.join(__dirname,'public','nodedb.html'));
})
// Read employee by their columns using GET method
app1.get("/api/employees", formatResponse, async (req, res) => {
    const { employee_id, first_name, last_name, email, department_name } = req.query;

    let queryBase = "SELECT * FROM employees WHERE 1=1";
    const conditions = [];
    const params = [];

    if (employee_id) {
        conditions.push("employee_id = ?");
        params.push(employee_id);
    }
    if (first_name && first_name.trim() !== "") {
        conditions.push("first_name LIKE ?");
        params.push(`%${first_name}%`);
    }
    if (last_name && last_name.trim() !== "") {
        conditions.push("last_name LIKE ?");
        params.push(`%${last_name}%`);
    }
    if (email && email.trim() !== "") {
        conditions.push("email LIKE ?");
        params.push(`%${email}%`);
    }
    if (department_name && department_name.trim() !== "") {
        conditions.push("department_name = ?");
        params.push(department_name);
    }

    if (conditions.length > 0) {
        queryBase += " AND " + conditions.join(" AND ");
    }

    try {
        const [result] = await employeePool.query(queryBase, params);

        if (result.length === 0) {
            return res.status(404).json({
                status: "error",
                error_code: "NOT_FOUND",
                message: "No employees found matching the criteria"
            });
        }

        res.formatResponse(result);
    } catch (err) {
        console.error('Error fetching employees:', err);
        res.status(500).json({
            status: "error",
            error_code: "INTERNAL_SERVER_ERROR",
            message: "Error fetching employees"
        });
    }
});

// Updating employee by PUT method
app1.put('/api/employees/:employee_id', async (req, res) => {
    const { employee_id } = req.params;
    const { first_name, last_name, department_name } = req.body;

    // Reject updating employee_id or email
    if (req.body.hasOwnProperty('email') || req.body.hasOwnProperty('employee_id')) {
        return res.status(400).json({
            status: "error",
            error_code: "INVALID_UPDATE",
            message: "Updating email or employee_id is not allowed"
        });
    }

    // Prepare columns to be updated
    const fieldsToUpdate = [];
    const values = [];

    if (first_name) {
        fieldsToUpdate.push("first_name = ?");
        values.push(first_name);
    }

    if (last_name) {
        fieldsToUpdate.push("last_name = ?");
        values.push(last_name);
    }

    if (department_name) {
        fieldsToUpdate.push("department_name = ?");
        values.push(department_name);
    }

    // If no valid fields to update are provided
    if (fieldsToUpdate.length === 0) {
        return res.status(400).json({
            status: "error",
            error_code: "MISSING_FIELDS",
            message: "At least one field (first_name, last_name, department_name) must be provided for update"
        });
    }
    values.push(employee_id);

    const updateQuery = `
        UPDATE employees
        SET ${fieldsToUpdate.join(", ")}
        WHERE employee_id = ?`;

    try {
        const [result] = await employeePool.query(updateQuery, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: "error",
                error_code: "NOT_FOUND",
                message: `Employee with ID ${employee_id} not found`
            });
        }

        res.status(200).json({
            status: "success",
            message: `Employee with ID ${employee_id} successfully updated`
        });
    } catch (err) {
        console.error('Error updating employee:', err);
        res.status(500).json({
            status: "error",
            error_code: "INTERNAL_SERVER_ERROR",
            message: "Error updating employee",
            sql_error: err.message
        });
    }
});


// Delete employee by DELETE method
app1.delete("/api/employees/:employee_id", async (req, res) => {
    const { employee_id } = req.params;

    if (!employee_id) {
        return res.status(400).json({
            status: "error",
            error_code: "MISSING_EMPLOYEE_ID",
            message: "Please provide an employee_id"
        });
    }

    const deleteQuery = "DELETE FROM employees WHERE employee_id = ?";

    try {
        const [result] = await employeePool.query(deleteQuery, [employee_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: "error",
                error_code: "EMPLOYEE_NOT_FOUND",
                message: `Employee with ID ${employee_id} not found`
            });
        }

        res.status(200).json({
            status: "success",
            message: `Employee with ID ${employee_id} deleted successfully`
        });
    } catch (err) {
        console.error('Error deleting employee:', err);
        res.status(500).json({
            status: "error",
            error_code: "INTERNAL_SERVER_ERROR",
            message: "Error deleting employee"
        });
    }
});
// Department CRUD Operations

// Create department in departments_db
app1.post('/api/departments', async (req, res) => {
    const { department_name } = req.body;
    if (!department_name) {
        return res.status(400).json({
            status: "error",
            error_code: "INVALID_DEPARTMENT_NAME",
            message: "Department name is required"
        });
    }

    const insertQuery = `INSERT INTO departments (department_name) VALUES (?)`;
    try {
        const [result] = await departmentsPool.query(insertQuery, [department_name]);
        res.status(201).json({
            status: "success",
            message: `Department "${department_name}" created successfully with department_id: ${result.insertId}`
        });
    } catch (err) {
        console.error('Error creating department:', err);
        res.status(500).json({
            status: "error",
            error_code: "INTERNAL_SERVER_ERROR",
            message: "Error creating department",
            sql_error: err.message
        });
    }
});
// Route to get all departments
app1.get("/api/departments", async (req, res) => {
    try {
        const [result] = await departmentsPool.query("SELECT * FROM departments");

        if (result.length === 0) {
            return res.status(404).json({
                status: "error",
                error_code: "NOT_FOUND",
                message: "No departments found"
            });
        }

        res.status(200).json(result);
    } catch (err) {
        console.error('Error fetching departments:', err);
        res.status(500).json({
            status: "error",
            error_code: "INTERNAL_SERVER_ERROR",
            message: "Error fetching departments"
        });
    }
});

// Read department from departments_db
app1.get("/api/departments/:department_id", async (req, res) => {
    const { department_id } = req.params;

    try {
        
        const [result] = await departmentsPool.query("SELECT * FROM departments WHERE department_id = ?", [department_id]);

        if (result.length === 0) {
            return res.status(404).json({
                status: "error",
                error_code: "NOT_FOUND",
                message: `Department with ID ${department_id} not found`
            });
        }

        res.status(200).json(result[0]); 
    } catch (err) {
        console.error('Error fetching department:', err);
        res.status(500).json({
            status: "error",
            error_code: "INTERNAL_SERVER_ERROR",
            message: "Error fetching department"
        });
    }
});

// Update department in departments_db
app1.put('/api/departments/:department_id', async (req, res) => {
    const { department_id } = req.params;
    const { department_name } = req.body;

    if (!department_name) {
        return res.status(400).json({
            status: "error",
            error_code: "INVALID_DEPARTMENT_NAME",
            message: "Department name is required"
        });
    }

    const updateQuery = `UPDATE departments SET department_name = ? WHERE department_id = ?`;

    try {
        const [result] = await departmentsPool.query(updateQuery, [department_name, department_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: "error",
                error_code: "NOT_FOUND",
                message: `Department with ID ${department_id} not found`
            });
        }

        res.status(200).json({
            status: "success",
            message: `Department with ID ${department_id} successfully updated`
        });
    } catch (err) {
        console.error('Error updating department:', err);
        res.status(500).json({
            status: "error",
            error_code: "INTERNAL_SERVER_ERROR",
            message: "Error updating department"
        });
    }
});

// Delete department from departments_db
app1.delete("/api/departments/:department_id", async (req, res) => {
    const { department_id } = req.params;

    const deleteQuery = "DELETE FROM departments WHERE department_id = ?";

    try {
        const [result] = await departmentsPool.query(deleteQuery, [department_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: "error",
                error_code: "DEPARTMENT_NOT_FOUND",
                message: `Department with ID ${department_id} not found`
            });
        }

        res.status(200).json({
            status: "success",
            message: `Department with ID ${department_id} deleted successfully`
        });
    } catch (err) {
        console.error('Error deleting department:', err);
        res.status(500).json({
            status: "error",
            error_code: "INTERNAL_SERVER_ERROR",
            message: "Error deleting department"
        });
    }
});
app1.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        status: "error",
        error_code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred"
    });
});

app1.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
