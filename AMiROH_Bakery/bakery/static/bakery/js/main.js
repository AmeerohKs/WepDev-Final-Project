/* =======================================================
   Combined script: Element SDK + Data SDK + Django-friendly cart
   - CSRF helper
   - Menu rendering & filtering
   - Cart (localStorage) using item IDs (Django-compatible)
   - SDK init (elementSdk, dataSdk)
   - Forms: if window.dataSdk -> AJAX create, otherwise fall back to normal submit/localStorage
   ======================================================= */

/* ---------------------------
   0. CSRF Helper (Django)
   --------------------------- */
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

// Example: submit checkout via API endpoint
async function submitOrder(orderData) {
  const resp = await fetch('/orders/create/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrftoken
    },
    body: JSON.stringify(orderData)
  });
  return resp.json();
}

/* =======================================================
   1. App Config & Menu Data (Default + DB fallback)
   ======================================================= */
const defaultConfig = {
    bakery_name: "AMiROH Bakery",
    hero_title: "Freshly Baked Every Day",
    hero_subtitle: "Handcrafted breads, pastries & cakes made with love using traditional recipes and the finest ingredients",
    promo_text: "🎉 Grand Opening Special: 20% off all cakes this week!",
    bakery_address: "123 Web Street, So City, Hard 12345",
    bakery_phone: "(555) ",
    bakery_email: "hello@AMiROHbakery.com",
    primary_color: "#92400E",
    secondary_color: "#F59E0B",
    background_color: "#FEF7ED",
    accent_color: "#FBBF24",
    text_color: "#374151",
    font_family: "Inter",
    font_size: 16
};

// If you have server-rendered menu items, prefer them; otherwise use this local fallback.
const menuData = [
    { id: 1, name: "Signature Chocolate Cake", price: 32.99, category: "cakes", emoji: "🍰", description: "Rich, moist chocolate layers with premium Belgian chocolate ganache and fresh berries" },
    { id: 2, name: "Red Velvet Delight", price: 29.99, category: "cakes", emoji: "❤️", description: "Classic red velvet with cream cheese frosting and delicate vanilla notes" },
    { id: 3, name: "Lemon Blueberry Cake", price: 27.99, category: "cakes", emoji: "🍋", description: "Zesty lemon cake with fresh blueberries and lemon cream frosting" },
    { id: 4, name: "Carrot Spice Cake", price: 28.99, category: "cakes", emoji: "🥕", description: "Moist carrot cake with warm spices, walnuts, and cream cheese frosting" },
    { id: 5, name: "AMiROH Croissants", price: 4.50, category: "pastries", emoji: "🥐", description: "Buttery, flaky pastries made with French technique and European butter" },
    { id: 6, name: "Pain au Chocolat", price: 5.25, category: "pastries", emoji: "🍫", description: "Buttery croissant dough filled with premium dark chocolate" },
    { id: 7, name: "Apple Cinnamon Danish", price: 5.75, category: "pastries", emoji: "🍎", description: "Flaky pastry with spiced apples, cinnamon, and vanilla glaze" },
    { id: 8, name: "Almond Croissant", price: 5.99, category: "pastries", emoji: "🌰", description: "Croissant filled with almond cream and topped with sliced almonds" },
    { id: 9, name: "Sourdough Bread", price: 7.99, category: "bread", emoji: "🍞", description: "Traditional sourdough with perfect crust and tangy flavor, fermented for 24 hours" },
    { id: 10, name: "Whole Grain AMiROH", price: 8.50, category: "bread", emoji: "🌾", description: "Hearty multigrain bread with seeds and ancient grains" },
    { id: 11, name: "French Baguette", price: 5.50, category: "bread", emoji: "🥖", description: "Crispy crust, airy interior, authentic French technique" },
    { id: 12, name: "Cinnamon Swirl Bread", price: 9.25, category: "bread", emoji: "🍞", description: "Sweet bread with cinnamon swirl and raisins, perfect for toast" },
    { id: 13, name: "AMiROH Coffee Blend", price: 3.99, category: "drinks", emoji: "☕", description: "Rich, aromatic coffee blend roasted to perfection" },
    { id: 14, name: "Premium Hot Chocolate", price: 4.99, category: "drinks", emoji: "🍫", description: "Creamy hot chocolate made with Belgian chocolate and whipped cream" },
    { id: 15, name: "Chai Spice Latte", price: 4.75, category: "drinks", emoji: "🫖", description: "Warming spiced chai tea with steamed milk and honey" },
    { id: 16, name: "Fresh Orange Juice", price: 4.25, category: "drinks", emoji: "🍊", description: "Freshly squeezed orange juice, no additives" }
];

