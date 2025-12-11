// State Management
let currentUser = null;
let properties = [];
let checklists = [];
let teamMembers = [];
let notifications = [];

// Platform Fee Configuration (Transaction-based like Airbnb)
const FEE_MODELS = {
    standard: {
        percentage: 15, // 15% platform fee for all bookings
        label: 'Standard',
        description: 'Standard platform fee - no monthly subscription needed'
    },
    highVolume: {
        percentage: 10, // 10% for high-volume clients (20+ bookings/month)
        label: 'Volume Discount',
        description: 'Automatic discount for 20+ bookings per month'
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
        feeModel: 'standard', // Transaction-based, no subscription
        totalBookings: 0
    };
    
    localStorage.setItem('authToken', generateId());
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    closeAuthModal();
    showDashboard();
    
    // Show welcome message
    showNotification('Welcome to Host Helper Clean! Start booking cleaners for your properties.');
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
    const navLinks = document.querySelector('.nav-links');
    if (mobileToggle && navLinks) {
        mobileToggle.addEventListener('click', function() {
            navLinks.classList.toggle('mobile-open');
            this.querySelector('i').classList.toggle('fa-bars');
            this.querySelector('i').classList.toggle('fa-times');
        });
        
        // Close menu when clicking on a link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('mobile-open');
                mobileToggle.querySelector('i').classList.add('fa-bars');
                mobileToggle.querySelector('i').classList.remove('fa-times');
            });
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
            case 'reports':
                loadAnalytics();
                break;
            case 'calendar':
                generateCalendarGrid();
                break;
            case 'notifications':
                loadNotificationSettings();
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
    
    // Close modal and show rating request
    document.querySelector('.modal').remove();
    
    // Show rating modal for property owner
    setTimeout(() => {
        showPropertyOwnerRating(checklist);
    }, 1000);
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
                        <i class="fas fa-star"></i> ${member.rating || 'New'}
                        ${member.totalRatings ? ` (${member.totalRatings})` : ''}
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
    // Determine fee model based on user's booking history (monthly)
    if (!user) return 'standard';
    
    // Get this month's completed bookings
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const monthlyBookingCount = checklists.filter(c => 
        c.userId === user.id && 
        c.status === 'completed' &&
        new Date(c.completedAt || c.scheduledDate) >= firstDayOfMonth
    ).length;
    
    // Automatic volume discount at 20+ bookings per month
    if (monthlyBookingCount >= 20) return 'highVolume';
    return 'standard';
}

// Removed pricing type switching - now only transaction-based model

