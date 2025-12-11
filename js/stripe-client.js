// Stripe Client-Side Integration
// This file handles all Stripe interactions on the frontend

let stripe;
let stripePublishableKey;

// Initialize Stripe on page load
document.addEventListener('DOMContentLoaded', async function() {
    if (typeof Stripe === 'undefined') {
        console.error('Stripe.js not loaded. Make sure to include it in your HTML.');
        showNotification('Payment system not available. Please refresh the page.', 'error');
        return;
    }
    
    try {
        // Fetch Stripe publishable key from server
        const response = await fetch('/api/config');
        if (!response.ok) {
            throw new Error('Failed to load payment configuration');
        }
        
        const config = await response.json();
        stripePublishableKey = config.stripePublishableKey;
        
        if (!stripePublishableKey) {
            throw new Error('Stripe key not configured');
        }
        
        // Initialize Stripe with the fetched key
        stripe = Stripe(stripePublishableKey);
        console.log('✅ Stripe initialized successfully');
        
    } catch (error) {
        console.error('Failed to initialize Stripe:', error);
        showNotification('Payment system unavailable. Please contact support.', 'error');
    }
});

/**
 * Create a checkout session and redirect to Stripe
 * @param {Object} bookingData - The booking information
 */
async function initiateStripeCheckout(bookingData) {
    if (!stripe) {
        showNotification('Payment system not initialized. Please refresh the page.', 'error');
        return;
    }

    // Show loading state
    const bookButton = document.getElementById('bookNowButton');
    if (bookButton) {
        bookButton.disabled = true;
        bookButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    }

    try {
        // Call your backend to create checkout session
        const response = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bookingData)
        });

        const session = await response.json();

        if (!session.success) {
            throw new Error(session.error || 'Failed to create checkout session');
        }

        // Redirect to Stripe Checkout
        const result = await stripe.redirectToCheckout({
            sessionId: session.sessionId
        });

        if (result.error) {
            throw new Error(result.error.message);
        }
    } catch (error) {
        console.error('Checkout error:', error);
        showNotification('Error: ' + error.message, 'error');
        
        // Reset button state
        if (bookButton) {
            bookButton.disabled = false;
            bookButton.innerHTML = '<i class="fas fa-credit-card"></i> Complete Booking';
        }
    }
}

/**
 * Handle booking form submission with Stripe
 */
function handleBookingSubmit(event) {
    event.preventDefault();

    // Gather booking data from form
    const propertyId = document.getElementById('bookingPropertyId')?.value;
    const propertyName = document.getElementById('bookingPropertyName')?.value;
    const cleaningType = document.getElementById('bookingCleaningType')?.value || 'standard';
    const propertySize = document.getElementById('bookingPropertySize')?.value || 'twoBed';
    const scheduledDate = document.getElementById('bookingDate')?.value;
    const cleanerId = document.getElementById('selectedCleanerId')?.value;

    // Get selected addons
    const addons = [];
    document.querySelectorAll('input[name="addon"]:checked').forEach(checkbox => {
        addons.push(checkbox.value);
    });

    // Validate required fields
    if (!propertyId || !scheduledDate) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    // Create booking data object
    const bookingData = {
        propertyId,
        propertyName,
        cleaningType,
        propertySize,
        scheduledDate,
        addons,
        userId: currentUser?.id,
        userEmail: currentUser?.email,
        cleanerId: cleanerId || null
    };

    // Initiate Stripe checkout
    initiateStripeCheckout(bookingData);
}

/**
 * Verify successful payment after redirect from Stripe
 */
async function verifyPaymentSuccess() {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');

    if (!sessionId) return;

    try {
        // Verify the session with your backend
        const response = await fetch(`/api/verify-session/${sessionId}`);
        const data = await response.json();

        if (data.success && data.session) {
            // Payment was successful
            displayBookingSuccess(data.session);
        } else {
            throw new Error('Payment verification failed');
        }
    } catch (error) {
        console.error('Verification error:', error);
        showNotification('Payment verification failed. Please contact support.', 'error');
    }
}

