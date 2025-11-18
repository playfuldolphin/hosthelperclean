// State Management
let currentUser = null;
let properties = [];
let checklists = [];
let teamMembers = [];

// Platform Fee Configuration
const FEE_MODELS = {
    standard: {
        percentage: 15, // 15% platform fee
        label: 'Standard',
        description: 'Standard platform fee for regular bookings'
    },
    premium: {
        percentage: 20, // 20% for priority/rush jobs
        label: 'Priority',
        description: 'Priority service with faster response time'
    },
    highVolume: {
        percentage: 10, // 10% for high-volume clients
        label: 'Volume Discount',
        description: 'Reduced fee for frequent users'
    }
};

// Base Cleaning Prices (what cleaners receive)
const BASE_PRICES = {
    standard: {
        studio: 75,
        oneBed: 95,
        twoBed: 120,
        threeBed: 150,
        fourBed: 180
    },
    deep: {
        studio: 110,
        oneBed: 140,
        twoBed: 180,
        threeBed: 220,
        fourBed: 260
    },
    quick: {
        studio: 60,
        oneBed: 75,
        twoBed: 95,
        threeBed: 120,
        fourBed: 150
    }
};

// Add-on Services
const ADDONS = {
    laundry: 25,
    insideOven: 20,
    insideFridge: 20,
    windows: 30,
    garage: 25,
    supplies: 15
};

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    checkAuthState();
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Load sample data (in production, this would come from a database)
    loadSampleData();
});

// Authentication Functions
function checkAuthState() {
    const token = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('currentUser');
    
    if (token && savedUser) {
        currentUser = JSON.parse(savedUser);
        showDashboard();
    } else {
        // Check if we're on a cleaner portal link
        const urlParams = new URLSearchParams(window.location.search);
        const cleanerToken = urlParams.get('token');
        if (cleanerToken) {
            showCleanerPortal(cleanerToken);
        } else {
            showLandingPage();
        }
    }
}

function showLandingPage() {
    document.getElementById('landingPage').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('cleanerPortal').style.display = 'none';
}

function showDashboard() {
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('cleanerPortal').style.display = 'none';
    
    // Update user name in dashboard
    if (currentUser) {
        document.getElementById('userName').textContent = currentUser.name;
    }
    
    // Load dashboard data
    loadDashboardData();
}

function showCleanerPortal(token) {
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('cleanerPortal').style.display = 'block';
    
    // Load checklist for this token
    loadCleanerChecklist(token);
}

// Auth Modal Functions
function showLogin() {
    document.getElementById('authModal').style.display = 'flex';
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('signupForm').style.display = 'none';
}

function showSignup() {
    document.getElementById('authModal').style.display = 'flex';
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'block';
}

function closeAuthModal() {
    document.getElementById('authModal').style.display = 'none';
}

function switchToSignup() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'block';
}

function switchToLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('signupForm').style.display = 'none';
}

function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // Simulate authentication (in production, this would be an API call)
    currentUser = {
        id: generateId(),
        name: 'John Doe',
        email: email,
        plan: 'professional'
    };
    
    localStorage.setItem('authToken', generateId());
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    closeAuthModal();
    showDashboard();
}

function handleSignup(event) {
    event.preventDefault();
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const company = document.getElementById('companyName').value;
    
    // Simulate account creation
    currentUser = {
        id: generateId(),
        name: name,
        email: email,
        company: company || null,
        plan: 'trial',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
    };
    
    localStorage.setItem('authToken', generateId());
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    closeAuthModal();
    showDashboard();
    
    // Show welcome message
    showNotification('Welcome to Host Helper Clean! Your 14-day trial has started.');
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    currentUser = null;
    showLandingPage();
}

// Dashboard Navigation
function initializeEventListeners() {
    // Dashboard navigation
    document.querySelectorAll('.dashboard-nav .nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.dataset.page;
            showDashboardPage(page);
            
            // Update active state
            document.querySelectorAll('.dashboard-nav .nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Mobile menu toggle
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    if (mobileToggle) {
        mobileToggle.addEventListener('click', function() {
            document.querySelector('.nav-links').classList.toggle('mobile-open');
        });
    }
    
    // User menu dropdown
    const userMenuBtn = document.querySelector('.user-menu-btn');
    if (userMenuBtn) {
        userMenuBtn.addEventListener('click', function() {
            document.querySelector('.dropdown-menu').classList.toggle('show');
        });
    }
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.user-menu')) {
            document.querySelectorAll('.dropdown-menu').forEach(menu => {
                menu.classList.remove('show');
            });
        }
    });
}

function showDashboardPage(page) {
    // Hide all pages
    document.querySelectorAll('.dashboard-page').forEach(p => {
        p.classList.remove('active');
    });
    
    // Show selected page
    const pageElement = document.getElementById(page + 'Page');
    if (pageElement) {
        pageElement.classList.add('active');
        
        // Load page-specific data
        switch(page) {
            case 'properties':
                loadProperties();
                break;
            case 'checklists':
                loadChecklists();
                break;
            case 'team':
                loadTeamMembers();
                break;
            case 'integrations':
                loadIntegrations();
                break;
            case 'billing':
                loadBilling();
                break;
        }
    }
}

// Property Management
function showAddPropertyModal() {
    document.getElementById('addPropertyModal').style.display = 'flex';
}

function closeAddPropertyModal() {
    document.getElementById('addPropertyModal').style.display = 'none';
    document.getElementById('addPropertyForm').reset();
}

function handleAddProperty(event) {
    event.preventDefault();
    
    const property = {
        id: generateId(),
        name: document.getElementById('propName').value,
        type: document.getElementById('propType').value,
        address: document.getElementById('propAddress').value,
        unit: document.getElementById('propUnit').value,
        bedrooms: document.getElementById('propBedrooms').value,
        bathrooms: document.getElementById('propBathrooms').value,
        instructions: document.getElementById('propInstructions').value,
        createdAt: new Date().toISOString(),
        userId: currentUser.id
    };
    
    // Save to properties array (in production, this would be an API call)
    properties.push(property);
    saveToLocalStorage('properties', properties);
    
    closeAddPropertyModal();
    loadProperties();
    showNotification('Property added successfully!');
}