// Rating System Functions
function showPropertyOwnerRating(checklist) {
    const property = properties.find(p => p.id === checklist.propertyId);
    const cleaner = teamMembers.find(m => m.id === checklist.cleanerId);
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Rate Your Cleaning Service</h2>
                <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="rating-container">
                    <p>How was your cleaning service at <strong>${property?.name || 'your property'}</strong>?</p>
                    ${cleaner ? `<p>Cleaned by: <strong>${cleaner.name}</strong></p>` : ''}
                    
                    <div class="rating-section">
                        <h3>Overall Rating</h3>
                        <div class="star-rating" id="overallRating">
                            ${[1,2,3,4,5].map(i => `
                                <i class="far fa-star" data-rating="${i}" onclick="setRating('overall', ${i})"></i>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="rating-categories">
                        <div class="rating-category">
                            <label>Thoroughness</label>
                            <div class="star-rating" id="thoroughnessRating">
                                ${[1,2,3,4,5].map(i => `
                                    <i class="far fa-star" data-rating="${i}" onclick="setRating('thoroughness', ${i})"></i>
                                `).join('')}
                            </div>
                        </div>
                        <div class="rating-category">
                            <label>Attention to Detail</label>
                            <div class="star-rating" id="detailRating">
                                ${[1,2,3,4,5].map(i => `
                                    <i class="far fa-star" data-rating="${i}" onclick="setRating('detail', ${i})"></i>
                                `).join('')}
                            </div>
                        </div>
                        <div class="rating-category">
                            <label>Communication</label>
                            <div class="star-rating" id="communicationRating">
                                ${[1,2,3,4,5].map(i => `
                                    <i class="far fa-star" data-rating="${i}" onclick="setRating('communication', ${i})"></i>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    
                    <div class="quality-checklist">
                        <h3>Quality Inspection</h3>
                        <label class="inspection-item">
                            <input type="checkbox" id="bedsCheck">
                            <span>Beds made properly</span>
                        </label>
                        <label class="inspection-item">
                            <input type="checkbox" id="bathroomsCheck">
                            <span>Bathrooms spotless</span>
                        </label>
                        <label class="inspection-item">
                            <input type="checkbox" id="kitchenCheck">
                            <span>Kitchen thoroughly cleaned</span>
                        </label>
                        <label class="inspection-item">
                            <input type="checkbox" id="floorsCheck">
                            <span>Floors cleaned properly</span>
                        </label>
                        <label class="inspection-item">
                            <input type="checkbox" id="suppliesCheck">
                            <span>Supplies restocked</span>
                        </label>
                    </div>
                    
                    <div class="form-group">
                        <label>Additional Feedback (Optional)</label>
                        <textarea id="ratingFeedback" rows="3" placeholder="Any specific feedback about the cleaning..."></textarea>
                    </div>
                    
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Skip</button>
                        <button class="btn btn-primary" onclick="submitRating('${checklist.id}')">
                            Submit Rating
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function setRating(category, rating) {
    const container = document.getElementById(category + 'Rating');
    container.querySelectorAll('i').forEach((star, index) => {
        if (index < rating) {
            star.className = 'fas fa-star';
            star.style.color = '#f6ad55';
        } else {
            star.className = 'far fa-star';
            star.style.color = '';
        }
    });
    container.dataset.rating = rating;
}

function submitRating(checklistId) {
    const ratings = {
        overall: parseInt(document.getElementById('overallRating').dataset.rating || 0),
        thoroughness: parseInt(document.getElementById('thoroughnessRating').dataset.rating || 0),
        detail: parseInt(document.getElementById('detailRating').dataset.rating || 0),
        communication: parseInt(document.getElementById('communicationRating').dataset.rating || 0)
    };
    
    const inspection = {
        beds: document.getElementById('bedsCheck').checked,
        bathrooms: document.getElementById('bathroomsCheck').checked,
        kitchen: document.getElementById('kitchenCheck').checked,
        floors: document.getElementById('floorsCheck').checked,
        supplies: document.getElementById('suppliesCheck').checked
    };
    
    const feedback = document.getElementById('ratingFeedback').value;
    
    if (ratings.overall === 0) {
        showNotification('Please provide an overall rating', 'error');
        return;
    }
    
    // Save rating
    const checklist = checklists.find(c => c.id === checklistId);
    if (checklist) {
        checklist.rating = {
            ratings: ratings,
            inspection: inspection,
            feedback: feedback,
            ratedAt: new Date().toISOString()
        };
        
        // Update cleaner's average rating
        if (checklist.cleanerId) {
            updateCleanerRating(checklist.cleanerId, ratings.overall);
        }
        
        saveToLocalStorage('checklists', checklists);
    }
    
    document.querySelector('.modal').remove();
    showNotification('Thank you for your feedback!');
    
    // Show completion message
    document.getElementById('cleanerChecklistView').innerHTML = `
        <div class="completion-message">
            <i class="fas fa-check-circle"></i>
            <h2>Cleaning Rated!</h2>
            <p>Your feedback helps us maintain quality standards.</p>
            <div class="rating-summary">
                <p>Overall Rating: ${generateStars(ratings.overall)}</p>
                ${ratings.overall < 4 ? '<p>We\'ll follow up on your feedback to improve our service.</p>' : '<p>We\'re glad you had a great experience!</p>'}
            </div>
        </div>
    `;
}

function updateCleanerRating(cleanerId, newRating) {
    const cleaner = teamMembers.find(m => m.id === cleanerId);
    if (!cleaner) return;
    
    // Calculate new average rating
    const completedCleanings = checklists.filter(c => 
        c.cleanerId === cleanerId && 
        c.status === 'completed' && 
        c.rating
    );
    
    const totalRatings = completedCleanings.reduce((sum, c) => 
        sum + (c.rating.ratings.overall || 0), 0
    ) + newRating;
    
    const averageRating = totalRatings / (completedCleanings.length + 1);
    
    cleaner.rating = Math.round(averageRating * 10) / 10;
    cleaner.totalRatings = completedCleanings.length + 1;
    
    saveToLocalStorage('teamMembers', teamMembers);
}

// Analytics Functions
function loadAnalytics(period = 'month') {
    const days = {
        'week': 7,
        'month': 30,
        'quarter': 90,
        'year': 365
    }[period] || 30;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Get completed checklists in date range
    const analyticsData = checklists.filter(c => {
        const completedDate = new Date(c.completedAt || c.scheduledDate);
        return c.status === 'completed' && completedDate >= startDate;
    });
    
    // Calculate revenue metrics
    let totalRevenue = 0;
    let platformFees = 0;
    let cleanerPayouts = 0;
    let bookingsByType = {
        standard: 0,
        deep: 0,
        quick: 0,
        priority: 0
    };
    let addonRevenue = 0;
    
    analyticsData.forEach(checklist => {
        const property = properties.find(p => p.id === checklist.propertyId);
        if (!property) return;
        
        const propertySize = getPropertySize(property.bedrooms);
        const cleaningType = checklist.template || 'standard';
        const feeModel = checklist.priority === 'high' ? 'premium' : getUserFeeModel(currentUser);
        
        // Calculate pricing
        const pricing = calculatePricing(cleaningType, propertySize, [], feeModel);
        
        totalRevenue += pricing.totalPrice;
        platformFees += pricing.platformFee;
        cleanerPayouts += pricing.cleanerPayout;
        
        // Track by type
        if (checklist.priority === 'high') {
            bookingsByType.priority += pricing.platformFee;
        } else {
            bookingsByType[cleaningType] = (bookingsByType[cleaningType] || 0) + pricing.platformFee;
        }
    });
    
    // Update revenue cards
    document.getElementById('totalRevenue').textContent = `$${totalRevenue.toFixed(2)}`;
    document.getElementById('platformFees').textContent = `$${platformFees.toFixed(2)}`;
    document.getElementById('cleanerPayouts').textContent = `$${cleanerPayouts.toFixed(2)}`;
    document.getElementById('netProfit').textContent = `$${platformFees.toFixed(2)}`;
    
    // Update booking metrics
    const totalBookings = analyticsData.length;
    const completionRate = totalBookings > 0 ? 
        (analyticsData.filter(c => c.status === 'completed').length / totalBookings * 100) : 0;
    const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
    
    document.getElementById('totalBookings').textContent = totalBookings;
    document.getElementById('completionRate').textContent = `${completionRate.toFixed(1)}%`;
    document.getElementById('avgBookingValue').textContent = `$${avgBookingValue.toFixed(2)}`;
    
    // Update revenue breakdown
    updateRevenueBreakdown(bookingsByType, addonRevenue, platformFees);
    
    // Load top properties
    loadTopProperties(analyticsData);
    
    // Load cleaner performance
    loadCleanerPerformance(analyticsData);
    
    // Update customer insights
    updateCustomerInsights(analyticsData);
    
    // Draw booking chart
    drawBookingChart(analyticsData, days);
}

function updateRevenueBreakdown(bookingsByType, addonRevenue, totalFees) {
    const setBar = (id, value, total) => {
        const percentage = total > 0 ? (value / total * 100) : 0;
        document.getElementById(id).style.width = `${percentage}%`;
        document.getElementById(id.replace('Bar', 'Revenue')).textContent = `$${value.toFixed(2)}`;
    };
    
    setBar('standardBar', bookingsByType.standard || 0, totalFees);
    setBar('deepBar', bookingsByType.deep || 0, totalFees);
    setBar('priorityBar', bookingsByType.priority || 0, totalFees);
    setBar('addonBar', addonRevenue, totalFees);
}

function loadTopProperties(analyticsData) {
    const propertyStats = {};
    
    analyticsData.forEach(checklist => {
        const property = properties.find(p => p.id === checklist.propertyId);
        if (!property) return;
        
        if (!propertyStats[property.id]) {
            propertyStats[property.id] = {
                name: property.name,
                bookings: 0,
                revenue: 0,
                rating: 0,
                ratingCount: 0
            };
        }
        
        propertyStats[property.id].bookings++;
        
        const propertySize = getPropertySize(property.bedrooms);
        const pricing = calculatePricing(checklist.template || 'standard', propertySize);
        propertyStats[property.id].revenue += pricing.platformFee;
        
        if (checklist.rating && checklist.rating.ratings.overall) {
            propertyStats[property.id].rating += checklist.rating.ratings.overall;
            propertyStats[property.id].ratingCount++;
        }
    });
    
    // Sort by revenue and take top 5
    const topProperties = Object.values(propertyStats)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
    
    const container = document.getElementById('topProperties');
    container.innerHTML = topProperties.map((prop, index) => `
        <div class="performance-item">
            <span class="rank">${index + 1}</span>
            <div class="property-info">
                <h4>${prop.name}</h4>
                <p>${prop.bookings} bookings • $${prop.revenue.toFixed(2)} fees</p>
            </div>
            ${prop.ratingCount > 0 ? `
                <div class="property-rating">
                    ${generateStars(prop.rating / prop.ratingCount)}
                </div>
            ` : ''}
        </div>
    `).join('');
}

function loadCleanerPerformance(analyticsData) {
    const cleanerStats = {};
    
    analyticsData.forEach(checklist => {
        if (!checklist.cleanerId) return;
        
        const cleaner = teamMembers.find(m => m.id === checklist.cleanerId);
        if (!cleaner) return;
        
        if (!cleanerStats[cleaner.id]) {
            cleanerStats[cleaner.id] = {
                name: cleaner.name,
                completions: 0,
                earnings: 0,
                rating: cleaner.rating || 0,
                onTime: 0
            };
        }
        
        cleanerStats[cleaner.id].completions++;
        
        const property = properties.find(p => p.id === checklist.propertyId);
        const propertySize = getPropertySize(property?.bedrooms || 1);
        const pricing = calculatePricing(checklist.template || 'standard', propertySize);
        cleanerStats[cleaner.id].earnings += pricing.cleanerPayout;
    });
    
    const container = document.getElementById('cleanerPerformance');
    const topCleaners = Object.values(cleanerStats).sort((a, b) => b.completions - a.completions);
    
    container.innerHTML = topCleaners.map(cleaner => `
        <div class="cleaner-metric-item">
            <div class="cleaner-info">
                <h4>${cleaner.name}</h4>
                <p>${cleaner.completions} cleanings • $${cleaner.earnings.toFixed(2)} earned</p>
            </div>
            <div class="cleaner-rating">
                ${cleaner.rating > 0 ? generateStars(cleaner.rating) : 'New'}
            </div>
        </div>
    `).join('');
}

function updateCustomerInsights(analyticsData) {
    // Average rating
    const ratings = analyticsData
        .filter(c => c.rating && c.rating.ratings.overall)
        .map(c => c.rating.ratings.overall);
    
    const avgRating = ratings.length > 0 ? 
        (ratings.reduce((a, b) => a + b, 0) / ratings.length) : 0;
    
    document.getElementById('avgRating').textContent = avgRating.toFixed(1);
    document.querySelector('#avgRating + .insight-detail').textContent = `from ${ratings.length} reviews`;
    
    // Repeat rate
    const customerBookings = {};
    analyticsData.forEach(c => {
        const key = c.userId || c.propertyId;
        customerBookings[key] = (customerBookings[key] || 0) + 1;
    });
    
    const repeatCustomers = Object.values(customerBookings).filter(count => count > 1).length;
    const totalCustomers = Object.keys(customerBookings).length;
    const repeatRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers * 100) : 0;
    
    document.getElementById('repeatRate').textContent = `${repeatRate.toFixed(0)}%`;
}

function drawBookingChart(data, days) {
    // Simple text-based chart for now
    const canvas = document.getElementById('bookingChart');
    if (!canvas) return;
    
    // In production, use Chart.js or similar
    canvas.style.height = '200px';
    canvas.style.display = 'flex';
    canvas.style.alignItems = 'center';
    canvas.style.justifyContent = 'center';
    canvas.innerHTML = `<p style="color: #718096;">Chart visualization would display ${data.length} bookings over ${days} days</p>`;
}

function updateAnalytics(period) {
    loadAnalytics(period);
}

function exportAnalytics() {
    showNotification('Generating analytics report...');
    
    // In production, generate CSV or PDF
    setTimeout(() => {
        showNotification('Analytics report downloaded!', 'success');
    }, 1500);
}

// Payout System Functions
function showBillingSection(section) {
    // Update active tab
    document.querySelectorAll('.billing-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Show/hide sections
    document.querySelectorAll('.billing-section').forEach(sec => {
        sec.classList.remove('active');
    });
    
    document.getElementById(section + 'Section').classList.add('active');
    
    if (section === 'payouts') {
        loadPendingPayouts();
        loadPayoutHistory();
    }
}

function loadPendingPayouts() {
    const pendingPayouts = calculatePendingPayouts();
    const container = document.getElementById('pendingPayoutsList');
    
    if (pendingPayouts.length === 0) {
        container.innerHTML = '<p class="empty-state">No pending payouts</p>';
        return;
    }
    
    const totalPending = pendingPayouts.reduce((sum, p) => sum + p.amount, 0);
    
    container.innerHTML = `
        <div class="payout-summary">
            <div class="summary-stat">
                <span class="stat-label">Total Pending</span>
                <span class="stat-value">$${totalPending.toFixed(2)}</span>
            </div>
            <div class="summary-stat">
                <span class="stat-label">Cleaners</span>
                <span class="stat-value">${pendingPayouts.length}</span>
            </div>
            <div class="summary-stat">
                <span class="stat-label">Next Payout</span>
                <span class="stat-value">${getNextPayoutDate()}</span>
            </div>
        </div>
        <div class="payout-items">
            ${pendingPayouts.map(payout => `
                <div class="payout-item">
                    <div class="payout-cleaner">
                        <i class="fas fa-user-circle"></i>
                        <div>
                            <h4>${payout.cleanerName}</h4>
                            <p>${payout.cleaningCount} cleanings • ${payout.periodLabel}</p>
                        </div>
                    </div>
                    <div class="payout-amount">
                        <span class="amount">$${payout.amount.toFixed(2)}</span>
                        <button class="btn btn-sm btn-outline" onclick="viewPayoutDetails('${payout.cleanerId}')">
                            <i class="fas fa-list"></i> Details
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function calculatePendingPayouts() {
    const payouts = [];
    const frequency = document.getElementById('payoutFrequency')?.value || 'weekly';
    
    // Get unpaid completed cleanings grouped by cleaner
    const unpaidByCleanercleanings = {};
    
    checklists.filter(c => 
        c.status === 'completed' && 
        !c.paidToCleaner &&
        c.cleanerId
    ).forEach(checklist => {
        if (!unpaidByCleanercleanings[checklist.cleanerId]) {
            unpaidByCleanercleanings[checklist.cleanerId] = [];
        }
        unpaidByCleanercleanings[checklist.cleanerId].push(checklist);
    });
    
    // Calculate payouts for each cleaner
    Object.keys(unpaidByCleanercleanings).forEach(cleanerId => {
        const cleaner = teamMembers.find(m => m.id === cleanerId);
        if (!cleaner) return;
        
        const cleanings = unpaidByCleanercleanings[cleanerId];
        let totalAmount = 0;
        
        cleanings.forEach(checklist => {
            const property = properties.find(p => p.id === checklist.propertyId);
            if (property) {
                const propertySize = getPropertySize(property.bedrooms);
                const pricing = calculatePricing(checklist.template || 'standard', propertySize);
                totalAmount += pricing.cleanerPayout;
            }
        });
        
        if (totalAmount > 0) {
            payouts.push({
                cleanerId: cleanerId,
                cleanerName: cleaner.name,
                cleaningCount: cleanings.length,
                amount: totalAmount,
                periodLabel: getPeriodLabel(cleanings),
                cleanings: cleanings
            });
        }
    });
    
    return payouts;
}

function getPeriodLabel(cleanings) {
    const dates = cleanings.map(c => new Date(c.completedAt || c.scheduledDate));
    const earliest = new Date(Math.min(...dates));
    const latest = new Date(Math.max(...dates));
    
    if (earliest.toDateString() === latest.toDateString()) {
        return earliest.toLocaleDateString();
    }
    
    return `${earliest.toLocaleDateString()} - ${latest.toLocaleDateString()}`;
}

function getNextPayoutDate() {
    const frequency = document.getElementById('payoutFrequency')?.value || 'weekly';
    const today = new Date();
    
    switch(frequency) {
        case 'instant':
            return 'Immediate';
        case 'daily':
            return 'Tonight';
        case 'weekly':
            const friday = new Date();
            friday.setDate(today.getDate() + (5 - today.getDay() + 7) % 7);
            return friday.toLocaleDateString();
        case 'biweekly':
            return 'In ' + (14 - today.getDate() % 14) + ' days';
        case 'monthly':
            const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
            return nextMonth.toLocaleDateString();
        default:
            return 'Friday';
    }
}

function processPayouts() {
    const pendingPayouts = calculatePendingPayouts();
    
    if (pendingPayouts.length === 0) {
        showNotification('No pending payouts to process', 'error');
        return;
    }
    
    const totalAmount = pendingPayouts.reduce((sum, p) => sum + p.amount, 0);
    
    if (confirm(`Process ${pendingPayouts.length} payouts totaling $${totalAmount.toFixed(2)}?`)) {
        showNotification('Processing payouts...');
        
        // Simulate processing
        setTimeout(() => {
            // Mark cleanings as paid
            pendingPayouts.forEach(payout => {
                payout.cleanings.forEach(checklist => {
                    checklist.paidToCleaner = true;
                    checklist.payoutDate = new Date().toISOString();
                    checklist.payoutAmount = payout.amount / payout.cleanings.length;
                });
            });
            
            // Save payout record
            const payoutRecord = {
                id: generateId(),
                date: new Date().toISOString(),
                payouts: pendingPayouts.map(p => ({
                    cleanerId: p.cleanerId,
                    cleanerName: p.cleanerName,
                    amount: p.amount,
                    cleaningCount: p.cleaningCount
                })),
                totalAmount: totalAmount,
                status: 'completed'
            };
            
            const payoutHistory = loadFromLocalStorage('payoutHistory') || [];
            payoutHistory.unshift(payoutRecord);
            saveToLocalStorage('payoutHistory', payoutHistory);
            
            saveToLocalStorage('checklists', checklists);
            
            showNotification(`Successfully processed ${pendingPayouts.length} payouts!`, 'success');
            loadPendingPayouts();
            loadPayoutHistory();
        }, 2000);
    }
}

function loadPayoutHistory() {
    const history = loadFromLocalStorage('payoutHistory') || [];
    const container = document.getElementById('payoutHistoryList');
    
    if (history.length === 0) {
        container.innerHTML = '<p class="empty-state">No payout history yet</p>';
        return;
    }
    
    container.innerHTML = history.slice(0, 10).map(record => `
        <div class="history-item">
            <div class="history-info">
                <h4>${new Date(record.date).toLocaleDateString()}</h4>
                <p>${record.payouts.length} cleaners • $${record.totalAmount.toFixed(2)} total</p>
            </div>
            <div class="history-status">
                <span class="status-badge completed">Completed</span>
                <button class="btn btn-sm btn-outline" onclick="viewPayoutRecord('${record.id}')">
                    <i class="fas fa-receipt"></i> View
                </button>
            </div>
        </div>
    `).join('');
}

function viewPayoutDetails(cleanerId) {
    const cleaner = teamMembers.find(m => m.id === cleanerId);
    const cleanings = checklists.filter(c => 
        c.cleanerId === cleanerId && 
        c.status === 'completed' && 
        !c.paidToCleaner
    );
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Payout Details - ${cleaner.name}</h2>
                <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="payout-details">
                    <h3>Cleanings (${cleanings.length})</h3>
                    ${cleanings.map(checklist => {
                        const property = properties.find(p => p.id === checklist.propertyId);
                        const propertySize = getPropertySize(property?.bedrooms || 1);
                        const pricing = calculatePricing(checklist.template || 'standard', propertySize);
                        
                        return `
                            <div class="detail-item">
                                <div>
                                    <strong>${property?.name || 'Unknown'}</strong><br>
                                    <small>${new Date(checklist.completedAt || checklist.scheduledDate).toLocaleDateString()}</small>
                                </div>
                                <span>$${pricing.cleanerPayout.toFixed(2)}</span>
                            </div>
                        `;
                    }).join('')}
                    <div class="detail-total">
                        <strong>Total Payout</strong>
                        <strong>$${cleanings.reduce((sum, c) => {
                            const property = properties.find(p => p.id === c.propertyId);
                            const propertySize = getPropertySize(property?.bedrooms || 1);
                            const pricing = calculatePricing(c.template || 'standard', propertySize);
                            return sum + pricing.cleanerPayout;
                        }, 0).toFixed(2)}</strong>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function connectStripe() {
    showNotification('Opening Stripe Connect...');
    
    // In production, would redirect to Stripe OAuth
    setTimeout(() => {
        document.getElementById('stripeStatus').innerHTML = `
            <span class="status-indicator connected">Connected</span>
            <p class="status-detail">Account: acct_1234...ABCD</p>
        `;
        showNotification('Stripe account connected successfully!', 'success');
    }, 2000);
}

function updatePayoutSettings() {
    const settings = {
        autoPayouts: document.getElementById('autoPayouts').checked,
        frequency: document.getElementById('payoutFrequency').value,
        day: document.getElementById('payoutDay').value
    };
    
    saveToLocalStorage('payoutSettings', settings);
    showNotification('Payout settings updated');
}

// Notification System
function initializeNotifications() {
    // Load saved notifications
    notifications = loadFromLocalStorage('notifications') || [];
    
    // Check for new events periodically
    setInterval(checkForNotifications, 30000); // Every 30 seconds
    
    // Update notification count
    updateNotificationBadge();
    
    // Load notifications in center
    loadNotifications();
}

function createNotification(type, title, message, data = {}) {
    const notification = {
        id: generateId(),
        type: type, // 'booking', 'cleaning', 'payment', 'urgent', 'system'
        title: title,
        message: message,
        data: data,
        read: false,
        createdAt: new Date().toISOString(),
        priority: data.priority || 'normal'
    };
    
    notifications.unshift(notification);
    saveToLocalStorage('notifications', notifications);
    
    // Update UI
    updateNotificationBadge();
    loadNotifications();
    
    // Show toast notification
    showToastNotification(notification);
    
    // Play notification sound if enabled
    playNotificationSound();
    
    return notification;
}

function showToastNotification(notification) {
    const toast = document.createElement('div');
    toast.className = `toast-notification ${notification.type}`;
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas fa-${getNotificationIcon(notification.type)}"></i>
        </div>
        <div class="toast-content">
            <h4>${notification.title}</h4>
            <p>${notification.message}</p>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

function getNotificationIcon(type) {
    const icons = {
        'booking': 'calendar-check',
        'cleaning': 'broom',
        'payment': 'dollar-sign',
        'urgent': 'exclamation-triangle',
        'system': 'info-circle',
        'rating': 'star',
        'supplies': 'box'
    };
    return icons[type] || 'bell';
}

function toggleNotificationCenter() {
    const center = document.getElementById('notificationCenter');
    center.classList.toggle('show');
    
    // Close when clicking outside
    if (center.classList.contains('show')) {
        setTimeout(() => {
            document.addEventListener('click', closeNotificationCenter);
        }, 100);
    }
}

function closeNotificationCenter(e) {
    if (!e.target.closest('.notification-center') && !e.target.closest('.notification-btn')) {
        document.getElementById('notificationCenter').classList.remove('show');
        document.removeEventListener('click', closeNotificationCenter);
    }
}

function updateNotificationBadge() {
    const unreadCount = notifications.filter(n => !n.read).length;
    const badge = document.getElementById('notificationCount');
    
    if (badge) {
        badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        badge.style.display = unreadCount > 0 ? 'block' : 'none';
    }
}

function loadNotifications(filter = 'all') {
    const container = document.getElementById('notificationList');
    if (!container) return;
    
    let filtered = notifications;
    
    if (filter === 'unread') {
        filtered = notifications.filter(n => !n.read);
    } else if (filter === 'urgent') {
        filtered = notifications.filter(n => n.priority === 'high' || n.type === 'urgent');
    }
    
    if (filtered.length === 0) {
        container.innerHTML = `<p class="empty-notifications">No ${filter === 'all' ? '' : filter} notifications</p>`;
        return;
    }
    
    container.innerHTML = filtered.slice(0, 20).map(notification => `
        <div class="notification-item ${notification.read ? 'read' : 'unread'}" onclick="handleNotificationClick('${notification.id}')">
            <div class="notification-icon ${notification.type}">
                <i class="fas fa-${getNotificationIcon(notification.type)}"></i>
            </div>
            <div class="notification-content">
                <h4>${notification.title}</h4>
                <p>${notification.message}</p>
                <span class="notification-time">${getTimeAgo(notification.createdAt)}</span>
            </div>
            ${!notification.read ? '<span class="unread-indicator"></span>' : ''}
        </div>
    `).join('');
}

function filterNotifications(filter) {
    // Update active tab
    document.querySelectorAll('.notif-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    loadNotifications(filter);
}

function handleNotificationClick(notificationId) {
    const notification = notifications.find(n => n.id === notificationId);
    if (!notification) return;
    
    // Mark as read
    notification.read = true;
    saveToLocalStorage('notifications', notifications);
    updateNotificationBadge();
    
    // Handle action based on type
    switch(notification.type) {
        case 'booking':
            showDashboardPage('integrations');
            break;
        case 'cleaning':
            showDashboardPage('checklists');
            break;
        case 'payment':
            showDashboardPage('billing');
            break;
        case 'rating':
            if (notification.data.checklistId) {
                viewChecklist(notification.data.checklistId);
            }
            break;
    }
    
    // Close notification center
    document.getElementById('notificationCenter').classList.remove('show');
}

function markAllAsRead() {
    notifications.forEach(n => n.read = true);
    saveToLocalStorage('notifications', notifications);
    updateNotificationBadge();
    loadNotifications();
}

function checkForNotifications() {
    // Check for new bookings
    const recentBookings = loadFromLocalStorage('bookings') || [];
    const lastCheck = loadFromLocalStorage('lastNotificationCheck') || new Date(0).toISOString();
    
    recentBookings.forEach(booking => {
        if (new Date(booking.createdAt || booking.checkIn) > new Date(lastCheck)) {
            createNotification(
                'booking',
                'New Booking',
                `New booking for ${booking.propertyName} on ${new Date(booking.checkIn).toLocaleDateString()}`,
                { bookingId: booking.id, priority: 'normal' }
            );
        }
    });
    
    // Check for completed cleanings needing rating
    checklists.forEach(checklist => {
        if (checklist.status === 'completed' && 
            !checklist.rating && 
            new Date(checklist.completedAt) > new Date(lastCheck)) {
            createNotification(
                'rating',
                'Rate Your Cleaning',
                `Please rate the cleaning service for your property`,
                { checklistId: checklist.id, priority: 'normal' }
            );
        }
    });
    
    // Check for low supplies
    const suppliesReported = checklists.filter(c => 
        c.suppliesNeeded && 
        new Date(c.completedAt || c.scheduledDate) > new Date(lastCheck)
    );
    
    suppliesReported.forEach(checklist => {
        const property = properties.find(p => p.id === checklist.propertyId);
        createNotification(
            'supplies',
            'Supplies Needed',
            `${property?.name || 'Property'} needs supply restocking`,
            { propertyId: checklist.propertyId, priority: 'high' }
        );
    });
    
    saveToLocalStorage('lastNotificationCheck', new Date().toISOString());
}

function playNotificationSound() {
    // In production, play a notification sound
    if (loadFromLocalStorage('notificationSound') !== false) {
        // new Audio('/sounds/notification.mp3').play();
    }
}

// Email/SMS Templates
function getEmailTemplates() {
    return {
        bookingConfirmation: {
            subject: 'Cleaning Scheduled - {propertyName}',
            body: `
                <h2>Cleaning Confirmed</h2>
                <p>Your cleaning has been scheduled for {propertyName}.</p>
                <p><strong>Date:</strong> {date}</p>
                <p><strong>Time:</strong> {time}</p>
                <p><strong>Cleaner:</strong> {cleanerName}</p>
                <p><strong>Total Cost:</strong> ${'{totalCost}'}</p>
                <p>You can track the cleaning progress using this link: {trackingLink}</p>
            `
        },
        cleaningReminder: {
            subject: 'Cleaning Tomorrow - {propertyName}',
            body: `
                <h2>Cleaning Reminder</h2>
                <p>This is a reminder that your property {propertyName} is scheduled for cleaning tomorrow.</p>
                <p><strong>Date:</strong> {date}</p>
                <p><strong>Time:</strong> {time}</p>
                <p>Please ensure the property is accessible for our cleaning team.</p>
            `
        },
        cleaningComplete: {
            subject: 'Cleaning Completed - {propertyName}',
            body: `
                <h2>Cleaning Completed</h2>
                <p>The cleaning for {propertyName} has been completed.</p>
                <p><strong>Completed at:</strong> {completedTime}</p>
                <p><strong>Photos:</strong> {photoCount} verification photos uploaded</p>
                <p>Please take a moment to rate your cleaning service: {ratingLink}</p>
            `
        },
        payoutProcessed: {
            subject: 'Payment Processed - ${'{amount}'}',
            body: `
                <h2>Payment Sent</h2>
                <p>Your payment has been processed.</p>
                <p><strong>Amount:</strong> ${'{amount}'}</p>
                <p><strong>Cleanings:</strong> {cleaningCount}</p>
                <p><strong>Period:</strong> {period}</p>
                <p>The funds will be available in your account within 1-3 business days.</p>
            `
        }
    };
}

// Initialize notifications when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    if (currentUser) {
        initializeNotifications();
    }
});

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

// Calendar Functionality
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let calendarView = 'month'; // 'month' or 'week'
let selectedBookingId = null;

function generateCalendarGrid() {
    const calendarGrid = document.getElementById('calendarGrid');
    if (!calendarGrid) return;
    
    calendarGrid.innerHTML = '';
    
    if (calendarView === 'month') {
        generateMonthView();
    } else {
        generateWeekView();
    }
}

function generateMonthView() {
    const calendarGrid = document.getElementById('calendarGrid');
    calendarGrid.classList.remove('week-view');
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const prevLastDay = new Date(currentYear, currentMonth, 0);
    const firstDayIndex = firstDay.getDay();
    const lastDayIndex = lastDay.getDay();
    const nextDays = 7 - lastDayIndex - 1;
    
    // Update month display
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    document.getElementById('currentMonth').textContent = `${monthNames[currentMonth]} ${currentYear}`;
    
    // Add day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-header';
        header.textContent = day;
        calendarGrid.appendChild(header);
    });
    
    // Add previous month days
    for (let x = firstDayIndex; x > 0; x--) {
        const dayDiv = createDayElement(prevLastDay.getDate() - x + 1, 'other-month', 
            currentMonth - 1 < 0 ? currentYear - 1 : currentYear,
            currentMonth - 1 < 0 ? 11 : currentMonth - 1);
        calendarGrid.appendChild(dayDiv);
    }
    
    // Add current month days
    const today = new Date();
    for (let i = 1; i <= lastDay.getDate(); i++) {
        const isToday = today.getDate() === i && today.getMonth() === currentMonth && 
                       today.getFullYear() === currentYear;
        const dayDiv = createDayElement(i, isToday ? 'today' : '', currentYear, currentMonth);
        calendarGrid.appendChild(dayDiv);
    }
    
    // Add next month days
    for (let j = 1; j <= nextDays; j++) {
        const dayDiv = createDayElement(j, 'other-month',
            currentMonth + 1 > 11 ? currentYear + 1 : currentYear,
            currentMonth + 1 > 11 ? 0 : currentMonth + 1);
        calendarGrid.appendChild(dayDiv);
    }
}

function generateWeekView() {
    const calendarGrid = document.getElementById('calendarGrid');
    calendarGrid.classList.add('week-view');
    
    // Get current week
    const today = new Date();
    const currentDay = today.getDay();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - currentDay);
    
    // Update month display to show week range
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    document.getElementById('currentMonth').textContent = 
        `${monthNames[weekStart.getMonth()]} ${weekStart.getDate()} - ${monthNames[weekEnd.getMonth()]} ${weekEnd.getDate()}, ${weekEnd.getFullYear()}`;
    
    // Add time column header
    const timeHeader = document.createElement('div');
    timeHeader.className = 'calendar-header';
    timeHeader.textContent = 'Time';
    calendarGrid.appendChild(timeHeader);
    
    // Add day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 0; i < 7; i++) {
        const header = document.createElement('div');
        header.className = 'calendar-header';
        const headerDate = new Date(weekStart);
        headerDate.setDate(weekStart.getDate() + i);
        header.innerHTML = `${dayHeaders[i]}<br>${headerDate.getDate()}`;
        calendarGrid.appendChild(header);
    }
    
    // Add time slots (8 AM to 8 PM)
    for (let hour = 8; hour <= 20; hour++) {
        // Add time label
        const timeSlot = document.createElement('div');
        timeSlot.className = 'time-slot';
        timeSlot.textContent = `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`;
        calendarGrid.appendChild(timeSlot);
        
        // Add day slots
        for (let day = 0; day < 7; day++) {
            const daySlot = document.createElement('div');
            daySlot.className = 'week-day';
            const slotDate = new Date(weekStart);
            slotDate.setDate(weekStart.getDate() + day);
            daySlot.dataset.date = formatDateForData(slotDate);
            daySlot.dataset.hour = hour;
            
            // Add bookings for this time slot
            const dayBookings = getBookingsForTimeSlot(slotDate, hour);
            dayBookings.forEach(booking => {
                const bookingEl = createBookingElement(booking);
                daySlot.appendChild(bookingEl);
            });
            
            // Make slot droppable
            daySlot.addEventListener('dragover', handleDragOver);
            daySlot.addEventListener('drop', handleDrop);
            daySlot.addEventListener('dragleave', handleDragLeave);
            
            calendarGrid.appendChild(daySlot);
        }
    }
}

