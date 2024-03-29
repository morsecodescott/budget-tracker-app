document.addEventListener('DOMContentLoaded', (event) => {
    document.querySelectorAll('.budget-item-delete').forEach(button => {
        button.addEventListener('click', function(e) {
            const itemId = this.getAttribute('data-id');

            if(confirm('Are you sure?')) {
                fetch(`/budget/delete/${itemId}`, {
                    method: 'DELETE',
                })
                .then(res => window.location.reload())
                .catch(err => console.error('Error:', err));
            }
        });
    });

    window.openAddModal = function() {
        document.getElementById('modalTitle').textContent = 'Add Budget Item';
        document.getElementById('budgetItemForm').reset();
        document.getElementById('itemId').value = '';
        document.getElementById('budgetItemModal').style.display = 'block';
    }

    window.openEditModal = function(id, type, amount, frequency, description) {
        document.getElementById('modalTitle').textContent = 'Edit Budget Item';
        document.getElementById('type').value = type;
        document.getElementById('amount').value = amount;
        document.getElementById('frequency').value = frequency;
        document.getElementById('description').value = description;
        document.getElementById('itemId').value = id;
        document.getElementById('budgetItemModal').style.display = 'block';
    }

    window.closeModal = function() {
        document.getElementById('budgetItemModal').style.display = 'none';
    }

    window.submitForm = function() {
        const itemId = document.getElementById('itemId').value;
        const isEdit = itemId !== '';
        const form = document.getElementById('budgetItemForm');
        const formData = new FormData(form);
        const formAction = isEdit ? `/budget/${itemId}` : '/budget';
        const method = isEdit ? 'PUT' : 'POST';
        
        const jsonFormData = Object.fromEntries(formData.entries());
        
        fetch(formAction, {
            method: method,
            body: JSON.stringify(jsonFormData),
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok.');
            }
            return response.json();
        })
        .then(data => {
            console.log('Success:', data);
            closeModal(); // Ensure the modal is closed after operation
            // Dynamically update the list of budget items without reloading the page
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('There was an error processing your request.');
        });
    }
});
