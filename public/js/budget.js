// public/js/budget.js

// Wait for the DOM to be fully loaded before executing any script.
document.addEventListener('DOMContentLoaded', (event) => {

    function loadCategories() {
        fetch('/categories')
        .then(response => response.json())
        .then(categories => {
            const categorySelect = document.getElementById('category');
            categorySelect.innerHTML = '<option value="">None</option>'; // Default option
            
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category._id;
                option.textContent = category.name;
                categorySelect.appendChild(option);
            });
        })
        .catch(error => console.error('Error fetching categories:', error));
    }
    
    
    // Function to add a budget item to the list (used in form submission handling).
    function addToBudgetList(item) {
        const table = document.querySelector('.budget-items-table tbody');
        const row = table.insertRow();
        row.setAttribute('data-id', item._id);
        row.innerHTML = `
            <td>${item.type}</td>
            <td>${item.category}</td>
            <td>${item.description}</td>
            <td>$${parseFloat(item.amount).toFixed(2)}</td>
            <td>${item.frequency}</td>
            
            <td class="budget-items-actions">
                <button class="budget-item-edit btn" data-id="${item._id}" data-type="${item.type}" data-category="${item.category}" data-amount="${item.amount}" data-frequency="${item.frequency}" data-description="${item.description}">Edit</button>                        
                <button class="budget-item-delete btn" data-id="${item._id}">Delete</button>
            </td>
        `;
    }

    // Function to update a budget item in the list.
    function updateBudgetList(item) {
        const row = document.querySelector(`tr[data-id="${item._id}"]`);
        if (row) {
            row.cells[0].textContent = item.type;
            row.cells[1].textContent = item.category;
            row.cells[2].textContent = item.description;
            row.cells[3].textContent = `$${parseFloat(item.amount).toFixed(2)}`;
            row.cells[4].textContent = item.frequency;
            
        } else {
            console.error('Failed to find the item row for ID:', item._id);
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
        } else if (e.target && e.target.classList.contains('budget-item-edit')) {
            const id = e.target.getAttribute('data-id');
            const type = e.target.getAttribute('data-type');
            const amount = e.target.getAttribute('data-amount');
            const frequency = e.target.getAttribute('data-frequency');
            const description = e.target.getAttribute('data-description');
            const category = e.target.getAttribute('data-categrory');
            openEditModal(id, type, amount, frequency, description, category);  

        }
    });


    // Modal operations for adding and editing budget items.
    const modalOpener = document.getElementById('modalOpener');
    if (modalOpener) {
        modalOpener.addEventListener('click', function() {
            loadCategories();
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
            loadCategories();
            document.getElementById('budgetItemModal').style.display = 'block';
        });
    }

    const modalCloser = document.getElementById('modalCloser');
    if (modalCloser) {
        modalCloser.addEventListener('click', function() {
            document.getElementById('budgetItemModal').style.display = 'none';
        });
    }
    
    const modalCloser2 = document.getElementById('modalCloser2');
    if (modalCloser2) {
        modalCloser2.addEventListener('click', function() {
            document.getElementById('budgetItemModal').style.display = 'none';
        });
    }
   
    
    const saveChangesButton = document.getElementById('submitItem');
    if (saveChangesButton) {
        saveChangesButton.addEventListener('click', saveChanges);
    }



    // Form submission handling for budget items.
    function saveChanges() {
        const form = document.getElementById('budgetItemForm');
        const itemId = document.getElementById('itemId').value;
        const isEdit = itemId !== '';
        const formAction = isEdit ? `/budget/${itemId}` : '/budget';
        const method = isEdit ? 'PUT' : 'POST';
        const jsonFormData = JSON.stringify(Object.fromEntries(new FormData(form).entries()));

        fetch(formAction, {
            method: method,
            body: jsonFormData,
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
                document.getElementById('budgetItemModal').style.display = 'none';                    
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
  
    
    window.openEditModal = function(id, type, amount, frequency, description, category) {
        // Set the form values based on the provided parameters
        loadCategories();
        document.getElementById('modalTitle').textContent = 'Edit Budget Item';
        document.getElementById('type').value = type;
        document.getElementById('amount').value = amount;
        document.getElementById('frequency').value = frequency;
        document.getElementById('description').value = description;
        document.getElementById('itemId').value = id;
        document.getElementById('itemId').categroy = category;
        document.getElementById('budgetItemModal').style.display = 'block';
    };
    
    
    document.querySelectorAll('.budget-item-edit').forEach(button => {
        button.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            const type = this.getAttribute('data-type');
            const amount = this.getAttribute('data-amount');
            const frequency = this.getAttribute('data-frequency');
            const description = this.getAttribute('data-description');
            const category = this.getAttribute('data-categrory');
            openEditModal(id, type, amount, frequency, description, category);
        });
    });


});