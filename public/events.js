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
document.getElementById('createDepartmentForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const departmentName = document.getElementById('department_name');

    if (!departmentName) {
        alert('Department Name is required.');
        departmentName.focus();
        return;
    }

    const departmentData = {
        department_name: departmentName.value
    };

    // Send POST request to server
    fetch('/api/department', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(departmentData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.status==='success') {
            alert("Department created successfully!");
        } else {
            alert("Error creating department.");
        }
    })
    .catch(error => {
        console.error("Error:", error);
        alert("An error occurred. Please try again.");
    });

    // Clear the form after submission
    e.target.reset();
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

    if (confirm(`Are you sure you want to delete department with ID ${id}?`)) {
        fetch(`/api/departments/${id}`, { 
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        })
        .then(response => {
            if (!response.ok) return response.json().then(err => Promise.reject(err));
            return response.json();
        })
        .then(() => {
            alert(`Department with ID ${id} deleted successfully.`);
            location.reload(); // Refresh to update the list
        })
        .catch(error => {
            console.error("Delete Error:", error);
            alert(`Error: ${error.message || "Failed to delete department."}`);
        });
    }
}




//update employee
// Function to handle "Edit" button click
function editEmployee(button) {
    const employeeId = button.getAttribute('data-id'); 
    console.log("Clicked Edit Button:", button); // Debugging
    console.log("Extracted Employee ID:", employeeId); 

    if (!employeeId) {
        console.error(" Error: Employee ID is missing.");
        alert("Error: Employee ID not found.");
        return;
    }

    fetch(`http://localhost:5000/api/employees/${employeeId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(employeeData => {
            console.log("✔ Fetched Employee Data:", employeeData);
        
            // If backend returns an array, extract the first item
            const employee = Array.isArray(employeeData) ? employeeData[0] : employeeData;
        
            if (!employee || !employee.employee_id) {
                alert(' Employee data is incorrect or missing.');
                return;
            }
        
            document.getElementById('employee_id_get').value = employee.employee_id || '';
            document.getElementById('first_name_update').value = employee.first_name || '';
            document.getElementById('last_name_update').value = employee.last_name || '';
            document.getElementById('email_update').value = employee.email || '';
            document.getElementById('department_name_update').value = employee.department_name || '';
        
            openUpdateForm();
        })
        
        .catch(error => {
            console.error('Error fetching employee data:', error);
            alert('An error occurred while fetching employee data.');
        });
}

// Function to open update form
function openUpdateForm() {
    document.getElementById('updateEmployee').style.display = 'block'; 
}

// Function to close update form
function closeUpdateForm() {
    document.getElementById('updateEmployee').style.display = 'none'; 
}

// Function to handle form submission for updating an employee
document.getElementById('updateEmployeeForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const employeeId = document.getElementById('employee_id_get').value;
    const firstName = document.getElementById('first_name_update').value;
    const lastName = document.getElementById('last_name_update').value;
    const departmentName = document.getElementById('department_name_update').value;

    if (!employeeId) {
        console.error(" Error: Employee ID is missing.");
        alert(" Cannot update: Employee ID is missing.");
        return;
    }

    const data = { first_name: firstName, last_name: lastName, department_name: departmentName };

    fetch(`http://localhost:5000/api/employees/${employeeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        if (result.status === 'success') {
            alert(result.message);
            closeUpdateForm();
            fetchEmployeeData(); 
        } else {
            alert(` Update Failed: ${result.message}`);
        }
    })
    .catch(error => {
        console.error(" Error updating employee:", error);
        alert("An error occurred while updating the employee.");
    });
});

