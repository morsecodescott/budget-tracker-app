// public/js/script.js
document.addEventListener('DOMContentLoaded', (event) => {
    // Attach event listener for dynamic delete button actions
    document.addEventListener('click', function(e) {
        if (e.target && e.target.classList.contains('budget-item-delete')) {
            const itemId = e.target.getAttribute('data-id');
            if (confirm('Are you sure?')) {
                fetch(`/budget/delete/${itemId}`, {
                    method: 'DELETE',
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        let el = document.querySelector(`tr[data-id="${itemId}"]`);
                        if (el) el.remove();
                        displayFlashMessage('Item deleted successfully', 'success');
                    } else {
                        throw new Error(data.message || 'Failed to delete the item.');
                    }
                })
                .catch(err => {
                    console.error('Error:', err);
                    displayFlashMessage('There was an error processing your request.', 'error');
                });
            }
        }
    });

    // Modal operations
    window.openAddModal = function() {
        document.getElementById('modalTitle').textContent = 'Add Budget Item';
        document.getElementById('budgetItemForm').reset();
        document.getElementById('itemId').value = '';
        document.getElementById('budgetItemModal').style.display = 'block';
    };

    window.openEditModal = function(id, type, amount, frequency, description) {
        document.getElementById('modalTitle').textContent = 'Edit Budget Item';
        document.getElementById('type').value = type;
        document.getElementById('amount').value = amount;
        document.getElementById('frequency').value = frequency;
        document.getElementById('description').value = description;
        document.getElementById('itemId').value = id;
        document.getElementById('budgetItemModal').style.display = 'block';
    };

    window.closeModal = function() {
        document.getElementById('budgetItemModal').style.display = 'none';
    };

    // Form submission handling
    window.submitForm = function() {
        const itemId = document.getElementById('itemId').value;
        const isEdit = itemId !== '';
        const form = document.getElementById('budgetItemForm');
        const jsonFormData = Object.fromEntries(new FormData(form).entries());
        const formAction = isEdit ? `/budget/${itemId}` : '/budget';
        const method = isEdit ? 'PUT' : 'POST';

        fetch(formAction, {
            method: method,
            body: JSON.stringify(jsonFormData),
            headers: {'Content-Type': 'application/json'},
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                if (isEdit) {
                    updateBudgetList(data.item);
                } else {
                    addToBudgetList(data.item);
                }
                closeModal();
                displayFlashMessage('Operation successful', 'success');
            } else {
                throw new Error(data.message || 'Operation failed.');
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            displayFlashMessage(error.message, 'error');
        });
    };
});

// The addToBudgetList, updateBudgetList, and displayFlashMessage functions are correctly placed outside the DOMContentLoaded listener as they are.


function addToBudgetList(item) {
    const table = document.querySelector('.budget-items-table tbody');
    const row = table.insertRow();
    row.setAttribute('data-id', item._id);
    row.innerHTML = `
        <td>${item.type}</td>
        <td>$${parseFloat(item.amount).toFixed(2)}</td>
        <td>${item.frequency}</td>
        <td>${item.description}</td>
        <td class="budget-items-actions">
            <button onclick="openEditModal('${item._id}', '${item.type}', '${item.amount}', '${item.frequency}', '${item.description}')" class="budget-item-edit">Edit</button>
            <button class="budget-item-delete" data-id="${item._id}" onclick="deleteItem('${item._id}')">Delete</button>
        </td>
    `;
    // Reattach event listeners for the delete button in the new row
    row.querySelector('.budget-item-delete').addEventListener('click', function(e) {
        const itemId = this.getAttribute('data-id');

        if (confirm('Are you sure?')) {
            fetch(`/budget/delete/${itemId}`, {
                method: 'DELETE',
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    row.remove();
                    displayFlashMessage('Item deleted successfully', 'success');
                } else {
                    throw new Error(data.message || 'Failed to delete the item.');
                }
            })
            .catch(err => {
                console.error('Error:', err);
                displayFlashMessage('There was an error processing your request.', 'error');
            });
        }
    });
}

function updateBudgetList(item) {
    // Ensure the 'item' parameter includes the edited item's data as expected
    const row = document.querySelector(`tr[data-id="${item._id}"]`);
    if (row) {
        // Assuming the first four cells are Type, Amount, Frequency, Description in order
        row.cells[0].textContent = item.type;
        row.cells[1].textContent = `$${parseFloat(item.amount).toFixed(2)}`;
        row.cells[2].textContent = item.frequency;
        row.cells[3].textContent = item.description;
    } else {
        console.error('Failed to find the item row for ID:', item._id);
    }
}

function displayFlashMessage(message, type) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    // Append the toast to the container
    container.appendChild(toast);

    // Show the toast
    setTimeout(() => toast.classList.add('show'), 100);

    // Automatically remove the toast after 5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => container.removeChild(toast), 500); // Wait for fade-out to finish
    }, 5000);
}



document.getElementById('registrationForm').addEventListener('submit', function(e) {
    var password = document.getElementById('password').value;
    var confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        e.preventDefault(); // Prevent form submission
        alert('Passwords do not match.');
        // Optionally, you might focus the password field again
        document.getElementById('password').focus();
    }
});

document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault(); // Prevent the default form submission

    console.log('Form submission intercepted');

    const formData = new FormData(this);
    const errorDiv = document.getElementById('loginError');

    console.log('Initiating fetch to /auth/login');

    fetch('/auth/login', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin' // Include cookies in the request
    })
    .then(response => {
        console.log('Received fetch response');
        if (!response.ok) {
            console.error('Fetch response was not ok', response.statusText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Response JSON:', data);
        if (data.success) {
            console.log('Login successful, redirecting...');
            window.location.href = '/dashboard'; // Redirect on successful login
        } else {
            console.log('Login failed, displaying error message');
            errorDiv.textContent = data.message; // Display error message
            errorDiv.style.display = 'block';
        }
    })
    .catch(error => {
        console.error('Fetch error:', error);
        errorDiv.textContent = 'An error occurred, please try again.';
        errorDiv.style.display = 'block';
    });
});