function getBookingsForTimeSlot(date, hour) {
    const dateStr = formatDateForData(date);
    let bookings = getFromLocalStorage('bookings') || [];
    
    return bookings.filter(booking => {
        const bookingDate = booking.date || booking.scheduledDate;
        if (!bookingDate || !bookingDate.startsWith(dateStr)) return false;
        
        const bookingTime = booking.time || '10:00';
        const bookingHour = parseInt(bookingTime.split(':')[0]);
        return bookingHour === hour;
    });
}

function formatDateForData(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDate(dateString) {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

function calculateTotalPrice(booking) {
    // Base prices
    let basePrice = 80; // Standard cleaning
    if (booking.type === 'deep') basePrice = 150;
    if (booking.type === 'priority') basePrice = 100;
    
    // Add platform fee (15% standard)
    const platformFee = basePrice * 0.15;
    return (basePrice + platformFee).toFixed(2);
}

function createDayElement(day, className, year, month) {
    const dayDiv = document.createElement('div');
    dayDiv.className = `calendar-day ${className}`;
    dayDiv.dataset.date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = day;
    dayDiv.appendChild(dayNumber);
    
    const bookingsContainer = document.createElement('div');
    bookingsContainer.className = 'day-bookings';
    dayDiv.appendChild(bookingsContainer);
    
    // Add bookings for this day
    const dayBookings = getBookingsForDay(year, month, day);
    dayBookings.forEach(booking => {
        const bookingEl = createBookingElement(booking);
        bookingsContainer.appendChild(bookingEl);
    });
    
    // Make day droppable
    dayDiv.addEventListener('dragover', handleDragOver);
    dayDiv.addEventListener('drop', handleDrop);
    dayDiv.addEventListener('dragleave', handleDragLeave);
    
    // Click to add new booking
    dayDiv.addEventListener('click', function(e) {
        if (!e.target.classList.contains('booking-item')) {
            showAddBookingModal(this.dataset.date);
        }
    });
    
    return dayDiv;
}

function createBookingElement(booking) {
    const bookingEl = document.createElement('div');
    bookingEl.className = `booking-item ${booking.type || 'standard'}`;
    bookingEl.textContent = `${booking.time || '10:00'} - ${booking.property || booking.propertyName}`;
    bookingEl.dataset.bookingId = booking.id;
    bookingEl.draggable = true;
    
    // Add drag events
    bookingEl.addEventListener('dragstart', handleDragStart);
    bookingEl.addEventListener('dragend', handleDragEnd);
    
    // Click to view details
    bookingEl.addEventListener('click', function(e) {
        e.stopPropagation();
        showBookingDetails(booking.id);
    });
    
    return bookingEl;
}

function getBookingsForDay(year, month, day) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    let bookings = getFromLocalStorage('bookings') || [];
    
    return bookings.filter(booking => {
        const bookingDate = booking.date || booking.scheduledDate;
        return bookingDate && bookingDate.startsWith(dateStr);
    });
}

// Navigation functions
function previousMonth() {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    generateCalendarGrid();
}

function nextMonth() {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    generateCalendarGrid();
}

function toggleCalendarView() {
    const viewToggleText = document.getElementById('viewToggleText');
    if (calendarView === 'month') {
        calendarView = 'week';
        viewToggleText.textContent = 'Month View';
    } else {
        calendarView = 'month';
        viewToggleText.textContent = 'Week View';
    }
    generateCalendarGrid();
}

// Drag and Drop handlers
let draggedBooking = null;

function handleDragStart(e) {
    draggedBooking = e.target;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.innerHTML);
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.classList.add('drag-over');
    return false;
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    const dropTarget = e.currentTarget;
    dropTarget.classList.remove('drag-over');
    
    if (draggedBooking && dropTarget.classList.contains('calendar-day')) {
        const bookingId = draggedBooking.dataset.bookingId;
        const newDate = dropTarget.dataset.date;
        
        // Update booking date
        updateBookingDate(bookingId, newDate);
        
        // Regenerate calendar
        generateCalendarGrid();
        showNotification('Booking rescheduled successfully!');
    }
    
    return false;
}

