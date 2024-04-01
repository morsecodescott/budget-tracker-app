// script.js


/*-- Define openAddModal globally
window.openAddModal = function() {
    document.getElementById('modalTitle').textContent = 'Add Budget Item';
    document.getElementById('budgetItemForm').reset();
    document.getElementById('itemId').value = '';
    document.getElementById('budgetItemModal').style.display = 'block';
};
*/

// Wait for the DOM to be fully loaded before executing any script.
document.addEventListener('DOMContentLoaded', (event) => {

    // Function to display a flash message of a specified type ('success' or 'error').
    function displayFlashMessage(message, type) {
        const container = document.getElementById('toastContainer');
        if (container) {
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.textContent = message;

            // Append and show the toast message
            container.appendChild(toast);
            setTimeout(() => toast.classList.add('show'), 100);

            // Automatically remove the toast after a delay
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => container.removeChild(toast), 500); // Wait for fade-out to finish
            }, 5000);
        }
    }

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

    // Modal operations for adding and editing budget items.
    const modalOpener = document.getElementById('modalOpener');
    if (modalOpener) {
        modalOpener.addEventListener('click', function() {
            document.getElementById('modalTitle').textContent = 'Add Budget Item';
            document.getElementById('budgetItemForm').reset();
            document.getElementById('itemId').value = '';
            document.getElementById('budgetItemModal').style.display = 'block';
        });
    }

    const editModalOpener = document.querySelector('.editModalOpener');
    if (editModalOpener) {
        editModalOpener.addEventListener('click', function() {
            document.getElementById('modalTitle').textContent = 'Edit Budget Item';
            // Assume the data to populate the form is available in attributes or through API
            // Populate the form fields as necessary
            document.getElementById('budgetItemModal').style.display = 'block';
        });
    }

    const modalCloser = document.getElementById('modalCloser');
    if (modalCloser) {
        modalCloser.addEventListener('click', function() {
            document.getElementById('budgetItemModal').style.display = 'none';
        });
    }

    // Check and bind event listener to the registration form
    const registrationForm = document.getElementById('registrationForm');
    if (registrationForm) {
        registrationForm.addEventListener('submit', function(e) {
            var password = document.getElementById('password').value;
            var confirmPassword = document.getElementById('confirmPassword').value;

            if (password !== confirmPassword) {
                e.preventDefault(); // Prevent form submission
                alert('Passwords do not match.');
                document.getElementById('password').focus();
            }
        });
    }

    // Check and bind event listener to the login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault(); // Prevent the default form submission
            const formData = new FormData(this);
            const errorDiv = document.getElementById('loginError');

            fetch('/auth/login', {
                method: 'POST',
                body: new URLSearchParams(formData).toString(), // Encode as form data
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                credentials: 'same-origin' // Include cookies in the request
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    window.location.href = '/dashboard'; // Redirect on successful login
                } else {
                    if (errorDiv) {
                        errorDiv.textContent = data.message; // Display error message
                        errorDiv.style.display = 'block';
                    }
                }
            })
            .catch(error => {
                console.error('Error:', error);
                if (errorDiv) {
                    errorDiv.textContent = 'An error occurred, please try again.';
                    errorDiv.style.display = 'block';
                }
            });
        });
    }
    
    // Additional initialization or event listeners can be safely added here,
    // following the same pattern of checking for element existence.
});
