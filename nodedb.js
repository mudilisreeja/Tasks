const express = require('express');
const mysql = require('mysql2/promise'); 
const PORT = 5002;
const app1 = express();
app1.use(express.json());
require('dotenv').config();
const tableName = 'employees';
const js2xmlparser = require('js2xmlparser');

// Database connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

//  to check for table existence
app1.use(async (req, res, next) => {
    try {
        const [result] = await pool.query(`SHOW TABLES LIKE '${tableName}'`);
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
        const [result] = await pool.query(insertQuery, [first_name, last_name, email, department_name]);

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
            sql_error: err.message
        });
    }
});

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
        const [result] = await pool.query(queryBase, params);

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

    if (req.body.hasOwnProperty('email') || req.body.hasOwnProperty('newEmployeeId')) {
        return res.status(400).json({
            status: "error",
            error_code: "INVALID_UPDATE",
            message: "Updating email or employee_id is not allowed"
        });
    }

    const updateQuery = `
        UPDATE employees
        SET first_name = ?, last_name = ?, department_name = ?
        WHERE employee_id = ?`;

    try {
        const [result] = await pool.query(updateQuery, [first_name, last_name, department_name, employee_id]);

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
        const [result] = await pool.query(deleteQuery, [employee_id]);

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

// Error handling middleware
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