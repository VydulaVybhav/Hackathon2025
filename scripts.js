function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    
    // Show selected page
    document.getElementById(pageId + '-page').classList.add('active');
}

// Handle login form
document.querySelector('.login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    showPage('dashboard');
});