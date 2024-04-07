// public/js/categoryManagement.js

// Assuming you have a modal setup for adding/editing categories

document.addEventListener('DOMContentLoaded', () => {   
    loadParentCategories();
    loadCategoriesNew();
});

function attachCollapseEventListeners() {
    document.querySelectorAll('.category-title').forEach(title => {
      title.addEventListener('click', function() {
        const subcategoryList = this.nextElementSibling;
        const collapseIcon = this.querySelector('.collapse-icon');
        const isExpanded = collapseIcon.classList.contains('expanded');
        
        subcategoryList.style.display = isExpanded ? 'none' : 'block';
        if (isExpanded) {
          collapseIcon.classList.remove('expanded');
          
        } else {
          collapseIcon.classList.add('expanded');
          
        }
      });
    });
  }
  


function loadCategoriesNew() {
    fetch('/categories')
      .then(response => response.json())
      .then(categories => {
        const parentCategories = categories.filter(cat => !cat.parentCategory);
        const categoryListHtml = parentCategories.map(parentCategory => {
          const subCategories = categories.filter(sub => sub.parentCategory === parentCategory._id);
          return `
            <div class="category-item" data-category-id="${parentCategory._id}">
            <div class="category-title">
                <span class="collapse-icon"></span>
                ${parentCategory.name}
                <div class="category-actions">
                    <button class="editCategoryBtn" onclick="openEditModal('${parentCategory._id}')">Edit</button>
                    <button class="deleteCategoryBtn" onclick="deleteCategory('${parentCategory._id}')">Delete</button>
                </div>
            </div>
            <div class="subcategory-list">
                ${subCategories.map(subCategory => `
                <div class="subcategory-item">
                    ${subCategory.name}
                    <div class="category-actions">
                        <button class="editCategoryBtn" onclick="openEditModal('${subCategory._id}')">Edit</button>
                        <button class="deleteCategoryBtn" onclick="deleteCategory('${subCategory._id}')">Delete</button>
                    </div>
                </div>
                `).join('')}
            </div>
            </div>
          `;
        }).join('');
  
        document.querySelector('#category-list-container').innerHTML = categoryListHtml;
        attachCollapseEventListeners();
      })
      .catch(error => {
        console.error('Error loading categories:', error);
      });
  }
  




function loadCategories() {
    fetch('/categories')
    .then(response => response.json())
    .then(categories => {
        const tbody = document.querySelector('#categoryList tbody');
        tbody.innerHTML = ''; // Clear existing rows

        categories.forEach(category => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${category.name}</td>
                <td>${category.parentCategory || 'N/A'}</td>
                <td>${category.isDefault ? 'Default' : 'User Defined'}</td>
                <td>
                    <button onclick="openEditModal('${category._id}')">Edit</button>
                    <button onclick="deleteCategory('${category._id}')">Delete</button>
                </td>
            `;
        });
    })
    .catch(error => console.error('Error loading categories:', error));
}


function loadParentCategories() {
    fetch('/categories/parents')
    .then(response => response.json())
    .then(parentCategories => {
        const parentCategorySelect = document.getElementById('parentCategory');
        parentCategorySelect.innerHTML = '<option value="">None</option>'; // Default option
        
        parentCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category._id;
            option.textContent = category.name;
            parentCategorySelect.appendChild(option);
        });
    })
    .catch(error => console.error('Error fetching parent categories:', error));
}



function openEditModal(categoryId) {
    // Fetch category details and fill in the form for editing
    fetch(`/categories/${categoryId}`)
    .then(response => response.json())
    .then(category => {
        document.getElementById('categoryName').value = category.name;
        document.getElementById('isDefault').checked = category.isDefault; // Set checkbox
        document.getElementById('categoryId').value = categoryId; // Hidden input to store the ID
        document.getElementById('modalTitle').textContent = 'Edit Category'; // Change title for edit

        // Fetch all parent categories for the dropdown
        fetch('/categories/parents')
        .then(response => response.json())
        .then(parentCategories => {
            const parentCategorySelect = document.getElementById('parentCategory');
            parentCategorySelect.innerHTML = '<option value="">None</option>'; // Default option
            parentCategories.forEach(parent => {
                const option = document.createElement('option');
                option.value = parent._id;
                option.textContent = parent.name;
                if (parent._id === category.parentCategory) {
                    option.selected = true; // Set the current parent category as selected
                }
                parentCategorySelect.appendChild(option);
            });
        });

        // Show the modal
        document.getElementById('categoryModal').style.display = 'block';
    })
    .catch(error => console.error('Error fetching category:', error));
}


function deleteCategory(categoryId) {
    fetch(`/categories/${categoryId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        // Check if the response has a message property and not a success property
        if (data.message) {
            loadCategories(); // Reload categories
            // Optionally display a success message here
        } else {
            // If there is no message, we assume something went wrong
            throw new Error('Failed to delete category');
        }
    })
    .catch(error => console.error('Error deleting category:', error));
}



document.getElementById('addCategoryModalOpener').addEventListener('click', function() {
    // Assuming 'categoryModal' is the ID of your modal
    document.getElementById('categoryModal').style.display = 'block';
    document.getElementById('modalTitle').textContent = 'Add New Category';
    // Reset the form within the modal
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryId').value = ''; // Explicitly clear the categoryId
    loadParentCategories(); // Populate the dropdown when the modal is opened
});



document.getElementById('categoryForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);
    const jsonFormData = Object.fromEntries(formData.entries());

    const categoryIdElement = formData.get('id');
    const isEdit = categoryIdElement && categoryIdElement.value !== '';
    console.log("isEdit: "+isEdit);
    console.log(categoryIdElement);
    const url = isEdit ? `/categories/${formData.get('id')}` : '/categories';
    const method = isEdit ? 'PUT' : 'POST';
    console.log("Form Data: "+JSON.stringify(jsonFormData));
    fetch(url, {
        method: method,
        body: JSON.stringify(jsonFormData),
        headers: {
            'Content-Type': 'application/json',
            // Add any necessary headers
        },
    })
    .then(response => {
        if (!response.ok) {
            // If the server response was not ok, throw an error with the response's status text
            throw new Error('Failed to perform the operation: ' + response.statusText);
        }
        return response.json(); // Parse JSON body of the response
    })
    .then(data => {
        if (data.message) {
            // If the response contains a message, display it
            displayFlashMessage(data.message, 'success');
            // Clear the form
            document.getElementById('categoryForm').reset();
            // Close the modal
            document.getElementById('categoryModal').style.display = 'none';
            // Reload the categories to reflect the new changes
            loadCategories();
            loadCategoriesNew();
        }
    })
    .catch(error => {
        console.error('Error:', error);
        displayFlashMessage(error.message, 'error');
    });
});

document.getElementById('closeModalButton').addEventListener('click', function() {

    // Reset the form within the modal
    document.getElementById('categoryForm').reset();
    // Close the modal
    document.getElementById('categoryModal').style.display = 'none';
    
});




// You can also add any additional helper functions needed for managing categories here
