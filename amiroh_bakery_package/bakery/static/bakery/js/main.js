// Global variables
let cart = [];
let currentUser = null;
let currentRating = 0;
let reviews = [];
let users = [];
let orders = [];
let menuItems = [];
let currentFilter = 'all';

// --- Utility function to get CSRF token (required for Django POST requests) ---
function getCookie(name) {
    let cookieValue = null;
    if (adocument.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Utility for smooth scroll to top
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Utility to show/hide scroll button
function toggleScrollToTopButton() {
    const scrollBtn = document.getElementById('scroll-to-top-btn');
    if (!scrollBtn) return;

    if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
        scrollBtn.classList.remove('opacity-0', 'invisible');
        scrollBtn.classList.add('opacity-100');
    } else {
        scrollBtn.classList.remove('opacity-100');
        scrollBtn.classList.add('opacity-0', 'invisible');
    }
}
document.addEventListener('scroll', toggleScrollToTopButton);
// --- End Scroll to Top ---


// --- API Interaction ---

async function fetchMenuData() {
    try {
        const response = await fetch('/api/menu/'); 
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        menuItems = await response.json();
        
        if (document.getElementById('menu-grid')) {
            renderMenu();
        }
    } catch (error) {
        console.error("Could not fetch menu data:", error);
        if (document.getElementById('menu-grid')) {
            document.getElementById('menu-grid').innerHTML = `
                <div class="col-span-full text-center py-20 text-red-600">
                    <div class="text-4xl mb-4">⚠️</div>
                    <p class="text-xl">Failed to load menu. Please check the API endpoint and server status.</p>
                </div>
            `;
        }
    }
}

// --- Initialization and Event Setup ---

function setupEventListeners() {
    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            const mobileMenu = document.getElementById('mobile-menu');
            mobileMenu.classList.toggle('hidden');
        });
    }

    // Star rating
    const stars = document.querySelectorAll('.star');
    if (stars.length > 0) {
        stars.forEach(star => {
            star.addEventListener('click', (e) => {
                currentRating = parseInt(e.target.dataset.rating);
                document.getElementById('rating-value').value = currentRating;
                updateStarDisplay();
            });
        });
    }

    // Forms
    document.getElementById('newsletter-form')?.addEventListener('submit', handleNewsletterSubmit);
    document.getElementById('review-form')?.addEventListener('submit', handleReviewSubmit);
    document.getElementById('contact-form')?.addEventListener('submit', handleContactSubmit);
    document.getElementById('checkout-form')?.addEventListener('submit', handleCheckoutSubmit);
    document.getElementById('login-form')?.addEventListener('submit', handleLoginSubmit);
    document.getElementById('register-form')?.addEventListener('submit', handleRegisterSubmit);

    // Delivery type change
    document.querySelectorAll('input[name="delivery-type"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const deliverySection = document.getElementById('delivery-address-section');
            if (deliverySection) {
                if (e.target.value === 'delivery') {
                    deliverySection.classList.remove('hidden');
                } else {
                    deliverySection.classList.add('hidden');
                }
            }
        });
    });

    // Modal click outside to close
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });
    });
}

function init() {
    fetchMenuData(); 
    setupEventListeners();
    
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateUserInterface();
    }
    
    updateCartDisplay();
}


// --- Menu/Cart Logic ---