// Function to fetch and display employees
function fetchEmployeeData() {
    fetch('http://localhost:5000/api/employees')
        .then(response => response.json())
        .then(data => {
            const tableBody = document.querySelector('#employeeTable tbody');
            tableBody.innerHTML = '';

            if (data.length > 0) {
                data.forEach(employee => {
                    console.log("✔ Employee Data:", employee);
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${employee.employee_id}</td>
                        <td>${employee.first_name}</td>
                        <td>${employee.last_name}</td>
                        <td>${employee.email}</td>
                        <td>${employee.department_name}</td>
                        <td>
                            <button class="edit-btn" data-id="${employee.employee_id}" onclick="editEmployee(this)">Edit</button>
                            <button class="delete-btn" data-id="${employee.employee_id}" onclick="deleteEmployee(this)">Delete</button>
                        </td>
                    `;
                    tableBody.appendChild(row);
                });
            }
        })
        .catch(error => console.error(" Error fetching employee data:", error));
}


//Update Department
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("getDepartmentButton").addEventListener("click", function () {
        fetchDepartmentData();
    });

    function fetchDepartmentData() {
        fetch("http://localhost:5000/api/departments")
            .then(response => response.json())
            .then(result => {
                const departmentTableContainer = document.getElementById("departmentTableContainer");
                const updateDepartment = document.getElementById("updateDepartment");

                if (departmentTableContainer && updateDepartment) {
                    if (result.status === "success" && result.data.length > 0) {
                        renderDepartmentTable(result.data);
                        departmentTableContainer.style.display = "block";
                        updateDepartment.style.display = "none";
                    } else {
                        alert("No departments found.");
                        departmentTableContainer.style.display = "none";
                    }
                } else {
                    console.error("One or more elements not found in the DOM.");
                }
            })
            .catch(error => console.error("Error fetching department data:", error));
    }

    function renderDepartmentTable(departments) {
        const tableBody = document.getElementById("departmentTableBody");
        if (tableBody) {
            tableBody.innerHTML = "";
            departments.forEach(department => {
                const row = document.createElement("tr");
                row.setAttribute("data-id", department.department_id);
                row.innerHTML = `
                    <td>${department.department_id}</td>
                    <td class="department-name">${department.department_name}</td>
                    <td>
                        <button class="Edit" data-id="${department.department_id}" onclick="editDepartment(this)">Edit</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            console.error("Table body element not found in the DOM.");
        }
    }

    function editDepartment(button) {
        const departmentId = button.getAttribute("data-id");
        fetch(`http://localhost:5000/api/departments/${departmentId}`)
            .then(response => response.json())
            .then(result => {
                const updateDepartment = document.getElementById("updateDepartment");
                if (updateDepartment) {
                    if (result.status === "success" && result.data) {
                        populateDepartmentForm(result.data);
                        updateDepartment.style.display = "block";
                    } else {
                        alert('Department not found.');
                    }
                } else {
                    console.error("Update department element not found in the DOM.");
                }
            })
            .catch(error => console.error('Error fetching department data:', error));
    }

    function populateDepartmentForm(data) {
        const updateDepartmentForm = document.getElementById('updateDepartmentForm');
        if (updateDepartmentForm) {
            updateDepartmentForm.reset();
            document.getElementById('department_id').value = data.department_id;
            document.getElementById('department_name').value = data.department_name;
        } else {
            console.error("Update department form not found in the DOM.");
        }
    }

    document.getElementById('updateDepartmentForm').addEventListener('submit', function (event) {
        event.preventDefault();

        const departmentId = document.getElementById('department_id').value;
        const departmentName = document.getElementById('department_name').value.trim();

        if (!departmentName) {
            alert("Department name cannot be empty.");
            return;
        }

        const currentDisplayedName = document.querySelector(`tr[data-id="${departmentId}"] .department-name`)?.textContent?.trim();
        if (departmentName === currentDisplayedName) {
            alert("No changes detected.");
            return;
        }

        updateDepartment(departmentId, departmentName);
    });

    function updateDepartment(departmentId, departmentName) {
        fetch(`http://localhost:5000/api/departments/${departmentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ department_name: departmentName })
        })
        .then(response => response.json())
        .then(result => {
            if (result.status === 'success') {
                alert(result.message);
                closeUpdateDepartmentForm();
                fetchDepartmentData();
            } else {
                alert(result.message);
            }
        })
        .catch(error => console.error('Error updating department:', error));
    }

    function closeUpdateDepartmentForm() {
        const updateDepartment = document.getElementById("updateDepartment");
        if (updateDepartment) {
            updateDepartment.style.display = 'none';
        } else {
            console.error("Update department element not found in the DOM.");
        }
    }
});