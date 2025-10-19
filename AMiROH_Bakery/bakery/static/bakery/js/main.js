// =======================================================
// 1. AJAX/CSRF Utility Functions (Essential for Django Forms)
// =======================================================

// Gets CSRF token from cookie (Django standard)
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
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
const csrftoken = getCookie('csrftoken');

// =======================================================
// 2. Global Variables and Cart Logic (Simplified for Django Session)
// =======================================================

// Cart array stores item IDs and quantities, using localStorage as temporary mock for session
let cart = JSON.parse(localStorage.getItem('cart')) || []; 

// Cart functions must now use item IDs and communicate via AJAX
function addToCart(itemId) {
    // In a real Django app, this should send an AJAX POST request to a Django URL: /cart/add/
    // Example: fetch('/bakery/cart/add/', { method: 'POST', body: JSON.stringify({ item_id: itemId }) })
    
    const existingItem = cart.find(item => item.id === itemId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        // Assuming we fetch item details or know enough from the button's data attribute
        // For now, we mock the cart item structure based on the Menu data (which is now DB-backed)
        // Since we can't look up full details here, we just add the ID.
        // The Django view should handle the product lookup.
        cart.push({ id: itemId, quantity: 1, name: `Item ${itemId}` }); 
    }

    localStorage.setItem('cart', JSON.stringify(cart)); // Mock persistence
    updateCartDisplay();
    showToast('Item added to cart!', 'success');
}

// NOTE: renderCart() logic is complex and should be handled by Django views/templates 
// if you want full server-side rendering, but keeping the JS version for SPA-like experience on the Cart page
function renderCart() {
    const cartItemsContainer = document.getElementById('cart-container');
    if (!cartItemsContainer) return;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<div class="text-center py-8 text-gray-600">Your cart is empty.</div>';
        return;
    }

    // This part requires access to full product details (name, price) 
    // which are no longer in menuData[] but in Django DB.
    // In a real implementation, Django's cart view should pass cart data with full product details to the template.

    // Mock rendering for demonstration (names and prices are hardcoded/estimated):
    const total = cart.reduce((sum, item) => sum + (10 * item.quantity), 0); // Mock price $10

    cartItemsContainer.innerHTML = cart.map((item, index) => `
        <div class="bg-gray-50 p-4 mb-4 rounded flex justify-between items-center">
            <div class="flex items-center">
                <span class="text-xl font-semibold text-bakery-brown">${item.name} (ID: ${item.id})</span>
            </div>
            <div class="flex items-center space-x-4">
                <span class="font-bold text-bakery-brown">Qty: ${item.quantity}</span>
                <button onclick="removeFromCart(${index})" class="text-red-500 hover:text-red-700">Remove</button>
            </div>
        </div>
    `).join('');

    cartItemsContainer.innerHTML += `<div class="text-right text-2xl font-bold mt-4">Total: $${total.toFixed(2)}</div>`;
}


function removeFromCart(index) {
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();
    renderCart(); // Re-render the Cart page immediately
}

function updateCartDisplay() {
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    const cartBadge = document.getElementById('cart-badge');
    const mobileCartCount = document.getElementById('mobile-cart-count');
    
    if (cartCount > 0) {
        cartBadge.textContent = cartCount;
        cartBadge.classList.remove('hidden');
        if (mobileCartCount) mobileCartCount.textContent = cartCount;
    } else {
        cartBadge.classList.add('hidden');
        if (mobileCartCount) mobileCartCount.textContent = '0';
    }
}

// =======================================================
// 3. Modal and Toast Utility
// =======================================================

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    const toastIcon = document.getElementById('toast-icon');
    
    if (!toast) return; // Prevent error if toast element is missing

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

function showModal(modalId) {
    const modal = document.getElementById(`${modalId}-modal`);
    if (modal) modal.classList.add('show');
}

function hideModal(modalId) {
    const modal = document.getElementById(`${modalId}-modal`);
    if (modal) modal.classList.remove('show');
}

function switchModal(fromModal, toModal) {
    hideModal(fromModal);
    setTimeout(() => showModal(toModal), 300);
}

function closePromoBanner() {
    const banner = document.getElementById('promo-banner');
    if (banner) banner.style.display = 'none';
}


// =======================================================
// 4. Initialization and Event Listeners
// =======================================================

function init() {
    // Set up event listeners (only for client-side components)
    
    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            document.getElementById('mobile-menu').classList.toggle('hidden');
        });
    }

    // Modal click outside to close
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });
    });

    // Run cart update and render cart view (if on cart page)
    updateCartDisplay();
    renderCart();

    // Attach event listeners to checkout and review forms if needed for AJAX
    // For Django form submission, simply remove the 'e.preventDefault()' call
    document.getElementById('checkout-form')?.addEventListener('submit', (e) => {
        // e.preventDefault(); // Remove if using traditional form submission
        // Example AJAX: const orderData = { items: cart, ...form data }; submitOrder(orderData);
        // For now, let Django handle the form submission directly.
        localStorage.removeItem('cart'); // Clear cart after successful submission (server should confirm this)
    });
    
    document.getElementById('review-form')?.addEventListener('submit', (e) => {
        // e.preventDefault(); // Remove if using traditional form submission
        // For now, let Django handle the form submission directly.
    });

    // Star rating (client-side only for visual effect before submit)
    const stars = document.querySelectorAll('.star');
    let currentRating = 0;
    stars.forEach(star => {
        star.addEventListener('click', (e) => {
            currentRating = parseInt(e.target.dataset.rating);
            document.getElementById('rating-value').value = currentRating;
            updateStarDisplay(currentRating);
        });
    });
    
    function updateStarDisplay(rating) {
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.remove('text-gray-300');
                star.classList.add('star-rating');
            } else {
                star.classList.remove('star-rating');
                star.classList.add('text-gray-300');
            }
        });
    }

}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', init);