function updateBookingDate(bookingId, newDate) {
    let bookings = getFromLocalStorage('bookings') || [];
    const booking = bookings.find(b => b.id === bookingId);
    
    if (booking) {
        booking.date = newDate + 'T' + (booking.time || '10:00');
        booking.scheduledDate = booking.date;
        saveToLocalStorage('bookings', bookings);
    }
}

// Booking details sidebar
function showBookingDetails(bookingId) {
    const bookings = getFromLocalStorage('bookings') || [];
    const booking = bookings.find(b => b.id === bookingId);
    
    if (!booking) return;
    
    const sidebarContent = document.getElementById('sidebarContent');
    sidebarContent.innerHTML = `
        <div class="booking-detail-item">
            <h4>Property</h4>
            <p>${booking.property || booking.propertyName}</p>
        </div>
        <div class="booking-detail-item">
            <h4>Date & Time</h4>
            <p>${formatDate(booking.date || booking.scheduledDate)}</p>
            <p>${booking.time || '10:00 AM'}</p>
        </div>
        <div class="booking-detail-item">
            <h4>Cleaning Type</h4>
            <p>${booking.type === 'deep' ? 'Deep Cleaning' : booking.type === 'priority' ? 'Priority/Rush' : 'Standard Cleaning'}</p>
        </div>
        <div class="booking-detail-item">
            <h4>Assigned Cleaner</h4>
            <p>${booking.cleanerName || 'Not assigned'}</p>
        </div>
        <div class="booking-detail-item">
            <h4>Status</h4>
            <p>${booking.status || 'Scheduled'}</p>
        </div>
        <div class="booking-detail-item">
            <h4>Total Price</h4>
            <p>$${booking.totalPrice || calculateTotalPrice(booking)}</p>
        </div>
        
        <div class="booking-actions">
            <button class="btn btn-primary" onclick="editBooking('${bookingId}')">
                <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn btn-danger" onclick="cancelBooking('${bookingId}')">
                <i class="fas fa-times"></i> Cancel
            </button>
        </div>
    `;
    
    document.getElementById('bookingDetailsSidebar').classList.add('active');
    selectedBookingId = bookingId;
}