/* =======================================================
   2. State (shared)
   ======================================================= */
let menuItems = [...menuData]; // Will be replaced if server or SDK provides items
let cart = JSON.parse(localStorage.getItem('cart')) || []; // { id, quantity, name, price, emoji }
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let reviews = [];
let users = [];
let orders = [];
let currentFilter = 'all';
let currentRating = 0;

/* =======================================================
   3. Data SDK handler (if you use the provided window.dataSdk)
   ======================================================= */
const dataHandler = {
  onDataChanged(data) {
    reviews = data.filter(item => item.type === 'review');
    users = data.filter(item => item.type === 'user');
    orders = data.filter(item => item.type === 'order');
    // If the SDK provides menu items stored as type 'menu', map them:
    const sdkMenu = data.filter(i => i.type === 'menu');
    if (sdkMenu.length) {
      // Convert SDK items to local menuItems (assumes structure)
      menuItems = sdkMenu.map(m => ({
        id: Number(m.id) || m.id,
        name: m.name || m.title || `Item ${m.id}`,
        price: Number(m.price) || 0,
        category: m.category || 'other',
        description: m.description || '',
        emoji: m.emoji || '🍪'
      }));
      renderMenu();
    }
    renderReviews();
    if (currentUser) updateAccountPage();
  }
};

/* =======================================================
   4. Element SDK helpers (rendering, capabilities)
   ======================================================= */
async function render(config) {
  const cfg = config || defaultConfig;
  const customFont = cfg.font_family || defaultConfig.font_family;
  const baseSize = cfg.font_size || defaultConfig.font_size;
  const baseFontStack = 'Inter, sans-serif';

  document.getElementById('nav-bakery-name') && (document.getElementById('nav-bakery-name').textContent = cfg.bakery_name || defaultConfig.bakery_name);
  document.getElementById('hero-title') && (document.getElementById('hero-title').textContent = cfg.hero_title || defaultConfig.hero_title);
  document.getElementById('hero-subtitle') && (document.getElementById('hero-subtitle').textContent = cfg.hero_subtitle || defaultConfig.hero_subtitle);
  document.getElementById('promo-text') && (document.getElementById('promo-text').textContent = cfg.promo_text || defaultConfig.promo_text);
  document.getElementById('bakery-address') && (document.getElementById('bakery-address').textContent = cfg.bakery_address || defaultConfig.bakery_address);
  document.getElementById('bakery-phone') && (document.getElementById('bakery-phone').textContent = `Phone: ${cfg.bakery_phone || defaultConfig.bakery_phone}`);
  document.getElementById('bakery-email') && (document.getElementById('bakery-email').textContent = `Email: ${cfg.bakery_email || defaultConfig.bakery_email}`);

  const primaryColor = cfg.primary_color || defaultConfig.primary_color;
  const backgroundColor = cfg.background_color || defaultConfig.background_color;
  const textColor = cfg.text_color || defaultConfig.text_color;

  document.body.style.backgroundColor = backgroundColor;
  document.body.style.color = textColor;
  document.body.style.fontFamily = `${customFont}, ${baseFontStack}`;

  document.querySelectorAll('h1').forEach(el => el.style.fontSize = `${baseSize * 3}px`);
  document.querySelectorAll('h2').forEach(el => el.style.fontSize = `${baseSize * 2.25}px`);
  document.querySelectorAll('h3').forEach(el => el.style.fontSize = `${baseSize * 1.75}px`);
}

