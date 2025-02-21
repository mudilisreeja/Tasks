// Function to scroll to a section smoothly
function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    window.scrollTo({
        top: element.offsetTop,
        behavior: 'smooth'
    });

    // Toggle between sections
    document.getElementById('employeeSection').style.display = sectionId === 'employeeSection' ? 'block' : 'none';
    document.getElementById('departmentSection').style.display = sectionId === 'departmentSection' ? 'block' : 'none';
}

// Function to toggle form visibility
function openForm(formId) {
    document.querySelectorAll('.form-container').forEach(form => {
        form.style.display = 'none'; 
    });

    document.getElementById(formId).style.display = 'block'; 
}

// Function to validate form fields
function validateForm(fields) {
    for (let field of fields) {
        if (!field.value.trim()) {
            alert(`${field.placeholder} is required.`);
            field.focus();
            return false;
        }
    }
    return true;
}
function showcreateEmployeeForm() {
    document.getElementById('employeeResults').style.display = 'none'; 
    document.getElementById('createEmployeeForm').style.display = 'block';
}
// Create Employee Form Submission
function openEmployeeForm(formId) {
    document.getElementById('createEmployeeContainer').style.display = 'block';
}
document.getElementById('createEmployeeForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const firstName = document.getElementById('first_name');
    const lastName = document.getElementById('last_name');
    const email = document.getElementById('email');
    const departmentName = document.getElementById('department_name');

    const fields = [firstName, lastName, email, departmentName];

    if (validateForm(fields)) {
        const employeeData = {
            first_name: firstName.value,
            last_name: lastName.value,
            email: email.value,
            department_name: departmentName.value
        };

        fetch('/api/employees', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(employeeData)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => Promise.reject(errorData));
            }
            return response.json();
        })
        .then(data => {
            alert(data.message);
            document.getElementById('createEmployeeContainer').reset();
        
        })
        .catch(error => {
            if (error.error_code === "ER_DUP_ENTRY") {
                alert("Error: Duplicate email found. Please use a different email address.");
            } else {
                alert("Error: " + error.message || "Network error.");
            }
        });
    }
});
document.getElementById('get employee').addEventListener('click', function () {

    createEmployeeForm.style.display = 'none';

    employeeResults.style.display = 'block';


    fetchEmployeeData();
});

// Fetch Employees from API
document.getElementById('get employee').addEventListener('click', function() {
    document.getElementById('employeeResults').style.display = 'block';

    fetchEmployeeData();
});