function closeSidebar() {
    document.getElementById('bookingDetailsSidebar').classList.remove('active');
    selectedBookingId = null;
}

function editBooking(bookingId) {
    // Would open edit modal
    showNotification('Edit functionality coming soon!');
}

function cancelBooking(bookingId) {
    if (confirm('Are you sure you want to cancel this booking?')) {
        let bookings = getFromLocalStorage('bookings') || [];
        bookings = bookings.filter(b => b.id !== bookingId);
        saveToLocalStorage('bookings', bookings);
        
        closeSidebar();
        generateCalendarGrid();
        showNotification('Booking cancelled successfully!');
    }
}

// Show add booking modal with pre-selected date
function showAddBookingModal(date = null) {
    // Use existing modal or create new one
    const modal = document.getElementById('bookingModal');
    if (modal) {
        // Pre-fill date if provided
        if (date) {
            const dateInput = document.getElementById('bookingDate');
            if (dateInput) {
                dateInput.value = date;
            }
        }
        modal.style.display = 'flex';
    } else {
        // For now, show notification that booking can be added from bookings page
        showNotification('Please use the Bookings page to add new bookings');
    }
}

// Initialize calendar when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Existing initialization code...
    
    // Add calendar initialization
    if (document.getElementById('calendarGrid')) {
        generateCalendarGrid();
    }
});

// Notification System Functions
const notificationTemplates = {
    booking_confirmation: {
        subject: "Cleaning Confirmed for {{property_name}} on {{date}}",
        body: `Hi {{recipient_name}},

Your cleaning has been confirmed for {{property_name}}.

Details:
- Date: {{date}}
- Time: {{time}}
- Cleaner: {{cleaner_name}}
- Type: {{cleaning_type}}
- Total Cost: {{total_cost}}

You can track your cleaning status in real-time through your dashboard.

Best regards,
Host Helper Clean Team`
    },
    reminder_24h: {
        subject: "Reminder: Cleaning Tomorrow at {{property_name}}",
        body: `Hi {{recipient_name}},

This is a friendly reminder that your cleaning is scheduled for tomorrow.

Property: {{property_name}}
Date: {{date}}
Time: {{time}}
Cleaner: {{cleaner_name}}

If you need to reschedule, please do so at least 4 hours before the scheduled time.

Best regards,
Host Helper Clean Team`
    },
    cleaning_started: {
        subject: "Cleaning Started at {{property_name}}",
        body: `Hi {{recipient_name}},

Your cleaner has arrived and started the cleaning at {{property_name}}.

Started at: {{start_time}}
Cleaner: {{cleaner_name}}

You'll receive another notification with photos once the cleaning is complete.

Best regards,
Host Helper Clean Team`
    },
    cleaning_completed: {
        subject: "Cleaning Complete at {{property_name}}",
        body: `Hi {{recipient_name}},

Great news! The cleaning at {{property_name}} has been completed.

Completed at: {{end_time}}
Duration: {{duration}}
Cleaner: {{cleaner_name}}

Photos of the completed cleaning are attached to this email. You can also view them in your dashboard.

Please take a moment to rate this cleaning to help us maintain quality standards.

Best regards,
Host Helper Clean Team`
    },
    payment_receipt: {
        subject: "Payment Receipt - {{property_name}} Cleaning",
        body: `Hi {{recipient_name}},

Thank you for your payment. Here's your receipt:

Invoice #: {{invoice_number}}
Property: {{property_name}}
Date: {{date}}
Amount Paid: {{total_cost}}

Breakdown:
- Cleaning Service: {{cleaning_cost}}
- Platform Fee ({{fee_percentage}}%): {{platform_fee}}

Total: {{total_cost}}

A PDF receipt is attached for your records.

Best regards,
Host Helper Clean Team`
    },
    weekly_summary: {
        subject: "Your Weekly Host Helper Clean Summary",
        body: `Hi {{recipient_name}},

Here's your weekly summary for {{week_range}}:

Total Cleanings: {{total_cleanings}}
Properties Cleaned: {{properties_cleaned}}
Total Revenue: {{total_revenue}}
Average Rating: {{average_rating}}

Top Performing Properties:
{{top_properties_list}}

Upcoming Cleanings:
{{upcoming_cleanings_list}}

View detailed analytics in your dashboard.

Best regards,
Host Helper Clean Team`
    }
};

function loadNotificationSettings() {
    // Load saved settings
    const savedSettings = getFromLocalStorage('notificationSettings') || {};
    
    // Apply saved settings to form
    if (savedSettings.email) {
        document.getElementById('fromEmail').value = savedSettings.email.fromEmail || '';
        document.getElementById('replyEmail').value = savedSettings.email.replyEmail || '';
        document.getElementById('emailProvider').value = savedSettings.email.provider || 'sendgrid';
        document.getElementById('emailApiKey').value = savedSettings.email.apiKey || '';
    }
    
    if (savedSettings.sms) {
        document.getElementById('fromPhone').value = savedSettings.sms.fromPhone || '';
        document.getElementById('smsProvider').value = savedSettings.sms.provider || 'twilio';
        document.getElementById('smsSid').value = savedSettings.sms.sid || '';
        document.getElementById('smsToken').value = savedSettings.sms.token || '';
    }
    
    // Load notification history
    loadNotificationHistory();
}

function saveNotificationSettings() {
    const settings = {
        email: {
            fromEmail: document.getElementById('fromEmail').value,
            replyEmail: document.getElementById('replyEmail').value,
            provider: document.getElementById('emailProvider').value,
            apiKey: document.getElementById('emailApiKey').value
        },
        sms: {
            fromPhone: document.getElementById('fromPhone').value,
            provider: document.getElementById('smsProvider').value,
            sid: document.getElementById('smsSid').value,
            token: document.getElementById('smsToken').value
        }
    };
    
    saveToLocalStorage('notificationSettings', settings);
    showNotification('Notification settings saved!');
}

function loadTemplate(templateKey) {
    const template = notificationTemplates[templateKey];
    if (template) {
        document.getElementById('templateSubject').value = template.subject;
        document.getElementById('templateBody').value = template.body;
    }
}