function mapToCapabilities(config) {
  return {
    recolorables: [
      {
        get: () => config.primary_color || defaultConfig.primary_color,
        set: (value) => window.elementSdk && window.elementSdk.setConfig({ primary_color: value })
      },
      {
        get: () => config.secondary_color || defaultConfig.secondary_color,
        set: (value) => window.elementSdk && window.elementSdk.setConfig({ secondary_color: value })
      },
      {
        get: () => config.background_color || defaultConfig.background_color,
        set: (value) => window.elementSdk && window.elementSdk.setConfig({ background_color: value })
      },
      {
        get: () => config.accent_color || defaultConfig.accent_color,
        set: (value) => window.elementSdk && window.elementSdk.setConfig({ accent_color: value })
      },
      {
        get: () => config.text_color || defaultConfig.text_color,
        set: (value) => window.elementSdk && window.elementSdk.setConfig({ text_color: value })
      }
    ],
    borderables: [],
    fontEditable: {
      get: () => config.font_family || defaultConfig.font_family,
      set: (value) => window.elementSdk && window.elementSdk.setConfig({ font_family: value })
    },
    fontSizeable: {
      get: () => config.font_size || defaultConfig.font_size,
      set: (value) => window.elementSdk && window.elementSdk.setConfig({ font_size: value })
    }
  };
}

function mapToEditPanelValues(config) {
  return new Map([
    ["bakery_name", config.bakery_name || defaultConfig.bakery_name],
    ["hero_title", config.hero_title || defaultConfig.hero_title],
    ["hero_subtitle", config.hero_subtitle || defaultConfig.hero_subtitle],
    ["promo_text", config.promo_text || defaultConfig.promo_text],
    ["bakery_address", config.bakery_address || defaultConfig.bakery_address],
    ["bakery_phone", config.bakery_phone || defaultConfig.bakery_phone],
    ["bakery_email", config.bakery_email || defaultConfig.bakery_email]
  ]);
}

/* =======================================================
   5. Menu rendering & filtering
   ======================================================= */
function renderMenu() {
  const menuGrid = document.getElementById('menu-grid');
  if (!menuGrid) return;
  const filteredItems = currentFilter === 'all' ? menuItems : menuItems.filter(item => item.category === currentFilter);

  menuGrid.innerHTML = filteredItems.map(item => `
    <div class="product-card bg-white rounded-2xl shadow-bakery overflow-hidden">
      <div class="h-64 bg-gradient-to-br from-yellow-100 to-orange-100 flex items-center justify-center">
        <span class="text-8xl">${item.emoji || '🍪'}</span>
      </div>
      <div class="p-6">
        <h3 class="text-2xl font-playfair font-semibold text-bakery-brown mb-3">${item.name}</h3>
        <p class="text-gray-600 mb-4 text-lg">${item.description || ''}</p>
        <div class="flex justify-between items-center">
          <span class="text-3xl font-bold text-bakery-brown">$${(Number(item.price) || 0).toFixed(2)}</span>
          <button onclick="addToCart(${item.id})" class="btn-secondary text-white px-6 py-3 rounded-lg font-medium text-lg">Add to Cart</button>
        </div>
      </div>
    </div>
  `).join('');
}

function filterMenu(category, event) {
  currentFilter = category;
  // Toggle UI active class for filter buttons if provided
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active', 'bg-bakery-brown', 'text-white');
    btn.classList.add('bg-white', 'text-bakery-brown', 'border-2', 'border-bakery-brown');
  });
  if (event && event.target) {
    event.target.classList.remove('bg-white', 'text-bakery-brown', 'border-2', 'border-bakery-brown');
    event.target.classList.add('active', 'bg-bakery-brown', 'text-white');
  }
  renderMenu();
}

/* =======================================================
   6. Cart functions (Django-friendly: use itemId; falls back to menuData)
   ======================================================= */
function persistCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}
function findMenuItem(id) {
  return menuItems.find(i => Number(i.id) === Number(id));
}

function addToCart(itemId) {
  // Try to find menu item for name/price/emoji; if not present, create minimal stub
  const menuItem = findMenuItem(itemId) || null;
  const existing = cart.find(ci => Number(ci.id) === Number(itemId));
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: itemId,
      quantity: 1,
      name: menuItem ? menuItem.name : `Item ${itemId}`,
      price: menuItem ? Number(menuItem.price) : 0,
      emoji: menuItem ? (menuItem.emoji || '🍪') : '🍪'
    });
  }
  persistCart();
  updateCartDisplay();
  showToast('Item added to cart!', 'success');
}

function removeFromCart(index) {
  cart.splice(index, 1);
  persistCart();
  updateCartDisplay();
  renderCart();
}

function updateQuantity(index, change) {
  cart[index].quantity += change;
  if (cart[index].quantity <= 0) {
    removeFromCart(index);
  } else {
    persistCart();
    updateCartDisplay();
    renderCart();
  }
}