function loadProperties() {
    const grid = document.getElementById('propertiesGrid');
    if (!grid) return;
    
    grid.innerHTML = properties.map(property => `
        <div class="property-card">
            <div class="property-image">
                <img src="images/property-placeholder.jpg" alt="${property.name}">
                <div class="property-type">${property.type}</div>
            </div>
            <div class="property-details">
                <h3>${property.name}</h3>
                <p class="property-address">
                    <i class="fas fa-map-marker-alt"></i> 
                    ${property.address} ${property.unit ? ', ' + property.unit : ''}
                </p>
                <div class="property-specs">
                    <span><i class="fas fa-bed"></i> ${property.bedrooms} beds</span>
                    <span><i class="fas fa-bath"></i> ${property.bathrooms} baths</span>
                </div>
                <div class="property-actions">
                    <button class="btn btn-sm btn-outline" onclick="viewProperty('${property.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="createChecklistForProperty('${property.id}')">
                        <i class="fas fa-clipboard-list"></i> Create Checklist
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="shareProperty('${property.id}')">
                        <i class="fas fa-share"></i> Share
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Checklist Management
function showCreateChecklistModal() {
    document.getElementById('createChecklistModal').style.display = 'flex';
    
    // Populate property dropdown
    const propertySelect = document.getElementById('checklistProperty');
    propertySelect.innerHTML = '<option value="">Choose a property</option>' +
        properties.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    
    // Populate cleaner dropdown
    const cleanerSelect = document.getElementById('checklistCleaner');
    cleanerSelect.innerHTML = '<option value="">Assign later</option>' +
        teamMembers.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
    
    // Load default template
    loadTemplateItems('standard');
}

function closeCreateChecklistModal() {
    document.getElementById('createChecklistModal').style.display = 'none';
    document.getElementById('createChecklistForm').reset();
}

function loadTemplateItems(template) {
    const container = document.getElementById('checklistItemsContainer');
    let items = [];
    
    switch(template) {
        case 'standard':
            items = getStandardChecklistItems();
            break;
        case 'deep':
            items = getDeepCleanChecklistItems();
            break;
        case 'custom':
            items = [];
            break;
    }
    
    container.innerHTML = items.map((category, catIndex) => `
        <div class="checklist-category">
            <h4>${category.name}</h4>
            <div class="checklist-tasks">
                ${category.tasks.map((task, taskIndex) => `
                    <div class="checklist-task">
                        <input type="checkbox" id="task-${catIndex}-${taskIndex}" checked>
                        <label for="task-${catIndex}-${taskIndex}">${task}</label>
                        <button type="button" class="remove-task" onclick="removeTask(this)">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

function getStandardChecklistItems() {
    return [
        {
            name: 'Living Areas',
            tasks: [
                'Dust all surfaces',
                'Vacuum carpets and rugs',
                'Mop hard floors',
                'Clean windows and mirrors',
                'Empty trash bins',
                'Arrange furniture and cushions'
            ]
        },
        {
            name: 'Kitchen',
            tasks: [
                'Clean all appliances inside and out',
                'Wipe down countertops and backsplash',
                'Clean sink and faucet',
                'Check and clean refrigerator',
                'Take out trash and replace liner',
                'Restock basic supplies'
            ]
        },
        {
            name: 'Bedrooms',
            tasks: [
                'Change bed linens',
                'Dust all surfaces',
                'Vacuum floor',
                'Check closets and drawers',
                'Clean mirrors',
                'Arrange amenities'
            ]
        },
        {
            name: 'Bathrooms',
            tasks: [
                'Clean and disinfect toilet',
                'Clean shower/tub',
                'Clean sink and countertop',
                'Replace towels',
                'Restock toiletries',
                'Clean mirror',
                'Mop floor'
            ]
        }
    ];
}

function getDeepCleanChecklistItems() {
    const standard = getStandardChecklistItems();
    // Add additional deep cleaning tasks
    return standard.map(category => ({
        ...category,
        tasks: [
            ...category.tasks,
            ...getAdditionalDeepCleanTasks(category.name)
        ]
    }));
}

function getAdditionalDeepCleanTasks(category) {
    const tasks = {
        'Living Areas': ['Clean baseboards', 'Dust ceiling fans', 'Clean air vents'],
        'Kitchen': ['Clean inside oven', 'Defrost freezer', 'Clean cabinet fronts'],
        'Bedrooms': ['Vacuum under bed', 'Clean windowsills', 'Dust light fixtures'],
        'Bathrooms': ['Clean grout', 'Descale showerhead', 'Clean exhaust fan']
    };
    return tasks[category] || [];
}

function handleCreateChecklist(event) {
    event.preventDefault();
    
    // Gather all checked tasks
    const tasks = [];
    document.querySelectorAll('.checklist-category').forEach(category => {
        const categoryName = category.querySelector('h4').textContent;
        const categoryTasks = [];
        
        category.querySelectorAll('.checklist-task').forEach(task => {
            const checkbox = task.querySelector('input[type="checkbox"]');
            const label = task.querySelector('label').textContent;
            
            if (checkbox.checked) {
                categoryTasks.push({
                    id: generateId(),
                    task: label,
                    completed: false
                });
            }
        });
        
        if (categoryTasks.length > 0) {
            tasks.push({
                category: categoryName,
                tasks: categoryTasks
            });
        }
    });
    
    const checklist = {
        id: generateId(),
        propertyId: document.getElementById('checklistProperty').value,
        cleanerId: document.getElementById('checklistCleaner').value || null,
        scheduledDate: document.getElementById('checklistDate').value,
        template: document.getElementById('checklistTemplate').value,
        tasks: tasks,
        status: 'pending',
        createdAt: new Date().toISOString(),
        shareToken: generateShareToken()
    };
    
    checklists.push(checklist);
    saveToLocalStorage('checklists', checklists);
    
    closeCreateChecklistModal();
    loadChecklists();
    showNotification('Checklist created successfully!');
    
    // If cleaner was assigned, show share link
    if (checklist.cleanerId) {
        showShareLink(checklist);
    }
}

function showShareLink(checklist) {
    const property = properties.find(p => p.id === checklist.propertyId);
    // Use the actual domain in production
    const domain = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? window.location.origin 
        : 'https://hosthelperclean.com';
    const shareUrl = `${domain}?token=${checklist.shareToken}`;
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Share Checklist</h2>
                <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <p>Share this link with your cleaner to access the checklist for <strong>${property.name}</strong>:</p>
                <div class="share-link-container">
                    <input type="text" value="${shareUrl}" readonly id="shareLink">
                    <button class="btn btn-primary" onclick="copyShareLink()">
                        <i class="fas fa-copy"></i> Copy
                    </button>
                </div>
                <p class="help-text">The cleaner will be able to view and update the checklist without needing an account.</p>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function copyShareLink() {
    const input = document.getElementById('shareLink');
    input.select();
    document.execCommand('copy');
    showNotification('Link copied to clipboard!');
}

// Cleaner Portal Functions
function loadCleanerChecklist(token) {
    const checklist = checklists.find(c => c.shareToken === token);
    
    if (!checklist) {
        document.getElementById('cleanerChecklistView').innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <h2>Invalid or Expired Link</h2>
                <p>This checklist link is not valid. Please contact the property manager.</p>
            </div>
        `;
        return;
    }
    
    const property = properties.find(p => p.id === checklist.propertyId);
    
    document.getElementById('cleanerChecklistView').innerHTML = `
        <div class="cleaner-checklist">
            <div class="checklist-header">
                <h1>${property.name}</h1>
                <p class="checklist-date">
                    <i class="fas fa-calendar"></i> 
                    Scheduled for ${new Date(checklist.scheduledDate).toLocaleDateString()}
                </p>
                ${property.instructions ? `
                    <div class="special-instructions">
                        <h3><i class="fas fa-info-circle"></i> Special Instructions</h3>
                        <p>${property.instructions}</p>
                    </div>
                ` : ''}
            </div>
            
            <div class="checklist-progress">
                <div class="progress-header">
                    <h3>Progress</h3>
                    <span class="progress-text">0 of 0 completed</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 0%"></div>
                </div>
            </div>
            
            <div class="checklist-content">
                ${checklist.tasks.map((category, catIndex) => `
                    <div class="task-category">
                        <h3>${category.category}</h3>
                        <div class="task-list">
                            ${category.tasks.map((task, taskIndex) => `
                                <div class="task-item" data-task-id="${task.id}">
                                    <label class="task-label">
                                        <input type="checkbox" 
                                               ${task.completed ? 'checked' : ''}
                                               onchange="updateTaskStatus('${token}', '${task.id}', this.checked)">
                                        <span class="task-text">${task.task}</span>
                                    </label>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="cleaner-actions">
                <button class="btn btn-secondary" onclick="reportIssue('${token}')">
                    <i class="fas fa-exclamation-triangle"></i> Report Issue
                </button>
                <button class="btn btn-primary" onclick="showPhotoVerification('${token}')">
                    <i class="fas fa-camera"></i> Add Photos & Complete
                </button>
            </div>
            
            <div class="supplies-section">
                <h3><i class="fas fa-box"></i> Supplies Needed</h3>
                <div id="suppliesList">
                    <p>No supplies reported yet.</p>
                </div>
                <button class="btn btn-outline" onclick="addSupplyRequest('${token}')">
                    <i class="fas fa-plus"></i> Request Supplies
                </button>
            </div>
        </div>
    `;
    
    updateChecklistProgress(token);
}

function updateTaskStatus(token, taskId, completed) {
    const checklist = checklists.find(c => c.shareToken === token);
    if (!checklist) return;
    
    // Find and update the task
    checklist.tasks.forEach(category => {
        const task = category.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = completed;
            task.completedAt = completed ? new Date().toISOString() : null;
        }
    });
    
    saveToLocalStorage('checklists', checklists);
    updateChecklistProgress(token);
}

function updateChecklistProgress(token) {
    const checklist = checklists.find(c => c.shareToken === token);
    if (!checklist) return;
    
    let totalTasks = 0;
    let completedTasks = 0;
    
    checklist.tasks.forEach(category => {
        totalTasks += category.tasks.length;
        completedTasks += category.tasks.filter(t => t.completed).length;
    });
    
    const percentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    document.querySelector('.progress-text').textContent = `${completedTasks} of ${totalTasks} completed`;
    document.querySelector('.progress-fill').style.width = `${percentage}%`;
}

function reportIssue(token) {
    const issue = prompt('Please describe the issue:');
    if (issue) {
        // In production, this would send a notification to the property owner
        showNotification('Issue reported. The property owner will be notified.');
    }
}

function addSupplyRequest(token) {
    const supplies = prompt('What supplies are needed? (comma-separated)');
    if (supplies) {
        const suppliesList = document.getElementById('suppliesList');
        suppliesList.innerHTML = supplies.split(',').map(supply => `
            <div class="supply-item">
                <i class="fas fa-check"></i> ${supply.trim()}
            </div>
        `).join('');
        
        showNotification('Supply request added. The property owner will be notified.');
    }
}

function showPhotoVerification(token) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Add Verification Photos</h2>
                <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <p>Please upload photos of the completed cleaning for verification:</p>
                
                <div class="photo-upload-grid">
                    <div class="photo-upload-section">
                        <h3><i class="fas fa-bed"></i> Bedrooms</h3>
                        <div class="photo-upload-area" onclick="triggerFileUpload('bedroom')">
                            <i class="fas fa-camera"></i>
                            <p>Click to upload photos</p>
                            <input type="file" id="bedroom-photos" accept="image/*" multiple style="display: none;" onchange="handlePhotoUpload(event, 'bedroom', '${token}')">
                        </div>
                        <div id="bedroom-preview" class="photo-preview"></div>
                    </div>
                    
                    <div class="photo-upload-section">
                        <h3><i class="fas fa-couch"></i> Living Areas</h3>
                        <div class="photo-upload-area" onclick="triggerFileUpload('living')">
                            <i class="fas fa-camera"></i>
                            <p>Click to upload photos</p>
                            <input type="file" id="living-photos" accept="image/*" multiple style="display: none;" onchange="handlePhotoUpload(event, 'living', '${token}')">
                        </div>
                        <div id="living-preview" class="photo-preview"></div>
                    </div>
                    
                    <div class="photo-upload-section">
                        <h3><i class="fas fa-sink"></i> Kitchen</h3>
                        <div class="photo-upload-area" onclick="triggerFileUpload('kitchen')">
                            <i class="fas fa-camera"></i>
                            <p>Click to upload photos</p>
                            <input type="file" id="kitchen-photos" accept="image/*" multiple style="display: none;" onchange="handlePhotoUpload(event, 'kitchen', '${token}')">
                        </div>
                        <div id="kitchen-preview" class="photo-preview"></div>
                    </div>
                    
                    <div class="photo-upload-section">
                        <h3><i class="fas fa-bath"></i> Bathrooms</h3>
                        <div class="photo-upload-area" onclick="triggerFileUpload('bathroom')">
                            <i class="fas fa-camera"></i>
                            <p>Click to upload photos</p>
                            <input type="file" id="bathroom-photos" accept="image/*" multiple style="display: none;" onchange="handlePhotoUpload(event, 'bathroom', '${token}')">
                        </div>
                        <div id="bathroom-preview" class="photo-preview"></div>
                    </div>
                </div>
                
                <div class="completion-notes">
                    <label>Additional Notes (Optional)</label>
                    <textarea id="completionNotes" rows="3" placeholder="Any issues or special notes about the cleaning..."></textarea>
                </div>
                
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                    <button class="btn btn-primary" onclick="completeWithPhotos('${token}')">
                        <i class="fas fa-check"></i> Complete Cleaning
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function triggerFileUpload(area) {
    document.getElementById(`${area}-photos`).click();
}

function handlePhotoUpload(event, area, token) {
    const files = event.target.files;
    const previewContainer = document.getElementById(`${area}-preview`);
    
    // Clear existing previews
    previewContainer.innerHTML = '';
    
    // Store photos in temporary storage
    if (!window.uploadedPhotos) {
        window.uploadedPhotos = {};
    }
    window.uploadedPhotos[area] = [];
    
    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.createElement('div');
            preview.className = 'photo-thumbnail';
            preview.innerHTML = `
                <img src="${e.target.result}" alt="${area} photo">
                <button class="remove-photo" onclick="removePhoto('${area}', ${window.uploadedPhotos[area].length})">
                    <i class="fas fa-times"></i>
                </button>
            `;
            previewContainer.appendChild(preview);
            
            window.uploadedPhotos[area].push({
                data: e.target.result,
                name: file.name,
                timestamp: new Date().toISOString()
            });
        };
        reader.readAsDataURL(file);
    });
}