function previewTemplate() {
    const subject = document.getElementById('templateSubject').value;
    const body = document.getElementById('templateBody').value;
    
    // Replace variables with sample data
    const sampleData = {
        recipient_name: "John Doe",
        property_name: "Sunset Villa",
        date: "November 25, 2024",
        time: "10:00 AM",
        cleaner_name: "Sarah Johnson",
        cleaning_type: "Standard Cleaning",
        total_cost: "$92.00",
        cleaning_cost: "$80.00",
        platform_fee: "$12.00",
        fee_percentage: "15",
        start_time: "10:00 AM",
        end_time: "12:30 PM",
        duration: "2.5 hours",
        invoice_number: "INV-2024-0125",
        week_range: "Nov 18-24, 2024",
        total_cleanings: "12",
        properties_cleaned: "8",
        total_revenue: "$1,104.00",
        average_rating: "4.8",
        tracking_link: "https://hosthelperclean.com/track/abc123"
    };
    
    let previewSubject = subject;
    let previewBody = body;
    
    // Replace all variables
    Object.keys(sampleData).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        previewSubject = previewSubject.replace(regex, sampleData[key]);
        previewBody = previewBody.replace(regex, sampleData[key]);
    });
    
    // Show preview modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <span class="close-modal" onclick="this.closest('.modal').remove()">&times;</span>
            <h2>Email Preview</h2>
            <div style="background: #f7fafc; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
                <p><strong>Subject:</strong> ${previewSubject}</p>
            </div>
            <div style="background: #f7fafc; padding: 1rem; border-radius: 8px; white-space: pre-line;">
                ${previewBody}
            </div>
            <button class="btn btn-primary" onclick="this.closest('.modal').remove()" style="margin-top: 1rem;">Close Preview</button>
        </div>
    `;
    document.body.appendChild(modal);
}

function testNotifications() {
    // Show test notification modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <span class="close-modal" onclick="this.closest('.modal').remove()">&times;</span>
            <h2>Send Test Notification</h2>
            <div class="form-group">
                <label>Notification Type</label>
                <select id="testType" class="form-control">
                    <option value="booking_confirmation">Booking Confirmation</option>
                    <option value="reminder_24h">24-Hour Reminder</option>
                    <option value="cleaning_started">Cleaning Started</option>
                    <option value="cleaning_completed">Cleaning Completed</option>
                    <option value="payment_receipt">Payment Receipt</option>
                </select>
            </div>
            <div class="form-group">
                <label>Send To</label>
                <input type="email" id="testEmail" class="form-control" placeholder="test@example.com">
            </div>
            <div class="form-group">
                <label>Send SMS To (optional)</label>
                <input type="tel" id="testPhone" class="form-control" placeholder="+1 (555) 123-4567">
            </div>
            <div style="display: flex; gap: 0.75rem;">
                <button class="btn btn-primary" onclick="sendTestNotification()">Send Test</button>
                <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function sendTestNotification() {
    const type = document.getElementById('testType').value;
    const email = document.getElementById('testEmail').value;
    const phone = document.getElementById('testPhone').value;
    
    if (!email) {
        showNotification('Please enter an email address', 'error');
        return;
    }
    
    // Simulate sending notification
    const notification = {
        id: generateId(),
        type: type,
        recipient: email,
        channel: phone ? 'Email & SMS' : 'Email',
        status: 'Sent',
        timestamp: new Date().toISOString()
    };
    
    // Add to history
    let history = getFromLocalStorage('notificationHistory') || [];
    history.unshift(notification);
    if (history.length > 100) history = history.slice(0, 100); // Keep last 100
    saveToLocalStorage('notificationHistory', history);
    
    // Close modal and show success
    document.querySelector('.modal').remove();
    showNotification('Test notification sent successfully!');
    loadNotificationHistory();
}

function loadNotificationHistory() {
    const history = getFromLocalStorage('notificationHistory') || [];
    const tbody = document.getElementById('notificationHistory');
    
    if (history.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem; color: #718096;">
                    No notifications sent yet
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = history.slice(0, 20).map(notification => {
        const date = new Date(notification.timestamp);
        const typeLabel = notification.type.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        
        return `
            <tr>
                <td>${date.toLocaleString()}</td>
                <td>${typeLabel}</td>
                <td>${notification.recipient}</td>
                <td>${notification.channel}</td>
                <td>
                    <span class="status-badge ${notification.status.toLowerCase()}">
                        ${notification.status}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm" onclick="resendNotification('${notification.id}')">
                        <i class="fas fa-redo"></i> Resend
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function resendNotification(notificationId) {
    showNotification('Notification resent successfully!');
}

// Automated notification triggers
function setupNotificationTriggers() {
    // Check for 24-hour reminders every hour
    setInterval(() => {
        checkFor24HourReminders();
    }, 3600000); // 1 hour
    
    // Check for weekly summaries
    setInterval(() => {
        checkForWeeklySummary();
    }, 86400000); // 24 hours
}

function checkFor24HourReminders() {
    const bookings = getFromLocalStorage('bookings') || [];
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    bookings.forEach(booking => {
        const bookingDate = new Date(booking.date || booking.scheduledDate);
        const timeDiff = bookingDate - now;
        
        // If booking is between 23-25 hours away
        if (timeDiff > 23 * 60 * 60 * 1000 && timeDiff < 25 * 60 * 60 * 1000) {
            if (!booking.reminderSent) {
                sendAutomatedNotification('reminder_24h', booking);
                booking.reminderSent = true;
                saveToLocalStorage('bookings', bookings);
            }
        }
    });
}

function checkForWeeklySummary() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    
    // Check if it's the configured day (default: Monday = 1)
    if (dayOfWeek === 1) {
        const lastSummary = getFromLocalStorage('lastWeeklySummary');
        const lastSummaryDate = lastSummary ? new Date(lastSummary) : null;
        
        // If we haven't sent a summary in the last 6 days
        if (!lastSummaryDate || (now - lastSummaryDate) > 6 * 24 * 60 * 60 * 1000) {
            sendWeeklySummary();
            saveToLocalStorage('lastWeeklySummary', now.toISOString());
        }
    }
}

function sendAutomatedNotification(type, data) {
    // Check if this notification type is enabled
    const triggerEnabled = document.getElementById(`trigger${type.split('_').map(w => 
        w.charAt(0).toUpperCase() + w.slice(1)).join('')}`);
    
    if (!triggerEnabled || !triggerEnabled.checked) return;
    
    // Create notification record
    const notification = {
        id: generateId(),
        type: type,
        recipient: data.hostEmail || 'host@example.com',
        channel: 'Email',
        status: 'Sent',
        timestamp: new Date().toISOString()
    };
    
    // Add to history
    let history = getFromLocalStorage('notificationHistory') || [];
    history.unshift(notification);
    saveToLocalStorage('notificationHistory', history);
    
    // In production, this would actually send the email/SMS
    console.log('Sending automated notification:', type, data);
}

function sendWeeklySummary() {
    // Calculate weekly stats
    const bookings = getFromLocalStorage('bookings') || [];
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    
    const weeklyBookings = bookings.filter(b => {
        const bookingDate = new Date(b.date || b.scheduledDate);
        return bookingDate >= weekStart;
    });
    
    const summaryData = {
        total_cleanings: weeklyBookings.length,
        properties_cleaned: [...new Set(weeklyBookings.map(b => b.property))].length,
        total_revenue: weeklyBookings.reduce((sum, b) => sum + (b.totalPrice || 92), 0),
        average_rating: 4.8 // Would calculate from actual ratings
    };
    
    sendAutomatedNotification('weekly_summary', summaryData);
}

// Initialize notification triggers when page loads
document.addEventListener('DOMContentLoaded', function() {
    setupNotificationTriggers();
});

// Property Owner Portal Functions
let currentOwnerView = 'dashboard';
let ownerProperties = [];
let ownerBookings = [];

function initializeOwnerPortal() {
    // Load owner data
    loadOwnerData();
    
    // Set up navigation
    document.querySelectorAll('.owner-nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const view = this.dataset.view;
            showOwnerView(view);
        });
    });
    
    // Load initial view
    showOwnerView('dashboard');
}

function loadOwnerData() {
    // In a real app, this would fetch from API based on logged-in user
    const currentUser = getFromLocalStorage('currentUser') || {};
    
    // Load owner's properties
    const allProperties = getFromLocalStorage('properties') || [];
    ownerProperties = allProperties.filter(p => p.ownerId === currentUser.id || p.owner === currentUser.name);
    
    // Load owner's bookings
    const allBookings = getFromLocalStorage('bookings') || [];
    ownerBookings = allBookings.filter(b => {
        return ownerProperties.some(p => p.id === b.propertyId || p.name === b.property);
    });
    
    // Update UI
    document.getElementById('ownerName').textContent = currentUser.name || 'Property Owner';
    document.getElementById('ownerGreeting').textContent = currentUser.name || 'Property Owner';
}

function showOwnerView(view) {
    // Update navigation
    document.querySelectorAll('.owner-nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.view === view) {
            link.classList.add('active');
        }
    });
    
    // Hide all views
    document.querySelectorAll('.owner-view').forEach(v => {
        v.classList.remove('active');
    });
    
    // Show selected view
    const viewElement = document.getElementById(`owner${view.charAt(0).toUpperCase() + view.slice(1)}View`);
    if (viewElement) {
        viewElement.classList.add('active');
        
        // Load view-specific data
        switch(view) {
            case 'dashboard':
                loadOwnerDashboard();
                break;
            case 'properties':
                loadOwnerProperties();
                break;
            case 'bookings':
                loadOwnerBookings();
                break;
            case 'tracking':
                loadOwnerTracking();
                break;
            case 'analytics':
                loadOwnerAnalytics();
                break;
        }
    }
    
    currentOwnerView = view;
}