function renderMenu() {
    const menuGrid = document.getElementById('menu-grid');
    if (!menuGrid) return;

    const filteredItems = currentFilter === 'all' ? menuItems : menuItems.filter(item => item.category === currentFilter);
    
    menuGrid.innerHTML = '';
    
    menuGrid.innerHTML = filteredItems.map(item => {
        const displayPrice = item.price_thb || 'N/A';
        const calcPrice = item.price; // ใช้ Decimal Value ที่มาจาก Django

        return `
            <div class="product-card bg-white rounded-2xl shadow-bakery overflow-hidden">
                <div class="h-64 bg-gradient-to-br from-yellow-100 to-orange-100 flex items-center justify-center overflow-hidden">
                    <img 
                        src="/static/bakery/img/${item.image_name}" 
                        alt="${item.name}" 
                        class="object-cover w-full h-full transform hover:scale-105 transition-transform duration-300"
                    >
                </div>
                
                <div class="p-6">
                    <h3 class="text-2xl font-playfair font-semibold text-bakery-brown mb-3">${item.name}</h3>
                    <p class="text-gray-600 mb-4 text-lg">${item.description}</p>
                    <div class="flex justify-between items-center">
                        <span class="text-3xl font-bold text-bakery-brown">${displayPrice}</span>
                        <button onclick="addToCart('${item.name}', ${calcPrice}, '${item.image_name}')" class="btn-secondary text-white px-6 py-3 rounded-lg font-medium text-lg">Add to Cart</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function filterMenu(category) {
    currentFilter = category;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active', 'bg-bakery-brown', 'text-white');
        btn.classList.add('bg-white', 'text-bakery-brown', 'border-2', 'border-bakery-brown');
    });
    
    const clickedButton = event.target;
    clickedButton.classList.remove('bg-white', 'text-bakery-brown', 'border-2', 'border-bakery-brown');
    clickedButton.classList.add('active', 'bg-bakery-brown', 'text-white');
    
    renderMenu();
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function addToCart(name, price, imageName) { 
    const parsedPrice = parseFloat(price);

    const existingItem = cart.find(item => item.name === name);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ name, price: parsedPrice, imageName, quantity: 1 }); 
    }
    
    saveCart();
    updateCartDisplay();
    showToast('Item added to cart!', 'success');
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    updateCartDisplay();
    if (document.getElementById('cart-items')) {
        renderCart();
    }
}

function updateQuantity(index, change) {
    cart[index].quantity += change;
    if (cart[index].quantity <= 0) {
        removeFromCart(index);
    } else {
        saveCart();
        updateCartDisplay();
        if (document.getElementById('cart-items')) {
            renderCart();
        }
    }
}

function updateCartDisplay() {
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    const cartBadge = document.getElementById('cart-badge');
    const mobileCartCount = document.getElementById('mobile-cart-count');
    
    if (cartBadge && mobileCartCount) {
        if (cartCount > 0) {
            cartBadge.textContent = cartCount;
            cartBadge.classList.remove('hidden');
            mobileCartCount.textContent = cartCount;
        } else {
            cartBadge.classList.add('hidden');
            mobileCartCount.textContent = '0';
        }
    }
    
    if (document.getElementById('cart-items')) {
        renderCart();
    }
}

function renderCart() {
    const cartItems = document.getElementById('cart-items');
    const emptyCart = document.getElementById('empty-cart');
    const checkoutSection = document.getElementById('checkout-section');
    
    if (!cartItems || !emptyCart || !checkoutSection) return;
    
    if (cart.length === 0) {
        cartItems.innerHTML = '';
        emptyCart.classList.remove('hidden');
        checkoutSection.classList.add('hidden');
        return;
    }
    
    emptyCart.classList.add('hidden');
    checkoutSection.classList.remove('hidden');
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    document.getElementById('cart-total').textContent = total.toFixed(2);
    
    cartItems.innerHTML = cart.map((item, index) => {
        const itemTotal = (item.price * item.quantity).toFixed(2);
        
        return `
            <div class="bg-white rounded-2xl shadow-bakery p-6 flex items-center justify-between">
                <div class="flex items-center space-x-4">
                    <div class="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden">
                        <img src="/static/bakery/img/${item.imageName}" alt="${item.name}" class="object-cover w-full h-full">
                    </div>

                    <div>
                        <h3 class="text-xl font-semibold text-bakery-brown">${item.name}</h3>
                        <p class="text-gray-600">${item.price.toFixed(2)} ฿ each</p> 
                    </div>
                </div>
                <div class="flex items-center space-x-6">
                    <div class="flex items-center space-x-3">
                        <button onclick="updateQuantity(${index}, -1)" class="bg-gray-200 text-gray-700 w-10 h-10 rounded-full hover:bg-gray-300 font-bold text-lg">-</button>
                        <span class="font-bold text-xl w-8 text-center">${item.quantity}</span>
                        <button onclick="updateQuantity(${index}, 1)" class="bg-gray-200 text-gray-700 w-10 h-10 rounded-full hover:bg-gray-300 font-bold text-lg">+</button>
                    </div>
                    <span class="font-bold text-bakery-brown text-xl">${itemTotal} ฿</span>
                    <button onclick="removeFromCart(${index})" class="text-red-500 hover:text-red-700 text-2xl">🗑️</button>
                </div>
            </div>
        `;
    }).join('');
}


// --- Form/Auth Handlers ---

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    const toastIcon = document.getElementById('toast-icon');
    
    if (!toast || !toastMessage || !toastIcon) return;

    toastMessage.textContent = message;
    
    if (type === 'error') {
        toast.className = 'toast bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg';
        toastIcon.textContent = '✗';
    } else {
        toast.className = 'toast bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg';
        toastIcon.textContent = '✓';
    }
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// REVIEW SUBMISSION (FIXED CSRF & API CALL)
async function handleReviewSubmit(e) {
    e.preventDefault();
    
    if (currentRating === 0) {
        showToast('Please select a rating', 'error');
        return;
    }
    
    const name = document.getElementById('review-name').value;
    const email = document.getElementById('review-email').value;
    const comment = document.getElementById('review-comment').value;
    
    const submitBtn = document.getElementById('review-btn-text');
    const spinner = document.getElementById('review-spinner');
    submitBtn.classList.add('hidden');
    spinner.classList.remove('hidden');
    
    try {
        const response = await fetch('/api/review/submit/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({ name, email, rating: currentRating, comment })
        });
        
        submitBtn.classList.remove('hidden');
        spinner.classList.add('hidden');
        
        const result = await response.json();

        if (response.ok) {
            showToast(result.message, 'success');
            document.getElementById('review-form').reset();
            currentRating = 0;
            updateStarDisplay();
            // Since reviews are moderated, we don't reload, but confirm success.
        } else {
            showToast(result.error || 'Review submission failed. Please try again.', 'error');
            console.error('Backend Error:', result);
        }
    } catch (error) {
        console.error('Review submission failed due to network:', error);
        submitBtn.classList.remove('hidden');
        spinner.classList.add('hidden');
        showToast('Submission failed due to network error.', 'error');
    }
}

// CHECKOUT SUBMISSION (FIXED CSRF & API CALL)
async function handleCheckoutSubmit(e) {
    e.preventDefault();
    
    if (cart.length === 0) {
        showToast('Your cart is empty', 'error');
        return;
    }
    
    const customerName = document.getElementById('customer-name').value;
    const customerPhone = document.getElementById('customer-phone').value;
    const customerEmail = document.getElementById('customer-email').value;
    const deliveryType = document.querySelector('input[name="delivery-type"]:checked').value;
    const deliveryAddress = document.getElementById('delivery-address').value;
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2); 
    
    const orderData = {
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        delivery_type: deliveryType,
        delivery_address: deliveryAddress,
        order_items: JSON.stringify(cart),
        order_total: total,
    };
    
    const submitBtn = document.getElementById('checkout-btn-text');
    const spinner = document.getElementById('checkout-spinner');
    submitBtn.classList.add('hidden');
    spinner.classList.remove('hidden');
    
    try {
        const response = await fetch('/api/order/place/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify(orderData)
        });
        
        submitBtn.classList.remove('hidden');
        spinner.classList.add('hidden');
        
        const result = await response.json();

        if (response.ok) {
            showToast(result.message, 'success');
            cart = [];
            localStorage.removeItem('cart');
            updateCartDisplay();
            document.getElementById('checkout-form').reset();
        } else {
            showToast(result.error || 'Order failed. Please try again.', 'error');
            console.error('Backend Error:', result);
        }
    } catch (error) {
        console.error('Order submission failed due to network:', error);
        submitBtn.classList.remove('hidden');
        spinner.classList.add('hidden');
        showToast('Order failed due to network error.', 'error');
    }
}

// Simplified Handlers (no backend interaction for demo)
async function handleNewsletterSubmit(e) { e.preventDefault(); showToast('Thank you for subscribing!', 'success'); document.getElementById('newsletter-form').reset(); }
async function handleContactSubmit(e) { showToast('Message sent successfully! (Demo)', 'success'); e.preventDefault(); document.getElementById('contact-form').reset(); }
async function handleLoginSubmit(e) { showToast('Welcome back!', 'success'); e.preventDefault(); }
async function handleRegisterSubmit(e) { showToast('Account created successfully!', 'success'); e.preventDefault(); }

// Auth/Modal/Display Helpers (unchanged logic)
function showModal(modalId) { const modal = document.getElementById(`${modalId}-modal`); if (modal) { modal.classList.add('show'); } }
function hideModal(modalId) { const modal = document.getElementById(`${modalId}-modal`); if (modal) { modal.classList.remove('show'); } }
function switchModal(fromModal, toModal) { hideModal(fromModal); setTimeout(() => showModal(toModal), 300); }
function logout() { currentUser = null; localStorage.removeItem('currentUser'); updateUserInterface(); showToast('Logged out successfully', 'success'); window.location.href = '/'; }
function updateUserInterface() { const userMenu = document.getElementById('user-menu'); const authButtons = document.getElementById('auth-buttons'); const userName = document.getElementById('user-name'); if (userMenu && authButtons && userName) { if (currentUser) { userMenu.classList.remove('hidden'); authButtons.classList.add('hidden'); userName.textContent = `Welcome, ${currentUser.name}!`; } else { userMenu.classList.add('hidden'); authButtons.classList.remove('hidden'); } } }
function updateStarDisplay() { const stars = document.querySelectorAll('.star'); stars.forEach((star, index) => { if (index < currentRating) { star.classList.remove('text-gray-300'); star.classList.add('star-rating'); } else { star.classList.remove('star-rating'); star.classList.add('text-gray-300'); } }); }

document.addEventListener('DOMContentLoaded', init);