function updateCartDisplay() {
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartBadge = document.getElementById('cart-badge');
  const mobileCartCount = document.getElementById('mobile-cart-count');

  if (cartBadge) {
    if (cartCount > 0) { cartBadge.textContent = cartCount; cartBadge.classList.remove('hidden'); }
    else { cartBadge.classList.add('hidden'); }
  }
  if (mobileCartCount) mobileCartCount.textContent = cartCount > 0 ? cartCount : '0';
  renderCart();
}

function renderCart() {
  const cartItemsContainer = document.getElementById('cart-items') || document.getElementById('cart-container');
  const emptyCart = document.getElementById('empty-cart');
  const checkoutSection = document.getElementById('checkout-section');

  if (!cartItemsContainer) return;

  if (cart.length === 0) {
    if (cartItemsContainer) cartItemsContainer.innerHTML = '<div class="text-center py-8 text-gray-600">Your cart is empty.</div>';
    if (emptyCart) emptyCart.classList.remove('hidden');
    if (checkoutSection) checkoutSection.classList.add('hidden');
    return;
  }

  if (emptyCart) emptyCart.classList.add('hidden');
  if (checkoutSection) checkoutSection.classList.remove('hidden');

  const total = cart.reduce((sum, item) => sum + ((Number(item.price) || 10) * item.quantity), 0);

  cartItemsContainer.innerHTML = cart.map((item, index) => `
    <div class="bg-white rounded-2xl shadow-bakery p-6 flex items-center justify-between mb-4">
      <div class="flex items-center space-x-4">
        <span class="text-4xl">${item.emoji || '🍪'}</span>
        <div>
          <h3 class="text-xl font-semibold text-bakery-brown">${item.name}</h3>
          <p class="text-gray-600">$${(Number(item.price) || 0).toFixed(2)} each</p>
        </div>
      </div>
      <div class="flex items-center space-x-6">
        <div class="flex items-center space-x-3">
          <button onclick="updateQuantity(${index}, -1)" class="bg-gray-200 text-gray-700 w-10 h-10 rounded-full hover:bg-gray-300 font-bold text-lg">-</button>
          <span class="font-bold text-xl w-8 text-center">${item.quantity}</span>
          <button onclick="updateQuantity(${index}, 1)" class="bg-gray-200 text-gray-700 w-10 h-10 rounded-full hover:bg-gray-300 font-bold text-lg">+</button>
        </div>
        <span class="font-bold text-bakery-brown text-xl">$${((Number(item.price) || 0) * item.quantity).toFixed(2)}</span>
        <button onclick="removeFromCart(${index})" class="text-red-500 hover:text-red-700 text-2xl">🗑️</button>
      </div>
    </div>
  `).join('');

  cartItemsContainer.innerHTML += `<div class="text-right text-2xl font-bold mt-4">Total: $${total.toFixed(2)}</div>`;
}

/* =======================================================
   7. Reviews & Rating UI
   ======================================================= */
