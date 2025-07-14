// scripts.js

// Page navigation system
function showPage(pageId) {
    // Hide all sections and pages
    const sections = document.querySelectorAll('section');
    const pages = document.querySelectorAll('.page');
    
    sections.forEach(section => section.style.display = 'none');
    pages.forEach(page => page.classList.remove('active'));
    
    if (pageId === 'home') {
        // Show main page sections
        sections.forEach(section => section.style.display = 'block');
        document.querySelector('header').style.display = 'block';
        document.querySelector('footer').style.display = 'block';
    } else {
        // Hide main page elements and show specific page
        document.querySelector('header').style.display = 'none';
        document.querySelector('footer').style.display = 'none';
        
        const targetPage = document.getElementById(pageId + '-page');
        if (targetPage) {
            targetPage.classList.add('active');
        }
    }
}

// Settings modal functions
function showSettings() {
    const modal = document.getElementById('settings-modal');
    modal.classList.add('active');
}

function closeSettings() {
    const modal = document.getElementById('settings-modal');
    modal.classList.remove('active');
}

// Build pipeline modal functions
function showBuildPipeline() {
    const modal = document.getElementById('build-pipeline-modal');
    modal.classList.add('active');
}

function closeBuildPipeline() {
    const modal = document.getElementById('build-pipeline-modal');
    modal.classList.remove('active');
}

// Close modals when clicking outside
window.addEventListener('click', function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.classList.remove('active');
        }
    });
});

// Smooth scrolling for anchor links
document.addEventListener('DOMContentLoaded', function() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Skip if it's a page navigation
            if (href === '#' || this.onclick) {
                return;
            }
            
            e.preventDefault();
            
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Pipeline management functions
function editPipeline(pipelineName) {
    alert(`Editing pipeline: ${pipelineName}`);
    // In a real app, this would open the pipeline editor
}

function deployPipeline(pipelineName) {
    if (confirm(`Deploy pipeline: ${pipelineName}?`)) {
        alert(`Deploying ${pipelineName} to Azure DevOps...`);
        // In a real app, this would trigger the deployment process
    }
}

function deletePipeline(pipelineName) {
    if (confirm(`Are you sure you want to delete pipeline: ${pipelineName}?`)) {
        alert(`Pipeline ${pipelineName} deleted.`);
        // In a real app, this would remove the pipeline from the database
        // and update the UI
    }
}

// Template selection in build pipeline modal
document.addEventListener('DOMContentLoaded', function() {
    const templateCards = document.querySelectorAll('.template-card');
    
    templateCards.forEach(card => {
        card.addEventListener('click', function() {
            // Remove selected class from all cards
            templateCards.forEach(c => c.classList.remove('selected'));
            
            // Add selected class to clicked card
            this.classList.add('selected');
            
            // You could also store the selected template
            const templateName = this.querySelector('h4').textContent;
            console.log(`Selected template: ${templateName}`);
        });
    });
});

// Form validation for pipeline creation
function validatePipelineForm() {
    const name = document.querySelector('input[placeholder="Enter pipeline name"]').value;
    const description = document.querySelector('textarea[placeholder="Describe your pipeline"]').value;
    
    if (!name.trim()) {
        alert('Please enter a pipeline name');
        return false;
    }
    
    if (!description.trim()) {
        alert('Please enter a pipeline description');
        return false;
    }
    
    return true;
}

// Create new pipeline
function createPipeline() {
    if (validatePipelineForm()) {
        const name = document.querySelector('input[placeholder="Enter pipeline name"]').value;
        alert(`Creating pipeline: ${name}`);
        
        // Close the modal
        closeBuildPipeline();
        
        // In a real app, this would:
        // 1. Send data to backend
        // 2. Create the pipeline in Azure DevOps
        // 3. Add the new pipeline to the dashboard
        // 4. Show success message
        
        // For demo, we'll just add it to the grid
        addPipelineToGrid(name);
    }
}

// Add new pipeline to the grid (demo function)
function addPipelineToGrid(pipelineName) {
    const grid = document.getElementById('pipelines-grid');
    const newCard = document.createElement('div');
    newCard.className = 'pipeline-card';
    newCard.innerHTML = `
        <div class="pipeline-header">
            <h3>${pipelineName}</h3>
            <span class="pipeline-status inactive">Inactive</span>
        </div>
        <p>Newly created pipeline - ready for configuration</p>
        <div class="pipeline-actions">
            <button class="btn-small" onclick="editPipeline('${pipelineName}')">Edit</button>
            <button class="btn-small" onclick="deployPipeline('${pipelineName}')">Deploy</button>
            <button class="btn-small" onclick="deletePipeline('${pipelineName}')">Delete</button>
        </div>
    `;
    
    grid.appendChild(newCard);
}

// Search functionality for pipelines
function searchPipelines(searchTerm) {
    const cards = document.querySelectorAll('.pipeline-card');
    
    cards.forEach(card => {
        const title = card.querySelector('h3').textContent.toLowerCase();
        const description = card.querySelector('p').textContent.toLowerCase();
        
        if (title.includes(searchTerm.toLowerCase()) || 
            description.includes(searchTerm.toLowerCase())) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Keyboard shortcuts
document.addEventListener('keydown', function(event) {
    // Escape key to close modals
    if (event.key === 'Escape') {
        const activeModal = document.querySelector('.modal.active');
        if (activeModal) {
            activeModal.classList.remove('active');
        }
    }
    
    // Ctrl+N to create new pipeline (when on dashboard)
    if (event.ctrlKey && event.key === 'n') {
        const dashboardPage = document.getElementById('dashboard-page');
        if (dashboardPage && dashboardPage.classList.contains('active')) {
            event.preventDefault();
            showBuildPipeline();
        }
    }
});

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Set up event listeners for buttons
    const createPipelineBtn = document.querySelector('.modal-footer .btn-primary');
    if (createPipelineBtn && createPipelineBtn.textContent.includes('Create')) {
        createPipelineBtn.addEventListener('click', createPipeline);
    }
    
    // Add pipeline action event listeners
    const pipelineCards = document.querySelectorAll('.pipeline-card');
    pipelineCards.forEach(card => {
        const editBtn = card.querySelector('.btn-small:first-child');
        const deployBtn = card.querySelector('.btn-small:nth-child(2)');
        const deleteBtn = card.querySelector('.btn-small:last-child');
        
        const pipelineName = card.querySelector('h3').textContent;
        
        if (editBtn) editBtn.addEventListener('click', () => editPipeline(pipelineName));
        if (deployBtn) deployBtn.addEventListener('click', () => deployPipeline(pipelineName));
        if (deleteBtn) deleteBtn.addEventListener('click', () => deletePipeline(pipelineName));
    });
    
    console.log('Pipeline Express application initialized');
});