/**
 * Display booking success message
 */
function displayBookingSuccess(session) {
    const container = document.getElementById('bookingSuccessContainer');
    if (!container) return;

    const metadata = session.metadata;
    
    container.innerHTML = `
        <div class="success-animation">
            <div class="checkmark-circle">
                <i class="fas fa-check"></i>
            </div>
        </div>
        
        <div class="success-content">
            <h1>Booking Confirmed!</h1>
            <p class="success-subtitle">Your cleaning has been successfully booked and paid.</p>
            
            <div class="booking-details-card">
                <h3>Booking Details</h3>
                <div class="detail-row">
                    <span class="detail-label">Property:</span>
                    <span class="detail-value">${metadata.propertyName}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Date:</span>
                    <span class="detail-value">${new Date(metadata.scheduledDate).toLocaleDateString()}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Type:</span>
                    <span class="detail-value">${metadata.cleaningType.charAt(0).toUpperCase() + metadata.cleaningType.slice(1)} Cleaning</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Amount Paid:</span>
                    <span class="detail-value">$${(session.amount_total / 100).toFixed(2)}</span>
                </div>
            </div>
            
            <div class="success-actions">
                <button class="btn btn-primary btn-lg" onclick="viewBookingDetails('${session.id}')">
                    <i class="fas fa-eye"></i> View Details
                </button>
                <button class="btn btn-outline btn-lg" onclick="window.location.href='/dashboard'">
                    <i class="fas fa-home"></i> Go to Dashboard
                </button>
            </div>
            
            <div class="next-steps">
                <h4>What Happens Next?</h4>
                <ul>
                    <li><i class="fas fa-check-circle"></i> You'll receive a confirmation email shortly</li>
                    <li><i class="fas fa-check-circle"></i> Your cleaner will be notified and will confirm the appointment</li>
                    <li><i class="fas fa-check-circle"></i> You'll receive updates and photos when the cleaning is complete</li>
                </ul>
            </div>
        </div>
    `;

    // Trigger confetti animation
    if (typeof confetti !== 'undefined') {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
    }
}

/**
 * Real-time price calculator
 */
function updateBookingPrice() {
    const cleaningType = document.getElementById('bookingCleaningType')?.value || 'standard';
    const propertySize = document.getElementById('bookingPropertySize')?.value || 'twoBed';
    
    // Get selected addons
    const addons = [];
    document.querySelectorAll('input[name="addon"]:checked').forEach(checkbox => {
        addons.push(checkbox.value);
    });

    // Calculate pricing
    const pricing = calculateClientPricing(cleaningType, propertySize, addons);

    // Update display
    const priceDisplay = document.getElementById('totalPriceDisplay');
    if (priceDisplay) {
        priceDisplay.innerHTML = `
            <div class="price-breakdown">
                <div class="price-row">
                    <span>Base Cleaning</span>
                    <span>$${pricing.baseService.toFixed(2)}</span>
                </div>
                ${pricing.addons > 0 ? `
                    <div class="price-row">
                        <span>Add-ons</span>
                        <span>$${pricing.addons.toFixed(2)}</span>
                    </div>
                ` : ''}
                <div class="price-row">
                    <span>Service Fee (15%)</span>
                    <span>$${pricing.platformFee.toFixed(2)}</span>
                </div>
                <div class="price-row total-row">
                    <strong>Total</strong>
                    <strong class="total-amount">$${pricing.totalPrice.toFixed(2)}</strong>
                </div>
            </div>
            <p class="price-note">What you see is what you pay. No hidden fees.</p>
        `;
    }

    return pricing;
}

/**
 * Calculate pricing on client side (mirrors server-side logic)
 */