function updateStarDisplay(rating) {
  const stars = document.querySelectorAll('.star');
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

function renderReviews() {
  const reviewsContainer = document.getElementById('reviews-container');
  if (!reviewsContainer) return;
  if (reviews.length === 0) {
    reviewsContainer.innerHTML = `
      <div class="col-span-full text-center py-20">
        <div class="text-8xl mb-6">⭐</div>
        <h2 class="text-3xl font-playfair text-gray-600 mb-4">No reviews yet</h2>
        <p class="text-xl text-gray-500">Be the first to share your experience!</p>
      </div>`;
    return;
  }
  reviewsContainer.innerHTML = reviews.map(review => `
    <div class="bg-white rounded-2xl shadow-bakery p-8 mb-4">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-xl font-semibold text-bakery-brown">${review.name}</h3>
        <div class="flex">
          ${Array.from({length: 5}, (_, i) => `<span class="${i < review.rating ? 'star-rating' : 'text-gray-300'} text-2xl">★</span>`).join('')}
        </div>
      </div>
      <p class="text-gray-600 mb-6 text-lg leading-relaxed">${review.comment}</p>
      <p class="text-sm text-gray-400">${new Date(review.date).toLocaleDateString()}</p>
    </div>
  `).join('');
}

/* =======================================================
   8. Authentication & Account UI
   ======================================================= */
function updateUserInterface() {
  const userMenu = document.getElementById('user-menu');
  const authButtons = document.getElementById('auth-buttons');
  const userName = document.getElementById('user-name');

  if (currentUser) {
    userMenu && userMenu.classList.remove('hidden');
    authButtons && authButtons.classList.add('hidden');
    userName && (userName.textContent = `Welcome, ${currentUser.name}!`);
  } else {
    userMenu && userMenu.classList.add('hidden');
    authButtons && authButtons.classList.remove('hidden');
  }
}

function logout() {
  currentUser = null;
  localStorage.removeItem('currentUser');
  updateUserInterface();
  showToast('Logged out successfully', 'success');
  showPage('home');
}

function updateAccountPage() {
  if (!currentUser) return;
  const profileInfo = document.getElementById('profile-info');
  const orderHistory = document.getElementById('order-history');

  if (profileInfo) {
    profileInfo.innerHTML = `
      <div class="space-y-3">
        <div class="flex justify-between py-2 border-b border-gray-100">
          <span class="font-medium text-gray-700">Name:</span>
          <span class="text-bakery-brown">${currentUser.name}</span>
        </div>
        <div class="flex justify-between py-2 border-b border-gray-100">
          <span class="font-medium text-gray-700">Email:</span>
          <span class="text-bakery-brown">${currentUser.email}</span>
        </div>
        <div class="flex justify-between py-2">
          <span class="font-medium text-gray-700">Member Since:</span>
          <span class="text-bakery-brown">${new Date(currentUser.date).toLocaleDateString()}</span>
        </div>
      </div>`;
  }

  const userOrders = orders.filter(order => order.customer_email === currentUser.email);
  if (orderHistory) {
    if (userOrders.length === 0) {
      orderHistory.innerHTML = `<div class="text-center py-8"><div class="text-4xl mb-3">📦</div><p class="text-gray-600">No orders yet</p></div>`;
    } else {
      orderHistory.innerHTML = userOrders.map(order => `
        <div class="border border-gray-200 rounded-lg p-4 mb-3">
          <div class="flex justify-between items-start mb-2">
            <span class="font-medium text-bakery-brown">Order #${String(order.id).slice(-6)}</span>
            <span class="text-sm text-gray-500">${new Date(order.date).toLocaleDateString()}</span>
          </div>
          <p class="text-gray-600 text-sm mb-2">${JSON.parse(order.order_items).length} items</p>
          <div class="flex justify-between items-center">
            <span class="font-bold text-bakery-brown">$${Number(order.order_total).toFixed(2)}</span>
            <span class="text-sm px-2 py-1 bg-green-100 text-green-800 rounded">${order.order_status || 'Processing'}</span>
          </div>
        </div>
      `).join('');
    }
  }
}

/* =======================================================
   9. Forms handlers (use dataSdk if present; otherwise fallback)
   ======================================================= */
async function handleNewsletterSubmit(e) {
  e.preventDefault && e.preventDefault();
  const email = document.getElementById('newsletter-email')?.value;
  if (window.dataSdk) {
    const result = await window.dataSdk.create({ id: Date.now().toString(), type: 'newsletter', newsletter_email: email, date: new Date().toISOString() });
    if (result.isOk) { showToast('Thank you for subscribing!', 'success'); document.getElementById('newsletter-form')?.reset(); }
    else showToast('Subscription failed. Please try again.', 'error');
  } else {
    // fallback: simple local storage + allow normal submit flow
    showToast('Subscribed (local fallback)', 'success');
    document.getElementById('newsletter-form')?.reset();
  }
}

async function handleReviewSubmit(e) {
  e.preventDefault && e.preventDefault();
  if (currentRating === 0) { showToast('Please select a rating', 'error'); return; }
  const name = document.getElementById('review-name')?.value;
  const email = document.getElementById('review-email')?.value;
  const comment = document.getElementById('review-comment')?.value;

  const submitBtn = document.getElementById('review-btn-text');
  const spinner = document.getElementById('review-spinner');
  submitBtn && submitBtn.classList.add('hidden');
  spinner && spinner.classList.remove('hidden');

  if (window.dataSdk) {
    const result = await window.dataSdk.create({ id: Date.now().toString(), type: 'review', name, email, rating: currentRating, comment, date: new Date().toISOString() });
    submitBtn && submitBtn.classList.remove('hidden');
    spinner && spinner.classList.add('hidden');
    if (result.isOk) { showToast('Thank you for your review!', 'success'); document.getElementById('review-form')?.reset(); currentRating = 0; updateStarDisplay(0); }
    else showToast('Review submission failed. Please try again.', 'error');
  } else {
    // fallback: push to local reviews and render
    reviews.unshift({ id: Date.now().toString(), type: 'review', name, email, rating: currentRating, comment, date: new Date().toISOString() });
    submitBtn && submitBtn.classList.remove('hidden');
    spinner && spinner.classList.add('hidden');
    showToast('Thank you for your review! (local)', 'success');
    document.getElementById('review-form')?.reset();
    currentRating = 0;
    updateStarDisplay(0);
    renderReviews();
  }
}

async function handleContactSubmit(e) {
  e.preventDefault && e.preventDefault();
  const name = document.getElementById('contact-name')?.value;
  const email = document.getElementById('contact-email')?.value;
  const message = document.getElementById('contact-message')?.value;

  const submitBtn = document.getElementById('contact-btn-text');
  const spinner = document.getElementById('contact-spinner');
  submitBtn && submitBtn.classList.add('hidden');
  spinner && spinner.classList.remove('hidden');

  if (window.dataSdk) {
    const result = await window.dataSdk.create({ id: Date.now().toString(), type: 'contact', contact_name: name, contact_email: email, contact_message: message, date: new Date().toISOString() });
    submitBtn && submitBtn.classList.remove('hidden');
    spinner && spinner.classList.add('hidden');
    if (result.isOk) { showToast('Message sent successfully!', 'success'); document.getElementById('contact-form')?.reset(); }
    else showToast('Message failed to send. Please try again.', 'error');
  } else {
    // fallback: let the server handle the contact form with normal submit; if JS used, just notify local saved.
    submitBtn && submitBtn.classList.remove('hidden');
    spinner && spinner.classList.add('hidden');
    showToast('Message saved locally (fallback)', 'success');
    document.getElementById('contact-form')?.reset();
  }
}

async function handleCheckoutSubmit(e) {
  // ถ้เรียกจากฟอร์มปกติ ให้หยุด default behaviour ก่อน (AJAX flow)
  e && e.preventDefault && e.preventDefault();

  if (!cart || cart.length === 0) {
    showToast('Your cart is empty', 'error');
    return;
  }

  // เตรียมข้อมูล order
  const orderItemsForServer = cart.map(item => ({
    id: item.id,
    name: item.name,
    price: Number(item.price) || 0,
    quantity: Number(item.quantity) || 1
  }));

  const orderData = {
    order_items: orderItemsForServer, // ถ้า server ต้องการ string ให้ใช้ JSON.stringify(orderItemsForServer)
    order_total: orderItemsForServer.reduce((s, i) => s + (i.price * i.quantity), 0),
    customer_name: document.getElementById('customer-name')?.value || '',
    customer_phone: document.getElementById('customer-phone')?.value || '',
    customer_email: document.getElementById('customer-email')?.value || '',
    delivery_type: document.querySelector('input[name="delivery-type"]:checked')?.value || 'pickup',
    delivery_address: document.getElementById('delivery-address')?.value || ''
  };

  // UI: loading state
  const submitBtn = document.getElementById('checkout-btn-text');
  const spinner = document.getElementById('checkout-spinner');
  submitBtn && submitBtn.classList.add('hidden');
  spinner && spinner.classList.remove('hidden');

  // ----- เลือกวิธีส่ง: 1) JSON (แนะนำถ้า view รอ JSON) -----
  try {
    const resp = await fetch('/orders/create/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrftoken
      },
      body: JSON.stringify(orderData)
    });

    // hide loading UI
    submitBtn && submitBtn.classList.remove('hidden');
    spinner && spinner.classList.add('hidden');

    // ตรวจผลลัพธ์
    if (resp.ok) {
      // หากเซิร์ฟเวอร์คืน JSON
      let data = null;
      try { data = await resp.json(); } catch (err) { /* non-json ok response */ }

      // ถ้า server ส่ง { ok: true } หรือ status 200
      const success = data ? (data.ok || resp.status === 200) : (resp.status >= 200 && resp.status < 300);
      if (success) {
        showToast('Order placed successfully!', 'success');
        cart = [];
        persistCart();
        updateCartDisplay();
        document.getElementById('checkout-form')?.reset();
        showPage('home');
      } else {
        // server ตอบ JSON แต่มีปัญหา (เช่น data.ok = false)
        const msg = (data && data.error) || 'Order failed. Please try again.';
        showToast(msg, 'error');
      }
    } else {
      // HTTP error
      let errMsg = `Order failed (status ${resp.status}).`;
      try {
        const errData = await resp.json();
        errMsg = errData.error || errData.message || errMsg;
      } catch (err) { /* no JSON body */ }
      showToast(errMsg, 'error');
    }
    return;
  } catch (err) {
    // Network or fetch error — จะลอง fallback เป็น FormData (บาง Django view รอ form-encoded)
    console.warn('JSON submit failed, trying FormData fallback:', err);
  }

  // ----- Fallback: ส่งแบบ FormData (เหมาะกับ view ที่คาด form POST) -----
  try {
    const fd = new FormData();
    // ถ้า view ต้องการ order_items เป็น JSON string ให้ส่งแบบนี้:
    fd.append('order_items', JSON.stringify(orderItemsForServer));
    fd.append('order_total', orderData.order_total);
    fd.append('customer_name', orderData.customer_name);
    fd.append('customer_phone', orderData.customer_phone);
    fd.append('customer_email', orderData.customer_email);
    fd.append('delivery_type', orderData.delivery_type);
    fd.append('delivery_address', orderData.delivery_address);

    const resp2 = await fetch('/orders/create/', {
      method: 'POST',
      headers: {
        'X-CSRFToken': csrftoken
        // หมายเหตุ: ห้ามตั้ง 'Content-Type' เมื่อใช้ FormData — browser จะตั้ง boundary ให้เอง
      },
      body: fd
    });

    submitBtn && submitBtn.classList.remove('hidden');
    spinner && spinner.classList.add('hidden');

    if (resp2.ok) {
      showToast('Order placed successfully!', 'success');
      cart = [];
      persistCart();
      updateCartDisplay();
      document.getElementById('checkout-form')?.reset();
      showPage('home');
    } else {
      let errMsg = `Order failed (status ${resp2.status}).`;
      try {
        const errData = await resp2.json();
        errMsg = errData.error || errData.message || errMsg;
      } catch (err) {}
      showToast(errMsg, 'error');
    }
  } catch (err) {
    submitBtn && submitBtn.classList.remove('hidden');
    spinner && spinner.classList.add('hidden');
    showToast('Network error. Please try again.', 'error');
    console.error('Checkout fallback error:', err);
  }
}