function removePhoto(area, index) {
    window.uploadedPhotos[area].splice(index, 1);
    // Re-render previews
    const previewContainer = document.getElementById(`${area}-preview`);
    previewContainer.innerHTML = window.uploadedPhotos[area].map((photo, i) => `
        <div class="photo-thumbnail">
            <img src="${photo.data}" alt="${area} photo">
            <button class="remove-photo" onclick="removePhoto('${area}', ${i})">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

function completeWithPhotos(token) {
    const checklist = checklists.find(c => c.shareToken === token);
    if (!checklist) return;
    
    const notes = document.getElementById('completionNotes').value;
    const photoCount = Object.values(window.uploadedPhotos || {})
        .reduce((total, photos) => total + photos.length, 0);
    
    if (photoCount === 0) {
        if (!confirm('No photos uploaded. Are you sure you want to complete without photo verification?')) {
            return;
        }
    }
    
    // Save completion data
    checklist.status = 'completed';
    checklist.completedAt = new Date().toISOString();
    checklist.verificationPhotos = window.uploadedPhotos || {};
    checklist.completionNotes = notes;
    
    saveToLocalStorage('checklists', checklists);
    
    // Clear temporary photo storage
    window.uploadedPhotos = {};
    
    showNotification('Cleaning completed with photo verification!');
    
    // Close modal and show completion message
    document.querySelector('.modal').remove();
    
    document.getElementById('cleanerChecklistView').innerHTML = `
        <div class="completion-message">
            <i class="fas fa-check-circle"></i>
            <h2>Checklist Completed!</h2>
            <p>Thank you for completing the cleaning. ${photoCount} verification photos have been uploaded.</p>
            <p>The property owner has been notified.</p>
        </div>
    `;
}

// Utility Functions
function generateId() {
    return 'id_' + Math.random().toString(36).substr(2, 9);
}

function generateShareToken() {
    return Math.random().toString(36).substr(2, 16);
}

function saveToLocalStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function loadFromLocalStorage(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function loadSampleData() {
    // Load saved data or use sample data
    properties = loadFromLocalStorage('properties') || [
        {
            id: 'prop1',
            name: 'Beach House Apt 2A',
            type: 'apartment',
            address: '123 Ocean Drive, Miami Beach, FL',
            unit: 'Apt 2A',
            bedrooms: 2,
            bathrooms: 1.5,
            instructions: 'Use keypad code 1234. Please water the plants on the balcony.',
            createdAt: new Date().toISOString(),
            userId: 'user1'
        },
        {
            id: 'prop2',
            name: 'Downtown Loft',
            type: 'condo',
            address: '456 Main Street, Downtown',
            unit: 'Unit 15B',
            bedrooms: 1,
            bathrooms: 1,
            instructions: 'Parking pass in kitchen drawer.',
            createdAt: new Date().toISOString(),
            userId: 'user1'
        }
    ];
    
    teamMembers = loadFromLocalStorage('teamMembers') || [
        {
            id: 'team1',
            name: 'Maria Santos',
            email: 'maria@cleaning.com',
            phone: '(555) 123-4567',
            role: 'cleaner',
            rating: 4.8,
            completedCleanings: 127
        },
        {
            id: 'team2',
            name: 'John Davis',
            email: 'john@cleaning.com',
            phone: '(555) 234-5678',
            role: 'cleaner',
            rating: 4.9,
            completedCleanings: 203
        }
    ];
    
    checklists = loadFromLocalStorage('checklists') || [];
}

function loadDashboardData() {
    // Update stats
    const properties = loadFromLocalStorage('properties') || [];
    const checklists = loadFromLocalStorage('checklists') || [];
    const teamMembers = loadFromLocalStorage('teamMembers') || [];
    const bookings = loadFromLocalStorage('bookings') || [];
    
    // Update stat numbers
    document.getElementById('totalProperties').textContent = properties.length;
    document.getElementById('activeChecklists').textContent = checklists.filter(c => c.status === 'pending').length;
    document.getElementById('totalCleaners').textContent = teamMembers.length;
    
    // Today's tasks
    const today = new Date().toDateString();
    const todayTasks = checklists.filter(c => 
        new Date(c.scheduledDate).toDateString() === today
    );
    document.getElementById('todayTasks').textContent = todayTasks.length;
    
    // Load today's schedule
    loadTodaySchedule();
    
    // Load recent activity
    loadRecentActivity();
}

function loadTodaySchedule() {
    const schedule = document.getElementById('todaySchedule');
    if (!schedule) return;
    
    const checklists = loadFromLocalStorage('checklists') || [];
    const properties = loadFromLocalStorage('properties') || [];
    const teamMembers = loadFromLocalStorage('teamMembers') || [];
    
    const today = new Date().toDateString();
    const todayChecklists = checklists
        .filter(c => new Date(c.scheduledDate).toDateString() === today)
        .sort((a, b) => (a.scheduledTime || '00:00') - (b.scheduledTime || '00:00'));
    
    if (todayChecklists.length === 0) {
        schedule.innerHTML = '<p class="empty-state">No cleanings scheduled for today</p>';
        return;
    }
    
    schedule.innerHTML = todayChecklists.map(checklist => {
        const property = properties.find(p => p.id === checklist.propertyId);
        const cleaner = teamMembers.find(m => m.id === checklist.cleanerId);
        const time = checklist.scheduledTime || '10:00';
        
        return `
            <div class="schedule-item ${checklist.status}">
                <div class="schedule-info">
                    <h4>${property ? property.name : 'Unknown Property'}</h4>
                    <p>${time} • ${cleaner ? cleaner.name : 'Unassigned'} ${checklist.automatedBooking ? '• Auto-scheduled' : ''}</p>
                </div>
                <div class="schedule-status ${checklist.status === 'completed' ? 'status-completed' : 'status-pending'}">
                    ${checklist.status === 'completed' ? 'Completed' : 'Pending'}
                </div>
            </div>
        `;
    }).join('');
}

function loadRecentActivity() {
    const activityList = document.querySelector('.activity-list');
    if (!activityList) return;
    
    const activities = [];
    const checklists = loadFromLocalStorage('checklists') || [];
    const bookings = loadFromLocalStorage('bookings') || [];
    const properties = loadFromLocalStorage('properties') || [];
    
    // Add recent completed cleanings
    checklists
        .filter(c => c.status === 'completed')
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
        .slice(0, 3)
        .forEach(checklist => {
            const property = properties.find(p => p.id === checklist.propertyId);
            const hasPhotos = checklist.verificationPhotos && 
                Object.values(checklist.verificationPhotos).some(photos => photos.length > 0);
            
            activities.push({
                type: 'completed',
                title: `${property?.name || 'Property'} cleaning completed`,
                subtitle: `${getTimeAgo(checklist.completedAt)}${hasPhotos ? ' • Photos verified' : ''}`,
                icon: 'check',
                iconClass: 'completed'
            });
        });
    
    // Add recent bookings
    bookings
        .sort((a, b) => new Date(b.createdAt || b.checkIn) - new Date(a.createdAt || a.checkIn))
        .slice(0, 2)
        .forEach(booking => {
            const property = properties.find(p => p.id === booking.propertyId);
            activities.push({
                type: 'booking',
                title: `New booking for ${property?.name || 'Property'}`,
                subtitle: `Check-out: ${new Date(booking.checkOut).toLocaleDateString()}`,
                icon: 'calendar-plus',
                iconClass: 'pending'
            });
        });
    
    // Sort all activities by time and take top 5
    activities.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
    
    if (activities.length === 0) {
        activityList.innerHTML = '<p class="empty-state">No recent activity</p>';
        return;
    }
    
    activityList.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon ${activity.iconClass}">
                <i class="fas fa-${activity.icon}"></i>
            </div>
            <div class="activity-content">
                <p><strong>${activity.title}</strong></p>
                <span class="activity-time">${activity.subtitle}</span>
            </div>
        </div>
    `).join('');
}

