// public/js/loginAndRegistration.js
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