async function handleLoginSubmit(e) {
  e.preventDefault && e.preventDefault();
  const email = document.getElementById('login-email')?.value;
  const password = document.getElementById('login-password')?.value;

  // Demo logic: allow any login locally, but prefer server auth if available.
  // If you have a Django login endpoint, use fetch POST to /accounts/login/ with CSRF.
  let user = users.find(u => u.email === email);
  if (user || (email && password)) {
    currentUser = user || { name: email.split('@')[0], email: email, date: new Date().toISOString() };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    updateUserInterface();
    hideModal('login');
    showToast('Welcome back!', 'success');
  } else {
    showToast('Invalid credentials', 'error');
  }
}

async function handleRegisterSubmit(e) {
  e.preventDefault && e.preventDefault();
  const name = document.getElementById('register-name')?.value;
  const email = document.getElementById('register-email')?.value;
  const password = document.getElementById('register-password')?.value;

  if (window.dataSdk) {
    const result = await window.dataSdk.create({ id: Date.now().toString(), type: 'user', name, email, password, date: new Date().toISOString() });
    if (result.isOk) {
      currentUser = { name, email, date: new Date().toISOString() };
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      updateUserInterface();
      hideModal('register');
      showToast('Account created successfully!', 'success');
    } else showToast('Registration failed. Please try again.', 'error');
  } else {
    // Fallback: create local user (for demo only). For production, post to Django registration endpoint.
    currentUser = { name, email, date: new Date().toISOString() };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    updateUserInterface();
    hideModal('register');
    showToast('Account created (local)', 'success');
  }
}

