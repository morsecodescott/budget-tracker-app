// public/js/common.js
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