function loadOwnerDashboard() {
    // Update stats
    document.getElementById('totalProperties').textContent = ownerProperties.length;
    
    const upcomingCleanings = ownerBookings.filter(b => {
        const bookingDate = new Date(b.date || b.scheduledDate);
        return bookingDate >= new Date() && b.status !== 'cancelled';
    }).length;
    document.getElementById('upcomingCleanings').textContent = upcomingCleanings;
    
    // Calculate average rating
    const ratings = ownerBookings.filter(b => b.rating).map(b => b.rating);
    const avgRating = ratings.length > 0 ? 
        (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : '0.0';
    document.getElementById('avgRatingOwner').textContent = avgRating;
    
    // Calculate monthly spend
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const monthlyBookings = ownerBookings.filter(b => {
        const bookingDate = new Date(b.date || b.scheduledDate);
        return bookingDate >= thisMonth;
    });
    const monthlySpend = monthlyBookings.reduce((sum, b) => sum + (b.totalPrice || 92), 0);
    document.getElementById('monthlySpend').textContent = `$${monthlySpend.toFixed(2)}`;
    
    // Load today's schedule
    loadTodaySchedule();
    
    // Load recent activity
    loadRecentActivity();
}

function loadTodaySchedule() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayBookings = ownerBookings.filter(b => {
        const bookingDate = new Date(b.date || b.scheduledDate);
        bookingDate.setHours(0, 0, 0, 0);
        return bookingDate.getTime() === today.getTime();
    }).sort((a, b) => {
        const timeA = a.time || '10:00';
        const timeB = b.time || '10:00';
        return timeA.localeCompare(timeB);
    });
    
    const scheduleHtml = todayBookings.length > 0 ? todayBookings.map(booking => `
        <div class="schedule-item">
            <div class="schedule-time">${booking.time || '10:00 AM'}</div>
            <div class="schedule-details">
                <h4>${booking.property || booking.propertyName}</h4>
                <p>Cleaner: ${booking.cleanerName || 'Not assigned'} • ${booking.type || 'Standard'} cleaning</p>
            </div>
            <div class="schedule-status">
                <span class="status-badge ${booking.status || 'scheduled'}">${booking.status || 'Scheduled'}</span>
            </div>
        </div>
    `).join('') : `
        <div class="empty-state">
            <i class="fas fa-calendar-times"></i>
            <p>No cleanings scheduled for today</p>
        </div>
    `;
    
    document.getElementById('todayScheduleOwner').innerHTML = scheduleHtml;
}

function loadRecentActivity() {
    // Create sample activity data
    const activities = [
        {
            icon: 'check-circle',
            color: 'green',
            text: 'Cleaning completed at Sunset Villa',
            time: '2 hours ago'
        },
        {
            icon: 'star',
            color: 'yellow',
            text: 'You rated a cleaning 5 stars',
            time: '1 day ago'
        },
        {
            icon: 'calendar-plus',
            color: 'blue',
            text: 'New cleaning scheduled for Beach House',
            time: '2 days ago'
        },
        {
            icon: 'dollar-sign',
            color: 'green',
            text: 'Payment processed for Mountain Cabin cleaning',
            time: '3 days ago'
        }
    ];
    
    const activityHtml = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon" style="background: ${getColorCode(activity.color)}20; color: ${getColorCode(activity.color)}">
                <i class="fas fa-${activity.icon}"></i>
            </div>
            <div class="activity-content">
                <p>${activity.text}</p>
                <span class="activity-time">${activity.time}</span>
            </div>
        </div>
    `).join('');
    
    document.getElementById('recentActivityOwner').innerHTML = activityHtml;
}

function getColorCode(color) {
    const colors = {
        green: '#38a169',
        yellow: '#d69e2e',
        blue: '#3182ce',
        red: '#e53e3e'
    };
    return colors[color] || '#718096';
}

function loadOwnerProperties() {
    const propertiesHtml = ownerProperties.length > 0 ? ownerProperties.map(property => `
        <div class="property-card">
            <img src="${property.image || 'https://via.placeholder.com/300x200'}" 
                 alt="${property.name}" class="property-image">
            <div class="property-details">
                <h3>${property.name}</h3>
                <div class="property-info">
                    <div class="property-info-item">
                        <i class="fas fa-bed"></i>
                        <span>${property.bedrooms || 2} bedrooms</span>
                    </div>
                    <div class="property-info-item">
                        <i class="fas fa-bath"></i>
                        <span>${property.bathrooms || 2} bathrooms</span>
                    </div>
                    <div class="property-info-item">
                        <i class="fas fa-ruler-combined"></i>
                        <span>${property.sqft || 1200} sqft</span>
                    </div>
                </div>
                <div class="property-actions">
                    <button class="btn btn-primary" onclick="scheduleCleaningForProperty('${property.id}')">
                        Schedule Cleaning
                    </button>
                    <button class="btn btn-secondary" onclick="viewPropertyDetails('${property.id}')">
                        View Details
                    </button>
                </div>
            </div>
        </div>
    `).join('') : `
        <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 3rem;">
            <i class="fas fa-building" style="font-size: 4rem; color: #cbd5e0; margin-bottom: 1rem; display: block;"></i>
            <p style="color: #718096;">No properties added yet</p>
            <button class="btn btn-primary" onclick="showAddPropertyOwner()" style="margin-top: 1rem;">
                <i class="fas fa-plus"></i> Add Your First Property
            </button>
        </div>
    `;
    
    document.getElementById('ownerPropertiesGrid').innerHTML = propertiesHtml;
}

function loadOwnerBookings() {
    const bookingsHtml = ownerBookings.length > 0 ? ownerBookings
        .sort((a, b) => new Date(b.date || b.scheduledDate) - new Date(a.date || a.scheduledDate))
        .map(booking => {
            const date = new Date(booking.date || booking.scheduledDate);
            const status = booking.status || 'scheduled';
            const statusClass = status === 'completed' ? 'success' : 
                               status === 'cancelled' ? 'danger' : 'warning';
            
            return `
                <tr>
                    <td>${date.toLocaleDateString()}</td>
                    <td>${booking.property || booking.propertyName}</td>
                    <td>${booking.cleanerName || 'Not assigned'}</td>
                    <td>${booking.type || 'Standard'}</td>
                    <td><span class="status-badge ${statusClass}">${status}</span></td>
                    <td>$${booking.totalPrice || 92}</td>
                    <td>
                        <button class="btn btn-sm" onclick="viewBookingDetails('${booking.id}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                        ${status === 'completed' && !booking.rating ? `
                            <button class="btn btn-sm btn-primary" onclick="rateBooking('${booking.id}')">
                                <i class="fas fa-star"></i> Rate
                            </button>
                        ` : ''}
                    </td>
                </tr>
            `;
        }).join('') : `
        <tr>
            <td colspan="7" style="text-align: center; padding: 3rem; color: #718096;">
                No bookings found
            </td>
        </tr>
    `;
    
    document.getElementById('ownerBookingsTable').innerHTML = bookingsHtml;
}

function filterOwnerBookings() {
    const filter = document.getElementById('ownerBookingFilter').value;
    let filteredBookings = [...ownerBookings];
    
    if (filter !== 'all') {
        filteredBookings = filteredBookings.filter(b => {
            const status = b.status || 'scheduled';
            if (filter === 'upcoming') return status === 'scheduled' || status === 'confirmed';
            if (filter === 'completed') return status === 'completed';
            if (filter === 'cancelled') return status === 'cancelled';
            return true;
        });
    }
    
    // Update the table with filtered results
    ownerBookings = filteredBookings;
    loadOwnerBookings();
    ownerBookings = getFromLocalStorage('bookings') || []; // Reset to full list
}

function searchOwnerBookings() {
    const searchTerm = document.getElementById('ownerBookingSearch').value.toLowerCase();
    
    if (searchTerm) {
        const filteredBookings = ownerBookings.filter(b => {
            const property = (b.property || b.propertyName || '').toLowerCase();
            const cleaner = (b.cleanerName || '').toLowerCase();
            return property.includes(searchTerm) || cleaner.includes(searchTerm);
        });
        
        const tempBookings = [...ownerBookings];
        ownerBookings = filteredBookings;
        loadOwnerBookings();
        ownerBookings = tempBookings;
    } else {
        loadOwnerBookings();
    }
}

function loadOwnerTracking() {
    // Check for active cleanings
    const activeCleanings = ownerBookings.filter(b => {
        const status = b.status || 'scheduled';
        return status === 'in_progress' || status === 'started';
    });
    
    if (activeCleanings.length > 0) {
        document.getElementById('activeCleaningsMap').innerHTML = `
            <div class="active-cleanings-list">
                <h3>Cleanings in Progress</h3>
                ${activeCleanings.map(cleaning => `
                    <div class="active-cleaning-card" onclick="showCleaningDetails('${cleaning.id}')">
                        <div class="cleaning-status">
                            <div class="status-indicator active"></div>
                            <span>In Progress</span>
                        </div>
                        <div class="cleaning-info">
                            <h4>${cleaning.property || cleaning.propertyName}</h4>
                            <p>Cleaner: ${cleaning.cleanerName || 'Not assigned'}</p>
                            <p>Started: ${cleaning.startTime || '30 minutes ago'}</p>
                        </div>
                        <div class="cleaning-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: 60%"></div>
                            </div>
                            <span>60% Complete</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        document.getElementById('activeCleaningDetails').style.display = 'block';
    } else {
        document.getElementById('activeCleaningDetails').style.display = 'none';
    }
}

function loadOwnerAnalytics() {
    const period = document.getElementById('ownerAnalyticsPeriod')?.value || 'month';
    
    // Calculate analytics based on period
    const now = new Date();
    let startDate = new Date();
    
    switch(period) {
        case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
        case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
        case 'quarter':
            startDate.setMonth(now.getMonth() - 3);
            break;
        case 'year':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
    }
    
    const periodBookings = ownerBookings.filter(b => {
        const bookingDate = new Date(b.date || b.scheduledDate);
        return bookingDate >= startDate && bookingDate <= now;
    });
    
    // Calculate costs
    const standardCost = periodBookings
        .filter(b => !b.type || b.type === 'standard')
        .reduce((sum, b) => sum + (b.totalPrice || 92), 0);
    
    const deepCost = periodBookings
        .filter(b => b.type === 'deep')
        .reduce((sum, b) => sum + (b.totalPrice || 172.5), 0);
    
    const priorityCost = periodBookings
        .filter(b => b.type === 'priority')
        .reduce((sum, b) => sum + (b.totalPrice || 115), 0);
    
    const totalCost = standardCost + deepCost + priorityCost;
    
    // Update UI
    document.getElementById('standardCostOwner').textContent = `$${standardCost.toFixed(2)}`;
    document.getElementById('deepCostOwner').textContent = `$${deepCost.toFixed(2)}`;
    document.getElementById('priorityCostOwner').textContent = `$${priorityCost.toFixed(2)}`;
    document.getElementById('totalCostOwner').textContent = `$${totalCost.toFixed(2)}`;
    
    // Update property performance
    updatePropertyPerformance(periodBookings);
}