/* =======================================================
   10. UI utilities: Toasts, Modals, Pages
   ======================================================= */
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');
  const toastIcon = document.getElementById('toast-icon');
  if (!toast) return;
  toastMessage && (toastMessage.textContent = message);
  if (type === 'error') {
    toast.className = 'toast bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg';
    toastIcon && (toastIcon.textContent = '✗');
  } else {
    toast.className = 'toast bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg';
    toastIcon && (toastIcon.textContent = '✓');
  }
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function showModal(modalId) {
  const modal = document.getElementById(`${modalId}-modal`);
  modal && modal.classList.add('show');
}
function hideModal(modalId) {
  const modal = document.getElementById(`${modalId}-modal`);
  modal && modal.classList.remove('show');
}
function switchModal(fromModal, toModal) {
  hideModal(fromModal);
  setTimeout(() => showModal(toModal), 300);
}
function closePromoBanner() {
  const banner = document.getElementById('promo-banner');
  if (banner) banner.style.display = 'none';
}
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
  const p = document.getElementById(pageId);
  p && p.classList.add('active');
  document.getElementById('mobile-menu') && document.getElementById('mobile-menu').classList.add('hidden');
  window.scrollTo(0, 0);
}

/* =======================================================
   11. Event listeners & init
   ======================================================= */