function calculateClientPricing(cleaningType, propertySize, addons = []) {
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

    const ADDON_PRICES = {
        laundry: 25,
        insideOven: 20,
        insideFridge: 20,
        windows: 30,
        garage: 25,
        supplies: 15
    };

    const baseService = BASE_PRICES[cleaningType]?.[propertySize] || 95;
    
    let addonTotal = 0;
    addons.forEach(addon => {
        addonTotal += ADDON_PRICES[addon] || 0;
    });

    const cleanerPayout = baseService + addonTotal;
    const platformFee = Math.round(cleanerPayout * 0.15 * 100) / 100;
    const totalPrice = cleanerPayout + platformFee;

    return {
        baseService,
        addons: addonTotal,
        cleanerPayout,
        platformFee,
        totalPrice
    };
}

/**
 * Handle payment cancellation
 */
function handlePaymentCancellation() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('canceled') === 'true') {
        showNotification('Payment was cancelled. Your booking was not completed.', 'info');
        
        // Remove the parameter from URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

/**
 * Enhanced booking modal with price calculator
 */
function showEnhancedBookingModal(propertyId) {
    const property = properties.find(p => p.id === propertyId);
    if (!property) return;

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content booking-modal">
            <div class="modal-header">
                <h2>Book Cleaning for ${property.name}</h2>
                <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <form id="bookingForm" onsubmit="handleBookingSubmit(event)">
                    <input type="hidden" id="bookingPropertyId" value="${property.id}">
                    <input type="hidden" id="bookingPropertyName" value="${property.name}">
                    
                    <div class="booking-step">
                        <h3>1. Property Details</h3>
                        <div class="property-info-card">
                            <p><strong>${property.name}</strong></p>
                            <p>${property.address}</p>
                            <p>${property.bedrooms} bed • ${property.bathrooms} bath</p>
                        </div>
                    </div>
                    
                    <div class="booking-step">
                        <h3>2. Cleaning Type</h3>
                        <div class="cleaning-type-selector">
                            <label class="radio-card">
                                <input type="radio" name="cleaningType" id="bookingCleaningType" value="quick" onchange="updateBookingPrice()">
                                <div class="radio-card-content">
                                    <i class="fas fa-bolt"></i>
                                    <strong>Quick Clean</strong>
                                    <p>Basic tidying, 1-2 hours</p>
                                </div>
                            </label>
                            <label class="radio-card">
                                <input type="radio" name="cleaningType" value="standard" checked onchange="updateBookingPrice()">
                                <div class="radio-card-content">
                                    <i class="fas fa-broom"></i>
                                    <strong>Standard Clean</strong>
                                    <p>Complete turnover, 2-3 hours</p>
                                </div>
                            </label>
                            <label class="radio-card">
                                <input type="radio" name="cleaningType" value="deep" onchange="updateBookingPrice()">
                                <div class="radio-card-content">
                                    <i class="fas fa-spray-can"></i>
                                    <strong>Deep Clean</strong>
                                    <p>Thorough cleaning, 4-5 hours</p>
                                </div>
                            </label>
                        </div>
                    </div>
                    
                    <div class="booking-step">
                        <h3>3. Property Size</h3>
                        <input type="hidden" id="bookingPropertySize" value="${getPropertySizeCode(property.bedrooms)}">
                        <div class="size-display">
                            <i class="fas fa-home"></i>
                            ${property.bedrooms} Bedroom${property.bedrooms !== 1 ? 's' : ''}
                        </div>
                    </div>
                    
                    <div class="booking-step">
                        <h3>4. Add-On Services (Optional)</h3>
                        <div class="addons-grid">
                            <label class="checkbox-card">
                                <input type="checkbox" name="addon" value="laundry" onchange="updateBookingPrice()">
                                <div class="checkbox-card-content">
                                    <i class="fas fa-tshirt"></i>
                                    <strong>Laundry Service</strong>
                                    <p>+$25</p>
                                </div>
                            </label>
                            <label class="checkbox-card">
                                <input type="checkbox" name="addon" value="insideOven" onchange="updateBookingPrice()">
                                <div class="checkbox-card-content">
                                    <i class="fas fa-fire"></i>
                                    <strong>Inside Oven</strong>
                                    <p>+$20</p>
                                </div>
                            </label>
                            <label class="checkbox-card">
                                <input type="checkbox" name="addon" value="insideFridge" onchange="updateBookingPrice()">
                                <div class="checkbox-card-content">
                                    <i class="fas fa-snowflake"></i>
                                    <strong>Inside Fridge</strong>
                                    <p>+$20</p>
                                </div>
                            </label>
                            <label class="checkbox-card">
                                <input type="checkbox" name="addon" value="windows" onchange="updateBookingPrice()">
                                <div class="checkbox-card-content">
                                    <i class="fas fa-window-maximize"></i>
                                    <strong>Window Cleaning</strong>
                                    <p>+$30</p>
                                </div>
                            </label>
                        </div>
                    </div>
                    
                    <div class="booking-step">
                        <h3>5. Schedule</h3>
                        <div class="form-group">
                            <label>Cleaning Date</label>
                            <input type="date" id="bookingDate" required min="${new Date().toISOString().split('T')[0]}">
                        </div>
                    </div>
                    
                    <div class="booking-step">
                        <h3>6. Select Cleaner (Optional)</h3>
                        <select id="selectedCleanerId" class="form-control">
                            <option value="">Auto-assign based on availability</option>
                            ${teamMembers.map(m => `
                                <option value="${m.id}">${m.name} (${m.rating ? m.rating + ' ⭐' : 'New'})</option>
                            `).join('')}
                        </select>
                    </div>
                    
                    <div class="price-summary" id="totalPriceDisplay">
                        <!-- Price will be calculated here -->
                    </div>
                    
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                        <button type="submit" id="bookNowButton" class="btn btn-primary btn-lg">
                            <i class="fas fa-credit-card"></i> Complete Booking
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Calculate initial price
    setTimeout(() => updateBookingPrice(), 100);
}

/**
 * Helper function to get property size code
 */
function getPropertySizeCode(bedrooms) {
    if (bedrooms === 0) return 'studio';
    if (bedrooms === 1) return 'oneBed';
    if (bedrooms === 2) return 'twoBed';
    if (bedrooms === 3) return 'threeBed';
    return 'fourBed';
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Check for payment success/cancellation
    verifyPaymentSuccess();
    handlePaymentCancellation();
    
    // Add event listeners for price calculator if on pricing page
    const calcInputs = document.querySelectorAll('#calcPropertySize, #calcCleaningType, input[type="checkbox"]');
    calcInputs.forEach(input => {
        input.addEventListener('change', updateCalculator);
    });
});

/**
 * Update the homepage calculator
 */
function updateCalculator() {
    const propertySize = document.getElementById('calcPropertySize')?.value;
    const cleaningType = document.getElementById('calcCleaningType')?.value;
    
    const addons = [];
    document.querySelectorAll('.addon-checkboxes input:checked').forEach(cb => {
        addons.push(cb.value);
    });
    
    const pricing = calculateClientPricing(cleaningType, propertySize, addons);
    
    document.getElementById('calcBasePrice').textContent = `$${pricing.baseService}`;
    document.getElementById('calcAddonsPrice').textContent = `$${pricing.addons}`;
    document.getElementById('calcTotal').textContent = `$${pricing.totalPrice.toFixed(2)}`;
    
    const addonsRow = document.getElementById('calcAddonsRow');
    if (pricing.addons > 0) {
        addonsRow.style.display = 'flex';
    } else {
        addonsRow.style.display = 'none';
    }
}

// Export functions for use in other scripts
window.initiateStripeCheckout = initiateStripeCheckout;
window.handleBookingSubmit = handleBookingSubmit;
window.showEnhancedBookingModal = showEnhancedBookingModal;
window.updateBookingPrice = updateBookingPrice;
window.updateCalculator = updateCalculator;