function fetchEmployeeData() {
    fetch('http://localhost:5000/api/employees')  
        .then(response => response.json())  
        .then(data => {
            const tableBody = document.querySelector('#employeeTable tbody');
            tableBody.innerHTML = ''; 

            
            if (data.length > 0) {
                data.forEach(employee => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${employee.employee_id}</td
                        <td>${employee.first_name}</td>
                        <td>${employee.last_name}</td>
                        <td>${employee.email}</td>
                        <td>${employee.department_name}</td>
                        <td> 
                            <button class="edit-btn" id="editbtn" data-id="${employee.employee_id}">Edit</button>
                            <button class="button" id="deletebtn" onclick="deleteEmployee(this)" data-id="${employee.employee_id}">Delete</button>
                        </td>
                    `;
                    tableBody.appendChild(row);
                });
            } else {
                const row = document.createElement('tr');
                row.innerHTML = '<td colspan="5">No employee data available.</td>';
                tableBody.appendChild(row);
            }

            setupSearch();
        })
        .catch(error => {
            console.error('Error fetching employee data:', error);
            const tableBody = document.querySelector('#employeeTable tbody');
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="5">Failed to load employee data.</td>';
            tableBody.appendChild(row);
        });
}

function setupSearch() {
    const searchInput = document.getElementById('employeeSearch');
    searchInput.addEventListener('input', function() {
        const searchValue = searchInput.value.toLowerCase();
        const rows = document.querySelectorAll('#employeeTable tbody tr');
        
        rows.forEach(row => {
            const cells = row.getElementsByTagName('td');
            const firstName = cells[0].textContent.toLowerCase();
            const lastName = cells[1].textContent.toLowerCase();
            const email = cells[2].textContent.toLowerCase();
            const departmentName = cells[3].textContent.toLowerCase();
            
            if (firstName.includes(searchValue) || lastName.includes(searchValue) || email.includes(searchValue) || departmentName.includes(searchValue)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    });
}

// Delete Employee

function deleteEmployee(button) {
    const id = button.getAttribute("data-id");
    if (!id) {
        alert("Error: Employee ID not found.");
        return;
    }

    const confirmation = confirm(`Are you sure you want to delete employee with ID ${id}?`);

    if (confirmation) {
        fetch(`/api/employees/${id}`, { 
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => Promise.reject(errorData));
            }
            return response.json();
        })
        .then(data => {
            alert(`Employee with ID ${id} deleted successfully.`);
            fetchEmployeeData(); 
        })
        .catch(error => {
            alert(`Error: ${error.message || "Failed to delete employee."}`);
        });
    } else {
        alert("Deletion canceled. Employee was not removed.");
    }
}



//create department
function openDepartmentForm(formId) {
    document.getElementById('createDepartmentContainer').style.display = 'block';
}
document.getElementById('createDepartmentForm').addEventListener('submit', function (e) {
    e.preventDefault(); // Prevent default form submission

    const departmentName = document.getElementById('departmentname').value;
    const submitButton = document.getElementById('addDepartmentBtn');

    // Disable the button and show loading state
    submitButton.disabled = true;
    submitButton.textContent = 'Creating...';

    fetch('/api/departments', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ department_name: departmentName }),
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw err; });
        }
        return response.json();
    })
    .then(result => {
        document.getElementById('responseMessage').innerHTML = `
            <div class="alert alert-success">${result.message}</div>
        `;

        document.getElementById('createDepartmentForm').reset();

        setTimeout(() => {
            document.getElementById('createDepartmentContainer').style.display = 'none';
        }, 2000);
    })
    .catch(error => {
        document.getElementById('responseMessage').innerHTML = `
            <div class="alert alert-danger">${error.message || 'An error occurred while creating the department.'}</div>
        `;
    })
    .finally(() => {

        submitButton.disabled = false;
        submitButton.textContent = 'Create Department';
    });
});
document.getElementById('getDepartmentButton').addEventListener('click', function () {

    deartmentResults.style.display = 'block';

    fetchDepartmentData();
});
//fetch departments
document.getElementById('getDepartmentButton').addEventListener('click', function () {
document.getElementById('departmentResults').style.display = 'block';
    fetchDepartmentData();
});

function fetchDepartmentData() {
    fetch('http://localhost:5000/api/departments')
        .then(response => response.json())
        .then(data => {
            const tableBody = document.querySelector('#departmentTable tbody');
            tableBody.innerHTML = '';

            if (data.length > 0) {
                data.forEach(department => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${department.department_id}</td>
                        <td>${department.department_name}</td>
                        <td>
                            <button class="Edit"  data-id="${department.department_id}" onclick="editDepartment(this)">Edit</button>
                            <button class="Delete" data-id="${department.department_id}" onclick="deleteDepartment(this)">Delete</button>

                        </td>
                    `;
                    tableBody.appendChild(row);
                });
            } else {
                const row = document.createElement('tr');
                row.innerHTML = '<td colspan="3">No department data available.</td>';
                tableBody.appendChild(row);
            }
        })
        .catch(error => console.error('Error fetching data:', error));
}



//Delete department
function deleteDepartment(button) {
    const id = button.getAttribute("data-id"); 
    if (!id) {
        alert("Error: Department ID not found.");
        return;
    }

    const confirmation = confirm(`Are you sure you want to delete department with ID ${id}?`);

    if (confirmation) {
        fetch(`/api/departments/${id}`, { 
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errorData => Promise.reject(errorData));
            }
            return response.json();
        })
        .then(data => {
            alert(`Department with ID ${id} deleted successfully.`);
            fetchEmployeeData(); 
        })
        .catch(error => {
            alert(`Error: ${error.message || "Failed to delete Department."}`);
        });
    } else {
        alert("Deletion canceled. Department was not removed.");
    }
}