function updatePropertyPerformance(bookings) {
    const propertyStats = {};
    
    bookings.forEach(booking => {
        const property = booking.property || booking.propertyName;
        if (!propertyStats[property]) {
            propertyStats[property] = {
                cleanings: 0,
                totalCost: 0,
                ratings: []
            };
        }
        
        propertyStats[property].cleanings++;
        propertyStats[property].totalCost += booking.totalPrice || 92;
        if (booking.rating) {
            propertyStats[property].ratings.push(booking.rating);
        }
    });
    
    const performanceHtml = Object.entries(propertyStats)
        .sort((a, b) => b[1].cleanings - a[1].cleanings)
        .map(([property, stats]) => {
            const avgRating = stats.ratings.length > 0 ?
                (stats.ratings.reduce((a, b) => a + b, 0) / stats.ratings.length).toFixed(1) : 'N/A';
            
            return `
                <div class="property-performance-item">
                    <div class="performance-header">
                        <h4>${property}</h4>
                        <span class="performance-rating">
                            <i class="fas fa-star"></i> ${avgRating}
                        </span>
                    </div>
                    <div class="performance-stats">
                        <span>${stats.cleanings} cleanings</span>
                        <span>$${stats.totalCost.toFixed(2)} spent</span>
                    </div>
                </div>
            `;
        }).join('');
    
    document.getElementById('propertyPerformanceList').innerHTML = performanceHtml || 
        '<p style="color: #718096;">No data available for this period</p>';
}

// Owner Portal Action Functions
function toggleOwnerNotifications() {
    const center = document.getElementById('ownerNotificationCenter');
    center.classList.toggle('active');
}

function toggleOwnerMenu() {
    const dropdown = document.getElementById('ownerDropdown');
    dropdown.classList.toggle('active');
}

function showOwnerProfile() {
    showNotification('Profile settings coming soon!');
}

function showOwnerSettings() {
    showNotification('Owner settings coming soon!');
}

function switchToHostDashboard() {
    document.getElementById('ownerPortal').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
}

function showAddPropertyOwner() {
    // Reuse existing add property modal
    showAddPropertyModal();
}

function scheduleCleaningForProperty(propertyId) {
    const property = ownerProperties.find(p => p.id === propertyId);
    if (property) {
        showNotification(`Opening scheduler for ${property.name}...`);
    }
}

function viewPropertyDetails(propertyId) {
    const property = ownerProperties.find(p => p.id === propertyId);
    if (property) {
        showNotification(`Loading details for ${property.name}...`);
    }
}

function viewBookingDetails(bookingId) {
    const booking = ownerBookings.find(b => b.id === bookingId);
    if (booking) {
        showBookingDetails(bookingId);
    }
}

function rateBooking(bookingId) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <span class="close-modal" onclick="this.closest('.modal').remove()">&times;</span>
            <h2>Rate Your Cleaning</h2>
            <div class="rating-section">
                <div class="star-rating" id="starRating">
                    ${[1,2,3,4,5].map(i => `
                        <i class="fas fa-star" data-rating="${i}" onclick="setRating(${i})"></i>
                    `).join('')}
                </div>
                <p class="rating-text" id="ratingText">Click to rate</p>
            </div>
            <div class="form-group">
                <label>Comments (optional)</label>
                <textarea id="ratingComments" class="form-control" rows="4" 
                          placeholder="Share your experience..."></textarea>
            </div>
            <div style="display: flex; gap: 0.75rem;">
                <button class="btn btn-primary" onclick="submitRating('${bookingId}')">Submit Rating</button>
                <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function setRating(rating) {
    document.querySelectorAll('#starRating .fa-star').forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
    
    const texts = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
    document.getElementById('ratingText').textContent = texts[rating - 1];
}

function submitRating(bookingId) {
    const rating = document.querySelectorAll('#starRating .fa-star.active').length;
    const comments = document.getElementById('ratingComments').value;
    
    if (rating === 0) {
        showNotification('Please select a rating', 'error');
        return;
    }
    
    // Update booking with rating
    let bookings = getFromLocalStorage('bookings') || [];
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
        booking.rating = rating;
        booking.ratingComments = comments;
        booking.ratedAt = new Date().toISOString();
        saveToLocalStorage('bookings', bookings);
    }
    
    // Close modal and refresh
    document.querySelector('.modal').remove();
    showNotification('Thank you for your feedback!');
    loadOwnerBookings();
}

function showCleaningDetails(cleaningId) {
    const cleaning = ownerBookings.find(b => b.id === cleaningId);
    if (!cleaning) return;
    
    document.getElementById('activeCleaningDetails').innerHTML = `
        <h3>Cleaning Details - ${cleaning.property || cleaning.propertyName}</h3>
        <div class="cleaning-tracker">
            <div class="tracker-steps">
                <div class="tracker-step completed">
                    <div class="step-icon">
                        <i class="fas fa-check"></i>
                    </div>
                    <div class="step-info">
                        <h4>Cleaner Arrived</h4>
                        <p>10:00 AM</p>
                    </div>
                </div>
                <div class="tracker-step active">
                    <div class="step-icon">
                        <i class="fas fa-spinner fa-spin"></i>
                    </div>
                    <div class="step-info">
                        <h4>Cleaning in Progress</h4>
                        <p>Started 30 minutes ago</p>
                    </div>
                </div>
                <div class="tracker-step">
                    <div class="step-icon">
                        <i class="fas fa-camera"></i>
                    </div>
                    <div class="step-info">
                        <h4>Photo Verification</h4>
                        <p>Pending</p>
                    </div>
                </div>
                <div class="tracker-step">
                    <div class="step-icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div class="step-info">
                        <h4>Completed</h4>
                        <p>Estimated 11:30 AM</p>
                    </div>
                </div>
            </div>
            
            <div class="cleaner-contact">
                <h4>Your Cleaner</h4>
                <div class="cleaner-info">
                    <img src="https://via.placeholder.com/50" alt="Cleaner" style="border-radius: 50%;">
                    <div>
                        <p><strong>${cleaning.cleanerName || 'Not assigned'}</strong></p>
                        <p style="color: #718096;">
                            <i class="fas fa-star" style="color: #d69e2e;"></i> 4.8 rating
                        </p>
                    </div>
                </div>
                <button class="btn btn-primary" onclick="contactCleaner('${cleaning.cleanerId}')">
                    <i class="fas fa-comment"></i> Send Message
                </button>
            </div>
        </div>
    `;
}

function exportOwnerReport() {
    showNotification('Generating report...');
    // In production, this would generate and download a PDF/Excel report
}

// Add CSS for property performance
const styleElement = document.createElement('style');
styleElement.textContent = `
    .property-performance-item {
        padding: 1rem;
        border-bottom: 1px solid #e2e8f0;
    }
    
    .property-performance-item:last-child {
        border-bottom: none;
    }
    
    .performance-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
    }
    
    .performance-header h4 {
        margin: 0;
        color: #2d3748;
    }
    
    .performance-rating {
        color: #d69e2e;
        font-weight: 600;
    }
    
    .performance-stats {
        display: flex;
        gap: 1rem;
        color: #718096;
        font-size: 0.875rem;
    }
    
    .star-rating {
        font-size: 2rem;
        color: #cbd5e0;
        cursor: pointer;
        margin: 1rem 0;
        text-align: center;
    }
    
    .star-rating .fa-star {
        margin: 0 0.25rem;
        transition: color 0.2s;
    }
    
    .star-rating .fa-star:hover,
    .star-rating .fa-star.active {
        color: #d69e2e;
    }
    
    .rating-text {
        text-align: center;
        color: #718096;
        margin-bottom: 1rem;
    }
    
    .cleaning-tracker {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 2rem;
        margin-top: 1.5rem;
    }
    
    .tracker-steps {
        display: flex;
        justify-content: space-between;
        position: relative;
    }
    
    .tracker-steps::before {
        content: '';
        position: absolute;
        top: 24px;
        left: 50px;
        right: 50px;
        height: 2px;
        background: #e2e8f0;
        z-index: 0;
    }
    
    .tracker-step {
        text-align: center;
        position: relative;
        z-index: 1;
    }
    
    .step-icon {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: #e2e8f0;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 0.5rem;
        color: #a0aec0;
    }
    
    .tracker-step.completed .step-icon {
        background: #38a169;
        color: white;
    }
    
    .tracker-step.active .step-icon {
        background: #3182ce;
        color: white;
    }
    
    .step-info h4 {
        margin: 0;
        font-size: 0.875rem;
        color: #2d3748;
    }
    
    .step-info p {
        margin: 0;
        font-size: 0.75rem;
        color: #718096;
    }
    
    .cleaner-contact {
        background: #f7fafc;
        padding: 1.5rem;
        border-radius: 8px;
    }
    
    .cleaner-contact h4 {
        margin: 0 0 1rem 0;
        color: #2d3748;
    }
    
    .cleaner-info {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
    }
    
    .active-cleanings-list {
        width: 100%;
    }
    
    .active-cleaning-card {
        background: #f7fafc;
        border-radius: 8px;
        padding: 1.5rem;
        margin-bottom: 1rem;
        cursor: pointer;
        transition: box-shadow 0.3s;
    }
    
    .active-cleaning-card:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    .cleaning-status {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 1rem;
    }
    
    .status-indicator {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #e53e3e;
    }
    
    .status-indicator.active {
        background: #38a169;
        animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
    }
    
    .cleaning-progress {
        margin-top: 1rem;
    }
    
    .progress-bar {
        width: 100%;
        height: 8px;
        background: #e2e8f0;
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 0.5rem;
    }
    
    .progress-fill {
        height: 100%;
        background: #3182ce;
        transition: width 0.3s;
    }
`;
document.head.appendChild(styleElement);

// Initialize owner portal when switching to it
function showOwnerPortal() {
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('cleanerPortal').style.display = 'none';
    document.getElementById('ownerPortal').style.display = 'block';
    
    initializeOwnerPortal();
}

// Update navigation to show calendar
function navigateTo(page) {
    // Hide all pages
    document.querySelectorAll('.dashboard-page').forEach(p => p.style.display = 'none');
    
    // Show requested page
    const pageElement = document.getElementById(page + 'Page');
    if (pageElement) {
        pageElement.style.display = 'block';
        
        // Initialize calendar if navigating to calendar page
        if (page === 'calendar') {
            generateCalendarGrid();
        }
    }
    
    // Update active nav
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === page) {
            link.classList.add('active');
        }
    });
}