function setupEventListeners() {
  // Mobile menu
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', () => { document.getElementById('mobile-menu').classList.toggle('hidden'); });

  // Star rating
  document.querySelectorAll('.star').forEach(star => {
    star.addEventListener('click', (e) => {
      currentRating = parseInt(e.target.dataset.rating) || 0;
      document.getElementById('rating-value') && (document.getElementById('rating-value').value = currentRating);
      updateStarDisplay(currentRating);
    });
  });

  // Forms
  document.getElementById('newsletter-form')?.addEventListener('submit', handleNewsletterSubmit);
  document.getElementById('review-form')?.addEventListener('submit', handleReviewSubmit);
  document.getElementById('contact-form')?.addEventListener('submit', handleContactSubmit);
  document.getElementById('checkout-form')?.addEventListener('submit', handleCheckoutSubmit);
  document.getElementById('login-form')?.addEventListener('submit', handleLoginSubmit);
  document.getElementById('register-form')?.addEventListener('submit', handleRegisterSubmit);

  // Delivery type radios show/hide
  document.querySelectorAll('input[name="delivery-type"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const deliverySection = document.getElementById('delivery-address-section');
      if (deliverySection) {
        if (e.target.value === 'delivery') deliverySection.classList.remove('hidden');
        else deliverySection.classList.add('hidden');
      }
    });
  });

  // Modal click outside to close
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('show'); });
  });

  // Checkout - clear the cart on success is handled in the handler
  // If using server-side form submission, use this listener to clear local cart after a successful POST response
  document.getElementById('checkout-form')?.addEventListener('submit', () => { /* optional: leave as-is */ });
}

async function init() {
  // Initialize Data SDK if present
  if (window.dataSdk && typeof window.dataSdk.init === 'function') {
    try {
      const initResult = await window.dataSdk.init(dataHandler);
      if (!initResult.isOk) console.error("Failed to initialize data SDK");
    } catch (err) {
      console.error("dataSdk.init error:", err);
    }
  }

  // Initialize Element SDK if present
  if (window.elementSdk && typeof window.elementSdk.init === 'function') {
    try {
      await window.elementSdk.init({ defaultConfig, render, mapToCapabilities, mapToEditPanelValues });
    } catch (err) {
      console.error("elementSdk.init error:", err);
    }
  } else {
    // apply default render in case elementSdk not present
    render(defaultConfig);
  }

  // If your Django template passed menu JSON into window.SERVED_MENU, prefer that:
  if (window.SERVED_MENU && Array.isArray(window.SERVED_MENU) && window.SERVED_MENU.length) {
    menuItems = window.SERVED_MENU.map(it => ({
      id: it.id, name: it.name, price: Number(it.price) || 0, category: it.category || 'other', emoji: it.emoji || '🍪', description: it.description || ''
    }));
  }

  // initialize menu and ui
  renderMenu();
  setupEventListeners();
  updateCartDisplay();
  renderCart();

  // restore user session if available
  if (currentUser) {
    updateUserInterface();
  }
}

// Auto init when DOM ready
document.addEventListener('DOMContentLoaded', init);