function getTimeAgo(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now - time;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    return `${days} days ago`;
}

// Additional dashboard functions
function loadTeamMembers() {
    const grid = document.getElementById('teamGrid');
    if (!grid) return;
    
    if (teamMembers.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <p>No team members yet</p>
                <button class="btn btn-primary" onclick="switchTeamView('marketplace')">
                    <i class="fas fa-search"></i> Find Cleaners
                </button>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = teamMembers.map(member => `
        <div class="team-member-card">
            <div class="member-avatar">
                <i class="fas fa-user-circle"></i>
                ${member.marketplace ? '<span class="marketplace-badge" title="From Marketplace"><i class="fas fa-store"></i></span>' : ''}
            </div>
            <div class="member-info">
                <h3>${member.name}</h3>
                <p>${member.email}</p>
                <p>${member.phone}</p>
                <div class="member-stats">
                    <span class="stat">
                        <i class="fas fa-star"></i> ${member.rating}
                    </span>
                    <span class="stat">
                        <i class="fas fa-check-circle"></i> ${member.completedCleanings} cleanings
                    </span>
                    ${member.hourlyRate ? `<span class="stat">
                        <i class="fas fa-dollar-sign"></i> $${member.hourlyRate}/hr
                    </span>` : ''}
                </div>
            </div>
            <div class="member-actions">
                <button class="btn btn-sm btn-outline" onclick="viewMemberDetails('${member.id}')">
                    <i class="fas fa-chart-line"></i> Stats
                </button>
                <button class="btn btn-sm btn-primary" onclick="assignToProperty('${member.id}')">
                    <i class="fas fa-building"></i> Assign
                </button>
                <button class="btn btn-sm btn-secondary" onclick="removeMember('${member.id}')">
                    <i class="fas fa-trash"></i> Remove
                </button>
            </div>
        </div>
    `).join('');
}

function viewMemberDetails(memberId) {
    const member = teamMembers.find(m => m.id === memberId);
    if (!member) return;
    
    showNotification(`Opening details for ${member.name}...`);
    // In production, would show detailed stats modal
}

function assignToProperty(memberId) {
    const member = teamMembers.find(m => m.id === memberId);
    if (!member) return;
    
    showNotification(`Opening property assignment for ${member.name}...`);
    // In production, would show property assignment modal
}

function removeMember(memberId) {
    if (confirm('Are you sure you want to remove this team member?')) {
        teamMembers = teamMembers.filter(m => m.id !== memberId);
        saveToLocalStorage('teamMembers', teamMembers);
        loadTeamMembers();
        showNotification('Team member removed');
    }
}

function loadChecklists() {
    const container = document.getElementById('activeChecklistsList');
    if (!container) return;
    
    const activeChecklists = checklists.filter(c => c.status !== 'completed');
    
    if (activeChecklists.length === 0) {
        container.innerHTML = '<p class="empty-state">No active checklists. Create one to get started!</p>';
        return;
    }
    
    container.innerHTML = activeChecklists.map(checklist => {
        const property = properties.find(p => p.id === checklist.propertyId);
        const cleaner = teamMembers.find(m => m.id === checklist.cleanerId);
        
        return `
            <div class="checklist-card">
                <div class="checklist-info">
                    <h4>${property ? property.name : 'Unknown Property'}</h4>
                    <p>
                        <i class="fas fa-calendar"></i> 
                        ${new Date(checklist.scheduledDate).toLocaleDateString()}
                    </p>
                    <p>
                        <i class="fas fa-user"></i> 
                        ${cleaner ? cleaner.name : 'Unassigned'}
                    </p>
                </div>
                <div class="checklist-actions">
                    <button class="btn btn-sm btn-outline" onclick="viewChecklist('${checklist.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="showShareLink(${JSON.stringify(checklist).replace(/"/g, '&quot;')})">
                        <i class="fas fa-share"></i> Share
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Demo functions
function watchDemo() {
    alert('Demo video coming soon!');
}

function showInviteModal() {
    alert('Team invitation feature coming soon!');
}

// Initialize smooth scrolling for landing page links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Pricing Functions
function calculatePricing(cleaningType, propertySize, addons = [], feeModel = 'standard') {
    // Get base price
    let basePrice = BASE_PRICES[cleaningType][propertySize] || 0;
    
    // Add addon prices
    let addonTotal = 0;
    addons.forEach(addon => {
        addonTotal += ADDONS[addon] || 0;
    });
    
    // Calculate cleaner payout
    const cleanerPayout = basePrice + addonTotal;
    
    // Calculate platform fee
    const feePercentage = FEE_MODELS[feeModel].percentage;
    const platformFee = Math.round(cleanerPayout * (feePercentage / 100) * 100) / 100;
    
    // Calculate total host pays
    const totalPrice = cleanerPayout + platformFee;
    
    return {
        cleanerPayout: cleanerPayout,
        platformFee: platformFee,
        totalPrice: totalPrice,
        feePercentage: feePercentage,
        breakdown: {
            baseService: basePrice,
            addons: addonTotal,
            addonsList: addons
        }
    };
}

function getPropertySize(bedrooms) {
    if (bedrooms === 0) return 'studio';
    if (bedrooms === 1) return 'oneBed';
    if (bedrooms === 2) return 'twoBed';
    if (bedrooms === 3) return 'threeBed';
    return 'fourBed';
}

function getUserFeeModel(user) {
    // Determine fee model based on user's booking history
    if (!user) return 'standard';
    
    const bookingCount = checklists.filter(c => 
        c.userId === user.id && c.status === 'completed'
    ).length;
    
    if (bookingCount >= 20) return 'highVolume';
    return 'standard';
}

function showPricingType(type) {
    // Update active tab
    document.querySelectorAll('.pricing-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Show/hide content
    document.querySelectorAll('.pricing-content').forEach(content => {
        content.classList.remove('active');
    });
    
    if (type === 'cleaning') {
        document.getElementById('cleaningPricing').classList.add('active');
    } else {
        document.getElementById('platformPricing').classList.add('active');
    }
}

// Integration Functions
function loadIntegrations() {
    loadBookingsTimeline();
}

function syncBookings(platform) {
    const platformNames = {
        'channel1': 'Property Channel 1',
        'vrbo': 'VRBO',
        'booking': 'Booking.com'
    };
    const displayName = platformNames[platform] || platform;
    
    showNotification(`Syncing ${displayName} bookings...`);
    
    // Simulate sync process
    setTimeout(() => {
        // Generate some sample bookings
        const newBookings = generateSampleBookings();
        
        // Create automatic cleaning schedules
        newBookings.forEach(booking => {
            if (shouldAutoSchedule()) {
                createAutomaticCleaning(booking);
            }
        });
        
        showNotification(`Synced ${newBookings.length} new bookings from ${displayName}`, 'success');
        loadBookingsTimeline();
    }, 2000);
}

function generateSampleBookings() {
    const bookings = [];
    const properties = loadFromLocalStorage('properties') || [];
    
    if (properties.length === 0) return bookings;
    
    // Generate 3-5 random bookings
    const numBookings = Math.floor(Math.random() * 3) + 3;
    
    for (let i = 0; i < numBookings; i++) {
        const property = properties[Math.floor(Math.random() * properties.length)];
        const checkIn = new Date();
        checkIn.setDate(checkIn.getDate() + Math.floor(Math.random() * 14) + 1);
        
        const checkOut = new Date(checkIn);
        checkOut.setDate(checkOut.getDate() + Math.floor(Math.random() * 5) + 2);
        
        bookings.push({
            id: generateId(),
            propertyId: property.id,
            propertyName: property.name,
            guestName: `Guest ${Math.floor(Math.random() * 1000)}`,
            checkIn: checkIn.toISOString(),
            checkOut: checkOut.toISOString(),
            platform: 'channel1',
            status: 'confirmed'
        });
    }
    
    // Save bookings
    const existingBookings = loadFromLocalStorage('bookings') || [];
    const allBookings = [...existingBookings, ...bookings];
    saveToLocalStorage('bookings', allBookings);
    
    return bookings;
}

function createAutomaticCleaning(booking) {
    const bufferTime = parseInt(document.getElementById('bufferTime')?.value || 2);
    const cleaningDate = new Date(booking.checkOut);
    cleaningDate.setHours(cleaningDate.getHours() + bufferTime);
    
    // Check if same-day turnover
    const nextBooking = findNextBooking(booking.propertyId, booking.checkOut);
    const isSameDay = nextBooking && 
        new Date(nextBooking.checkIn).toDateString() === new Date(booking.checkOut).toDateString();
    
    const checklist = {
        id: generateId(),
        propertyId: booking.propertyId,
        cleanerId: shouldAutoAssign() ? assignBestCleaner(cleaningDate) : null,
        scheduledDate: cleaningDate.toISOString().split('T')[0],
        scheduledTime: cleaningDate.toTimeString().slice(0, 5),
        template: isSameDay ? 'quick' : 'standard',
        tasks: isSameDay ? getQuickCleanChecklistItems() : getStandardChecklistItems(),
        status: 'pending',
        priority: isSameDay ? 'high' : 'normal',
        createdAt: new Date().toISOString(),
        shareToken: generateShareToken(),
        automatedBooking: true,
        bookingId: booking.id
    };
    
    const existingChecklists = loadFromLocalStorage('checklists') || [];
    existingChecklists.push(checklist);
    saveToLocalStorage('checklists', existingChecklists);
}

function shouldAutoSchedule() {
    return document.getElementById('autoSchedule')?.checked ?? true;
}

function shouldAutoAssign() {
    return document.getElementById('autoAssign')?.checked ?? false;
}

function assignBestCleaner(date) {
    const cleaners = loadFromLocalStorage('teamMembers') || [];
    if (cleaners.length === 0) return null;
    
    // Simple assignment - in production would check availability
    return cleaners[0].id;
}

function findNextBooking(propertyId, afterDate) {
    const bookings = loadFromLocalStorage('bookings') || [];
    return bookings
        .filter(b => b.propertyId === propertyId && new Date(b.checkIn) > new Date(afterDate))
        .sort((a, b) => new Date(a.checkIn) - new Date(b.checkIn))[0];
}

function getQuickCleanChecklistItems() {
    return [
        {
            name: 'Priority Areas',
            tasks: [
                'Change bed linens',
                'Clean bathroom essentials',
                'Quick kitchen wipe down',
                'Empty all trash',
                'Vacuum high-traffic areas',
                'Restock supplies'
            ]
        }
    ];
}

function loadBookingsTimeline() {
    const timeline = document.getElementById('bookingsTimeline');
    if (!timeline) return;
    
    const bookings = loadFromLocalStorage('bookings') || [];
    const checklists = loadFromLocalStorage('checklists') || [];
    
    // Get next 7 days of bookings
    const today = new Date();
    const weekFromNow = new Date();
    weekFromNow.setDate(today.getDate() + 7);
    
    const upcomingBookings = bookings
        .filter(b => {
            const checkOut = new Date(b.checkOut);
            return checkOut >= today && checkOut <= weekFromNow;
        })
        .sort((a, b) => new Date(a.checkOut) - new Date(b.checkOut));
    
    if (upcomingBookings.length === 0) {
        timeline.innerHTML = `
            <div class="empty-timeline">
                <i class="fas fa-calendar-times"></i>
                <p>No upcoming bookings in the next 7 days</p>
                <button class="btn btn-primary" onclick="syncBookings('channel1')">
                    <i class="fas fa-sync"></i> Sync Bookings
                </button>
            </div>
        `;
        return;
    }
    
    timeline.innerHTML = upcomingBookings.map(booking => {
        const cleaningScheduled = checklists.find(c => c.bookingId === booking.id);
        const checkOutDate = new Date(booking.checkOut);
        
        return `
            <div class="timeline-item">
                <div class="timeline-date">
                    <div class="date-day">${checkOutDate.getDate()}</div>
                    <div class="date-month">${checkOutDate.toLocaleDateString('en-US', { month: 'short' })}</div>
                </div>
                <div class="timeline-content">
                    <h4>${booking.propertyName}</h4>
                    <p class="timeline-details">
                        <i class="fas fa-user"></i> ${booking.guestName} • 
                        <i class="fas fa-clock"></i> Check-out at ${checkOutDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <div class="timeline-actions">
                        ${cleaningScheduled ? `
                            <span class="status-badge scheduled">
                                <i class="fas fa-check"></i> Cleaning Scheduled
                            </span>
                        ` : `
                            <button class="btn btn-sm btn-primary" onclick="scheduleCleaningFromBooking('${booking.id}')">
                                <i class="fas fa-plus"></i> Schedule Cleaning
                            </button>
                        `}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function scheduleCleaningFromBooking(bookingId) {
    const bookings = loadFromLocalStorage('bookings') || [];
    const booking = bookings.find(b => b.id === bookingId);
    
    if (!booking) return;
    
    // Create cleaning for this booking
    createAutomaticCleaning(booking);
    showNotification('Cleaning scheduled successfully!');
    loadBookingsTimeline();
    loadChecklists();
}

function configureIntegration(platform) {
    showNotification(`Opening ${platform} configuration...`);
    // In production, would open configuration modal
}

function connectIntegration(platform) {
    showNotification(`Connecting to ${platform}...`);
    
    // Simulate OAuth flow
    setTimeout(() => {
        showNotification(`Successfully connected to ${platform}!`, 'success');
        // Reload integrations page
        loadIntegrations();
    }, 2000);
}

function showIcalImport() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Import iCal Calendar</h2>
                <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <p>Paste your property's iCal URL to import bookings:</p>
                <div class="form-group">
                    <label>Property</label>
                    <select id="icalProperty">
                        ${properties.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>iCal URL</label>
                    <input type="url" id="icalUrl" placeholder="https://airbnb.com/calendar/ical/..." required>
                </div>
                <div class="help-text">
                    <p><i class="fas fa-info-circle"></i> You can find your iCal URL in your property listing platform's calendar settings.</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                    <button class="btn btn-primary" onclick="importIcal()">
                        <i class="fas fa-download"></i> Import Calendar
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function importIcal() {
    const url = document.getElementById('icalUrl').value;
    const propertyId = document.getElementById('icalProperty').value;
    
    if (!url) {
        showNotification('Please enter an iCal URL', 'error');
        return;
    }
    
    showNotification('Importing calendar...');
    
    // Simulate import
    setTimeout(() => {
        document.querySelector('.modal').remove();
        const imported = generateSampleBookings();
        showNotification(`Imported ${imported.length} bookings successfully!`, 'success');
        loadBookingsTimeline();
    }, 2000);
}

function updateAutomationSetting(setting) {
    const value = document.getElementById(setting).type === 'checkbox' 
        ? document.getElementById(setting).checked 
        : document.getElementById(setting).value;
    
    // Save settings
    const settings = loadFromLocalStorage('automationSettings') || {};
    settings[setting] = value;
    saveToLocalStorage('automationSettings', settings);
    
    showNotification('Automation settings updated');
}

// Invoice Functions
function loadBilling() {
    loadInvoices();
    updateBillingStats();
}

function updateBillingStats() {
    const invoices = loadFromLocalStorage('invoices') || [];
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    
    const thisMonthInvoices = invoices.filter(inv => {
        const invDate = new Date(inv.date);
        return invDate.getMonth() === thisMonth && invDate.getFullYear() === thisYear;
    });
    
    const totalAmount = thisMonthInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const paidAmount = thisMonthInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total, 0);
    const outstandingAmount = thisMonthInvoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + inv.total, 0);
    
    // Update stats display
    const statsElements = document.querySelectorAll('.billing-card .amount');
    if (statsElements[0]) statsElements[0].textContent = `$${totalAmount.toFixed(2)}`;
    if (statsElements[1]) statsElements[1].textContent = `$${outstandingAmount.toFixed(2)}`;
    if (statsElements[2]) statsElements[2].textContent = `$${paidAmount.toFixed(2)}`;
}

function loadInvoices(filter = 'all') {
    const invoicesList = document.getElementById('invoicesList');
    if (!invoicesList) return;
    
    let invoices = loadFromLocalStorage('invoices') || [];
    
    // Filter invoices
    if (filter !== 'all') {
        invoices = invoices.filter(inv => inv.status === filter);
    }
    
    // Sort by date descending
    invoices.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (invoices.length === 0) {
        invoicesList.innerHTML = '<p class="empty-state">No invoices found</p>';
        return;
    }
    
    invoicesList.innerHTML = invoices.map(invoice => `
        <div class="invoice-item">
            <div class="invoice-header">
                <div>
                    <h4>Invoice #${invoice.number}</h4>
                    <p class="invoice-recipient">${invoice.recipientName}</p>
                </div>
                <span class="invoice-status ${invoice.status}">${invoice.status}</span>
            </div>
            <div class="invoice-details">
                <span><i class="fas fa-calendar"></i> ${new Date(invoice.date).toLocaleDateString()}</span>
                <span><i class="fas fa-dollar-sign"></i> ${invoice.total.toFixed(2)}</span>
            </div>
            <div class="invoice-actions">
                <button class="btn btn-sm btn-outline" onclick="viewInvoice('${invoice.id}')">
                    <i class="fas fa-eye"></i> View
                </button>
                ${invoice.status === 'pending' ? `
                    <button class="btn btn-sm btn-primary" onclick="markInvoicePaid('${invoice.id}')">
                        <i class="fas fa-check"></i> Mark Paid
                    </button>
                ` : ''}
                <button class="btn btn-sm btn-secondary" onclick="emailInvoice('${invoice.id}')">
                    <i class="fas fa-envelope"></i> Email
                </button>
            </div>
        </div>
    `).join('');
}

function filterInvoices(filter) {
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    loadInvoices(filter);
}

function showCreateInvoiceModal() {
    const modal = document.getElementById('createInvoiceModal');
    modal.style.display = 'flex';
    
    // Populate dropdowns
    const properties = loadFromLocalStorage('properties') || [];
    const cleaners = loadFromLocalStorage('teamMembers') || [];
    
    document.getElementById('invoiceProperty').innerHTML = 
        '<option value="">Choose a property</option>' +
        properties.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    
    document.getElementById('invoiceCleaner').innerHTML = 
        '<option value="">Choose a cleaner</option>' +
        cleaners.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

function closeCreateInvoiceModal() {
    document.getElementById('createInvoiceModal').style.display = 'none';
    document.getElementById('createInvoiceForm').reset();
}

function updateInvoiceForm(type) {
    const propertyFields = document.getElementById('propertyInvoiceFields');
    const cleanerFields = document.getElementById('cleanerInvoiceFields');
    
    if (type === 'property') {
        propertyFields.style.display = 'block';
        cleanerFields.style.display = 'none';
    } else {
        propertyFields.style.display = 'none';
        cleanerFields.style.display = 'block';
    }
}

function loadPropertyCleanings(propertyId) {
    if (!propertyId) return;
    
    const checklists = loadFromLocalStorage('checklists') || [];
    const cleaners = loadFromLocalStorage('teamMembers') || [];
    
    const propertyCleanings = checklists.filter(c => 
        c.propertyId === propertyId && 
        c.status === 'completed' &&
        !c.invoiced
    );
    
    const cleaningsContainer = document.getElementById('cleaningsToInvoice');
    
    if (propertyCleanings.length === 0) {
        cleaningsContainer.innerHTML = '<p class="empty-state">No uninvoiced cleanings for this property</p>';
        return;
    }
    
    cleaningsContainer.innerHTML = propertyCleanings.map(cleaning => {
        const cleaner = cleaners.find(c => c.id === cleaning.cleanerId);
        const property = properties.find(p => p.id === cleaning.propertyId);
        const propertySize = getPropertySize(property.bedrooms);
        const pricing = calculatePricing('standard', propertySize);
        
        return `
            <div class="cleaning-item">
                <label>
                    <input type="checkbox" value="${cleaning.id}" data-amount="${pricing.totalPrice}" data-cleaner-amount="${pricing.cleanerPayout}" onchange="updateInvoiceTotal()">
                    <span class="cleaning-info">
                        <strong>${new Date(cleaning.scheduledDate).toLocaleDateString()}</strong>
                        - ${cleaner ? cleaner.name : 'Unassigned'}
                        - $${pricing.totalPrice.toFixed(2)}
                        <span class="fee-info">(Cleaner: $${pricing.cleanerPayout}, Fee: $${pricing.platformFee.toFixed(2)})</span>
                    </span>
                </label>
            </div>
        `;
    }).join('');
}

function loadCleanerWork(cleanerId) {
    if (!cleanerId) return;
    
    const checklists = loadFromLocalStorage('checklists') || [];
    const properties = loadFromLocalStorage('properties') || [];
    const cleaner = teamMembers.find(c => c.id === cleanerId);
    
    const cleanerWork = checklists.filter(c => 
        c.cleanerId === cleanerId && 
        c.status === 'completed' &&
        !c.paidToCleaner
    );
    
    const workSummary = document.getElementById('cleanerWorkSummary');
    
    if (cleanerWork.length === 0) {
        workSummary.innerHTML = '<p class="empty-state">No unpaid work for this cleaner</p>';
        return;
    }
    
    const totalAmount = cleanerWork.length * 50; // $50 per cleaning for cleaners
    
    workSummary.innerHTML = `
        <div class="work-summary">
            <h4>Work Summary for ${cleaner.name}</h4>
            <div class="summary-stats">
                <div class="stat">
                    <span class="label">Cleanings Completed</span>
                    <span class="value">${cleanerWork.length}</span>
                </div>
                <div class="stat">
                    <span class="label">Rate per Cleaning</span>
                    <span class="value">$50.00</span>
                </div>
                <div class="stat">
                    <span class="label">Total Amount</span>
                    <span class="value">$${totalAmount.toFixed(2)}</span>
                </div>
            </div>
            <div class="work-details">
                ${cleanerWork.map(work => {
                    const property = properties.find(p => p.id === work.propertyId);
                    return `
                        <div class="work-item">
                            <input type="hidden" class="cleaner-work" value="${work.id}" data-amount="50">
                            <span>${new Date(work.completedAt).toLocaleDateString()} - ${property?.name || 'Unknown'}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
    
    updateInvoiceTotal();
}

function updateInvoiceTotal() {
    let total = 0;
    const summaryContainer = document.getElementById('invoiceSummaryItems');
    const items = [];
    
    // Property invoice items
    document.querySelectorAll('#cleaningsToInvoice input[type="checkbox"]:checked').forEach(checkbox => {
        const amount = parseFloat(checkbox.dataset.amount);
        total += amount;
        items.push({
            description: 'Cleaning Service',
            amount: amount
        });
    });
    
    // Cleaner invoice items
    document.querySelectorAll('.cleaner-work').forEach(input => {
        const amount = parseFloat(input.dataset.amount);
        total += amount;
    });
    
    if (document.getElementById('invoiceType').value === 'cleaner' && document.getElementById('invoiceCleaner').value) {
        const workItems = document.querySelectorAll('.cleaner-work');
        if (workItems.length > 0) {
            items.push({
                description: `${workItems.length} Cleanings @ $50/each`,
                amount: workItems.length * 50
            });
        }
    }
    
    // Update summary
    summaryContainer.innerHTML = items.map(item => `
        <div class="summary-item">
            <span>${item.description}</span>
            <span>$${item.amount.toFixed(2)}</span>
        </div>
    `).join('');
    
    document.getElementById('invoiceTotal').textContent = `$${total.toFixed(2)}`;
}

function handleCreateInvoice(event) {
    event.preventDefault();
    
    const type = document.getElementById('invoiceType').value;
    const invoiceNumber = 'INV-' + Date.now().toString().slice(-6);
    
    let invoice = {
        id: generateId(),
        number: invoiceNumber,
        type: type,
        date: document.getElementById('invoiceDate').value,
        status: 'pending',
        notes: document.getElementById('invoiceNotes').value,
        createdAt: new Date().toISOString()
    };
    
    if (type === 'property') {
        const property = properties.find(p => p.id === document.getElementById('invoiceProperty').value);
        const selectedCleanings = Array.from(document.querySelectorAll('#cleaningsToInvoice input[type="checkbox"]:checked'))
            .map(cb => cb.value);
        
        invoice.recipientType = 'property';
        invoice.recipientId = property.id;
        invoice.recipientName = property.name;
        
        // Calculate pricing with fee model
        const propertySize = getPropertySize(property.bedrooms);
        const pricing = calculatePricing('standard', propertySize, [], getUserFeeModel(currentUser));
        
        invoice.items = [
            {
                description: `Cleaning Services (${selectedCleanings.length} cleanings)`,
                quantity: selectedCleanings.length,
                rate: pricing.cleanerPayout,
                amount: pricing.cleanerPayout * selectedCleanings.length
            },
            {
                description: `Platform Service Fee (${pricing.feePercentage}%)`,
                quantity: 1,
                rate: pricing.platformFee * selectedCleanings.length,
                amount: pricing.platformFee * selectedCleanings.length
            }
        ];
        invoice.total = pricing.totalPrice * selectedCleanings.length;
        invoice.cleanerPayout = pricing.cleanerPayout * selectedCleanings.length;
        invoice.platformFee = pricing.platformFee * selectedCleanings.length;
        
        // Mark cleanings as invoiced
        const checklists = loadFromLocalStorage('checklists') || [];
        checklists.forEach(checklist => {
            if (selectedCleanings.includes(checklist.id)) {
                checklist.invoiced = true;
                checklist.invoiceId = invoice.id;
            }
        });
        saveToLocalStorage('checklists', checklists);
        
    } else {
        const cleaner = teamMembers.find(c => c.id === document.getElementById('invoiceCleaner').value);
        const cleanerWork = document.querySelectorAll('.cleaner-work');
        
        invoice.recipientType = 'cleaner';
        invoice.recipientId = cleaner.id;
        invoice.recipientName = cleaner.name;
        invoice.items = [{
            description: `${cleanerWork.length} Cleanings`,
            quantity: cleanerWork.length,
            rate: 50,
            amount: cleanerWork.length * 50
        }];
        invoice.total = cleanerWork.length * 50;
        
        // Mark work as paid
        const checklists = loadFromLocalStorage('checklists') || [];
        cleanerWork.forEach(work => {
            const checklist = checklists.find(c => c.id === work.value);
            if (checklist) {
                checklist.paidToCleaner = true;
                checklist.cleanerInvoiceId = invoice.id;
            }
        });
        saveToLocalStorage('checklists', checklists);
    }
    
    // Save invoice
    const invoices = loadFromLocalStorage('invoices') || [];
    invoices.push(invoice);
    saveToLocalStorage('invoices', invoices);
    
    closeCreateInvoiceModal();
    showNotification('Invoice created successfully!');
    loadBilling();
    
    // Show preview
    viewInvoice(invoice.id);
}

function viewInvoice(invoiceId) {
    const invoices = loadFromLocalStorage('invoices') || [];
    const invoice = invoices.find(inv => inv.id === invoiceId);
    
    if (!invoice) return;
    
    const modal = document.getElementById('invoicePreviewModal');
    const preview = document.getElementById('invoicePreview');
    
    preview.innerHTML = `
        <div class="invoice-document">
            <div class="invoice-header">
                <div class="company-info">
                    <h1>Host Helper Clean</h1>
                    <p>Professional Rental Cleaning Management</p>
                    <p>123 Main Street, Suite 100</p>
                    <p>Your City, ST 12345</p>
                    <p>Phone: (555) 123-4567</p>
                    <p>Email: support@hosthelperclean.com</p>
                </div>
                <div class="invoice-info">
                    <h2>INVOICE</h2>
                    <p><strong>Invoice #:</strong> ${invoice.number}</p>
                    <p><strong>Date:</strong> ${new Date(invoice.date).toLocaleDateString()}</p>
                    <p><strong>Status:</strong> <span class="invoice-status ${invoice.status}">${invoice.status.toUpperCase()}</span></p>
                </div>
            </div>
            
            <div class="invoice-recipient">
                <h3>${invoice.recipientType === 'property' ? 'Bill To:' : 'Pay To:'}</h3>
                <p><strong>${invoice.recipientName}</strong></p>
            </div>
            
            <table class="invoice-table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>Quantity</th>
                        <th>Rate</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${invoice.items.map(item => `
                        <tr>
                            <td>${item.description}</td>
                            <td>${item.quantity}</td>
                            <td>$${item.rate.toFixed(2)}</td>
                            <td>$${item.amount.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3"><strong>Total</strong></td>
                        <td><strong>$${invoice.total.toFixed(2)}</strong></td>
                    </tr>
                </tfoot>
            </table>
            
            ${invoice.notes ? `
                <div class="invoice-notes">
                    <h4>Notes</h4>
                    <p>${invoice.notes}</p>
                </div>
            ` : ''}
            
            <div class="invoice-footer">
                <p>Thank you for your business!</p>
                ${invoice.recipientType === 'property' ? 
                    '<p>Payment is due within 30 days of invoice date.</p>' :
                    '<p>Payment will be processed within 3-5 business days.</p>'
                }
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
}

function closeInvoicePreview() {
    document.getElementById('invoicePreviewModal').style.display = 'none';
}

function printInvoice() {
    window.print();
}

function downloadInvoice() {
    showNotification('PDF download functionality would be implemented in production');
}

function markInvoicePaid(invoiceId) {
    const invoices = loadFromLocalStorage('invoices') || [];
    const invoice = invoices.find(inv => inv.id === invoiceId);
    
    if (invoice) {
        invoice.status = 'paid';
        invoice.paidAt = new Date().toISOString();
        saveToLocalStorage('invoices', invoices);
        
        showNotification('Invoice marked as paid');
        loadBilling();
    }
}

function emailInvoice(invoiceId) {
    showNotification('Email functionality would be implemented in production');
}

// Team & Marketplace Functions
function switchTeamView(view) {
    // Update toggle buttons
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Show/hide views
    document.querySelectorAll('.team-view').forEach(v => {
        v.classList.remove('active');
    });
    
    if (view === 'myteam') {
        document.getElementById('myTeamView').classList.add('active');
        loadTeamMembers();
    } else {
        document.getElementById('marketplaceView').classList.add('active');
        loadMarketplace();
    }
}

function loadMarketplace() {
    // Load sample marketplace cleaners
    const marketplaceCleaners = getMarketplaceCleaners();
    displayMarketplaceResults(marketplaceCleaners);
}

function getMarketplaceCleaners() {
    // In production, this would fetch from a database
    return [
        {
            id: 'market1',
            name: 'Sarah Johnson',
            photo: 'images/cleaner1.jpg',
            rating: 4.9,
            reviews: 156,
            experience: 5,
            hourlyRate: 45,
            location: 'Miami, FL',
            distance: 2.3,
            availability: 'Flexible',
            specialties: ['Deep Cleaning', 'Move-out Cleaning', 'Eco-friendly'],
            bio: 'Professional cleaner with 5 years of experience in vacation rental properties.',
            languages: ['English', 'Spanish'],
            backgroundCheck: true,
            insured: true
        },
        {
            id: 'market2',
            name: 'Michael Chen',
            photo: 'images/cleaner2.jpg',
            rating: 4.8,
            reviews: 89,
            experience: 3,
            hourlyRate: 40,
            location: 'Miami Beach, FL',
            distance: 3.5,
            availability: 'Weekdays',
            specialties: ['Standard Cleaning', 'Quick Turnovers'],
            bio: 'Efficient and reliable cleaning professional specializing in rental properties.',
            languages: ['English', 'Mandarin'],
            backgroundCheck: true,
            insured: true
        },
        {
            id: 'market3',
            name: 'Elena Rodriguez',
            photo: 'images/cleaner3.jpg',
            rating: 5.0,
            reviews: 234,
            experience: 8,
            hourlyRate: 50,
            location: 'Coral Gables, FL',
            distance: 5.1,
            availability: 'Flexible',
            specialties: ['Luxury Properties', 'Deep Cleaning', 'Organization'],
            bio: 'Expert in high-end vacation rentals with attention to detail.',
            languages: ['English', 'Spanish', 'Portuguese'],
            backgroundCheck: true,
            insured: true
        },
        {
            id: 'market4',
            name: 'James Williams',
            photo: 'images/cleaner4.jpg',
            rating: 4.7,
            reviews: 67,
            experience: 2,
            hourlyRate: 35,
            location: 'Downtown Miami, FL',
            distance: 1.8,
            availability: 'Weekends',
            specialties: ['Standard Cleaning', 'Laundry Service'],
            bio: 'Dedicated cleaner with growing experience in short-term rentals.',
            languages: ['English'],
            backgroundCheck: true,
            insured: false
        }
    ];
}

function displayMarketplaceResults(cleaners) {
    const grid = document.getElementById('marketplaceGrid');
    
    if (cleaners.length === 0) {
        grid.innerHTML = '<p class="empty-state">No cleaners found matching your criteria</p>';
        return;
    }
    
    grid.innerHTML = cleaners.map(cleaner => `
        <div class="cleaner-card marketplace">
            <div class="cleaner-header">
                <div class="cleaner-avatar">
                    <i class="fas fa-user-circle"></i>
                    ${cleaner.backgroundCheck ? '<span class="verified-badge" title="Background Check Verified"><i class="fas fa-check-circle"></i></span>' : ''}
                </div>
                <div class="cleaner-basic">
                    <h3>${cleaner.name}</h3>
                    <div class="cleaner-location">
                        <i class="fas fa-map-marker-alt"></i> ${cleaner.location} • ${cleaner.distance} miles
                    </div>
                    <div class="cleaner-rating">
                        ${generateStars(cleaner.rating)}
                        <span class="rating-text">${cleaner.rating} (${cleaner.reviews} reviews)</span>
                    </div>
                </div>
                <div class="cleaner-price">
                    <div class="price-display">
                        <span class="price-amount">$${Math.round(cleaner.hourlyRate * 1.15)}</span>
                        <span class="price-unit">/hour</span>
                    </div>
                    <span class="price-breakdown">Includes 15% platform fee</span>
                </div>
            </div>
            
            <div class="cleaner-details">
                <div class="detail-item">
                    <i class="fas fa-clock"></i> ${cleaner.experience} years experience
                </div>
                <div class="detail-item">
                    <i class="fas fa-calendar-check"></i> ${cleaner.availability}
                </div>
                <div class="detail-item">
                    <i class="fas fa-shield-alt"></i> ${cleaner.insured ? 'Insured' : 'Not Insured'}
                </div>
            </div>
            
            <div class="cleaner-specialties">
                ${cleaner.specialties.map(spec => `<span class="specialty-tag">${spec}</span>`).join('')}
            </div>
            
            <div class="cleaner-actions">
                <button class="btn btn-outline" onclick="viewCleanerProfile('${cleaner.id}')">
                    <i class="fas fa-user"></i> View Profile
                </button>
                <button class="btn btn-primary" onclick="contactCleaner('${cleaner.id}')">
                    <i class="fas fa-comment"></i> Contact
                </button>
            </div>
        </div>
    `).join('');
}

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    let stars = '';
    
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    if (halfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }
    
    return `<span class="stars">${stars}</span>`;
}

function searchCleaners() {
    showNotification('Searching for cleaners...');
    
    // Simulate search with filters
    setTimeout(() => {
        const allCleaners = getMarketplaceCleaners();
        const ratingFilter = parseFloat(document.getElementById('ratingFilter').value) || 0;
        const experienceFilter = parseInt(document.getElementById('experienceFilter').value) || 0;
        
        const filtered = allCleaners.filter(cleaner => 
            cleaner.rating >= ratingFilter &&
            cleaner.experience >= experienceFilter
        );
        
        displayMarketplaceResults(filtered);
        showNotification(`Found ${filtered.length} cleaners matching your criteria`);
    }, 1000);
}

function sortCleaners(sortBy) {
    const cleaners = getMarketplaceCleaners();
    
    switch(sortBy) {
        case 'rating':
            cleaners.sort((a, b) => b.rating - a.rating);
            break;
        case 'experience':
            cleaners.sort((a, b) => b.experience - a.experience);
            break;
        case 'price':
            cleaners.sort((a, b) => a.hourlyRate - b.hourlyRate);
            break;
        case 'distance':
            cleaners.sort((a, b) => a.distance - b.distance);
            break;
    }
    
    displayMarketplaceResults(cleaners);
}

function viewCleanerProfile(cleanerId) {
    const cleaners = getMarketplaceCleaners();
    const cleaner = cleaners.find(c => c.id === cleanerId);
    
    if (!cleaner) return;
    
    document.getElementById('cleanerProfileName').textContent = cleaner.name;
    
    const content = document.getElementById('cleanerProfileContent');
    content.innerHTML = `
        <div class="profile-layout">
            <div class="profile-sidebar">
                <div class="profile-photo">
                    <i class="fas fa-user-circle"></i>
                </div>
                <div class="profile-badges">
                    ${cleaner.backgroundCheck ? '<div class="badge verified"><i class="fas fa-check-circle"></i> Background Checked</div>' : ''}
                    ${cleaner.insured ? '<div class="badge insured"><i class="fas fa-shield-alt"></i> Insured</div>' : ''}
                </div>
                <div class="profile-stats">
                    <div class="stat">
                        <span class="stat-value">${cleaner.reviews}</span>
                        <span class="stat-label">Reviews</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">${cleaner.experience}</span>
                        <span class="stat-label">Years</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">$${cleaner.hourlyRate}</span>
                        <span class="stat-label">Per Hour</span>
                    </div>
                </div>
            </div>
            
            <div class="profile-main">
                <div class="profile-section">
                    <h3>About</h3>
                    <p>${cleaner.bio}</p>
                </div>
                
                <div class="profile-section">
                    <h3>Details</h3>
                    <div class="detail-grid">
                        <div class="detail">
                            <i class="fas fa-map-marker-alt"></i>
                            <span><strong>Location:</strong> ${cleaner.location}</span>
                        </div>
                        <div class="detail">
                            <i class="fas fa-calendar-check"></i>
                            <span><strong>Availability:</strong> ${cleaner.availability}</span>
                        </div>
                        <div class="detail">
                            <i class="fas fa-language"></i>
                            <span><strong>Languages:</strong> ${cleaner.languages.join(', ')}</span>
                        </div>
                        <div class="detail">
                            <i class="fas fa-star"></i>
                            <span><strong>Rating:</strong> ${cleaner.rating} / 5.0</span>
                        </div>
                    </div>
                </div>
                
                <div class="profile-section">
                    <h3>Specialties</h3>
                    <div class="specialty-list">
                        ${cleaner.specialties.map(spec => `<span class="specialty-tag large">${spec}</span>`).join('')}
                    </div>
                </div>
                
                <div class="profile-section">
                    <h3>Recent Reviews</h3>
                    <div class="reviews-list">
                        <div class="review">
                            <div class="review-header">
                                <strong>John D.</strong>
                                <span class="review-date">2 weeks ago</span>
                            </div>
                            ${generateStars(5)}
                            <p>"Excellent work! Very thorough and professional. My guests always compliment how clean the property is."</p>
                        </div>
                        <div class="review">
                            <div class="review-header">
                                <strong>Sarah M.</strong>
                                <span class="review-date">1 month ago</span>
                            </div>
                            ${generateStars(4.5)}
                            <p>"Great attention to detail. Always on time and communicates well. Highly recommend!"</p>
                        </div>
                    </div>
                </div>
                
                <div class="profile-actions">
                    <button class="btn btn-primary btn-lg" onclick="hireCleaner('${cleaner.id}')">
                        <i class="fas fa-handshake"></i> Hire ${cleaner.name}
                    </button>
                    <button class="btn btn-outline btn-lg" onclick="contactCleaner('${cleaner.id}')">
                        <i class="fas fa-comment"></i> Send Message
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('cleanerProfileModal').style.display = 'flex';
}

function closeCleanerProfile() {
    document.getElementById('cleanerProfileModal').style.display = 'none';
}

function contactCleaner(cleanerId) {
    showNotification('Opening message composer...');
    // In production, would open a messaging interface
}

function hireCleaner(cleanerId) {
    const cleaners = getMarketplaceCleaners();
    const cleaner = cleaners.find(c => c.id === cleanerId);
    
    if (!cleaner) return;
    
    // Add to team
    const newTeamMember = {
        id: generateId(),
        name: cleaner.name,
        email: `${cleaner.name.toLowerCase().replace(' ', '.')}@cleaning.com`,
        phone: '(555) 000-0000',
        role: 'cleaner',
        rating: cleaner.rating,
        completedCleanings: 0,
        marketplace: true,
        hourlyRate: cleaner.hourlyRate
    };
    
    teamMembers.push(newTeamMember);
    saveToLocalStorage('teamMembers', teamMembers);
    
    closeCleanerProfile();
    showNotification(`${cleaner.name} has been added to your team!`);
    
    // Switch to team view
    document.querySelector('[onclick="switchTeamView(\'myteam\')"]').click();
}