// Global variables
let currentUser = null;
let categories = [];
let products = [];
let cart = [];
let db = null;

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app...');
    initializeApp();
});

// Initialize the application
function initializeApp() {
    try {
        console.log('Initializing app...');
        
        // Initialize Firebase
        if (typeof firebase !== 'undefined' && firebase.apps.length === 0) {
            console.log('Firebase not initialized, initializing...');
            // Firebase will be initialized by firebase-config.js
        }
        
        // Get database reference
        db = firebase.database();
        console.log('Database reference obtained');
        
        // Setup event listeners
        setupEventListeners();
        
        // Setup authentication state listener
        firebase.auth().onAuthStateChanged(handleAuthStateChange);
        
        // Load initial data
        loadData();
        
        console.log('App initialization complete');
    } catch (error) {
        console.error('Error initializing app:', error);
    }
}

// Setup all event listeners
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Navigation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', handleNavigation);
    });
    
    // Mobile menu toggle
    const menuToggle = document.getElementById('menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleMobileMenu);
    }
    
    // Login modal
    const loginLink = document.getElementById('login-link');
    if (loginLink) {
        loginLink.addEventListener('click', (e) => {
            e.preventDefault();
            openLoginModal();
        });
    }
    
    // Modal close
    const modalClose = document.getElementById('modal-close');
    if (modalClose) {
        modalClose.addEventListener('click', closeLoginModal);
    }
    
    // Close modal when clicking outside
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeLoginModal();
            }
        });
    }
    
    // Auth form switching
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    
    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            showRegisterForm();
        });
    }
    
    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            showLoginForm();
        });
    }
    
    // Auth forms
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Search and filter - CORREZIONE QUI
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    
    if (searchInput) {
        searchInput.addEventListener('input', performSearch);
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', performSearch); // Cambiato da filterByCategory a performSearch
    }
    
        // User menu event listeners
    const userMenu = document.getElementById('user-menu');
    if (userMenu) {
        userMenu.addEventListener('click', (e) => {
            e.preventDefault();
            toggleUserMenu();
        });
    }

    // Orders link
    const ordersLink = document.getElementById('orders-link');
    if (ordersLink) {
        ordersLink.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('ordini');
            loadUserOrders();
            toggleUserMenu(); // Chiudi il dropdown
        });
    }

    // Logout link
    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout();
        });
    }

    // Chiudi dropdown quando si clicca fuori
    document.addEventListener('click', (e) => {
        const userMenu = document.getElementById('user-menu');
        const dropdown = document.getElementById('user-dropdown');
        
        if (userMenu && dropdown && !userMenu.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.add('hidden');
        }
    });
    
    // Checkout
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', handleCheckout);
    }
    
    console.log('Event listeners setup complete');
}

// Handle navigation
function handleNavigation(e) {
    e.preventDefault();
    
    // Controllo sicuro per l'attributo href
    const href = e.target.getAttribute('href');
    if (!href || href === '#' || !href.startsWith('#')) {
        console.log('Invalid href:', href);
        return;
    }
    
    const targetId = href.substring(1);
    if (!targetId) {
        console.log('Empty target ID');
        return;
    }
    
    showSection(targetId);
    
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    e.target.classList.add('active');
}

// Show specific section
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
}

// Toggle mobile menu
function toggleMobileMenu() {
    console.log('Toggle mobile menu called'); // Debug
    const navMenu = document.getElementById('nav-menu');
    if (navMenu) {
        navMenu.classList.toggle('show');
        console.log('Menu classes:', navMenu.className); // Debug
        console.log('Menu display:', window.getComputedStyle(navMenu).display); // Debug
    } else {
        console.log('Nav menu not found!'); // Debug
    }
}

// Modal functions
function openLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.classList.add('show');
        showLoginForm();
    }
}

function closeLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.classList.remove('show');
    }
}

function showLoginForm() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const authTitle = document.getElementById('auth-title');
    
    if (loginForm && registerForm && authTitle) {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        authTitle.textContent = 'Accedi al tuo account';
    }
}

function showRegisterForm() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const authTitle = document.getElementById('auth-title');
    
    if (loginForm && registerForm && authTitle) {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        authTitle.textContent = 'Crea un nuovo account';
    }
}

// Load data from Firebase
// Load data from Firebase - MODIFIED VERSION
function loadData() {
    console.log('Loading data from Firebase...');
    
    if (!db) {
        console.error('Database not initialized');
        return;
    }
    
    // Carica categorie - stesso metodo di admin.js
    db.ref('categories').on('value', (snapshot) => {
        categories = [];
        if (snapshot.exists()) {
            snapshot.forEach((child) => {
                categories.push({
                    id: child.key,
                    ...child.val()
                });
            });
        }
        console.log('Categories loaded:', categories.length);
        renderCategories();
        updateCategoryFilter();
    }, (error) => {
        console.error('Error loading categories:', error);
    });
    
    // Carica prodotti - stesso metodo di admin.js
    db.ref('products').on('value', (snapshot) => {
        products = [];
        if (snapshot.exists()) {
            snapshot.forEach((child) => {
                products.push({
                    id: child.key,
                    ...child.val()
                });
            });
        }
        console.log('Products loaded:', products.length);
        renderProducts();
    }, (error) => {
        console.error('Error loading products:', error);
    });
}

// Render categories
function renderCategories() {
    const container = document.getElementById('categories-grid');
    if (!container) {
        console.error('Categories container not found');
        return;
    }
    
    console.log('Rendering categories:', categories.length);
    
    if (categories.length === 0) {
        container.innerHTML = '<p class="empty-state">Nessuna categoria disponibile</p>';
        return;
    }
    
    container.innerHTML = categories.map(category => `
        <div class="category-card" onclick="filterByCategory('${category.id}')">
            <img src="${category.image}" alt="${category.name}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjZjVmNWY1Ii8+Cjx0ZXh0IHg9IjQwIiB5PSI0NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5Ij7wn5OKCZ0ZXh0Pgo8L3N2Zz4K'">
            <h3>${category.name}</h3>
            <p>${category.description || ''}</p>
        </div>
    `).join('');
}

// Update category filter dropdown
function updateCategoryFilter() {
    const select = document.getElementById('category-filter');
    if (!select) return;
    
    select.innerHTML = '<option value="">Tutte le categorie</option>' +
        categories.map(category => 
            `<option value="${category.id}">${category.name}</option>`
        ).join('');
}

// Render products
function renderProducts(filteredProducts = null) {
    const container = document.getElementById('products-grid');
    if (!container) {
        console.error('Products container not found');
        return;
    }
    
    const productsToRender = filteredProducts || products;
    console.log('Rendering products:', productsToRender.length);
    
    if (productsToRender.length === 0) {
        container.innerHTML = '<p class="empty-state">Nessun prodotto disponibile</p>';
        return;
    }
    
    container.innerHTML = productsToRender.map(product => {
        const isUnavailable = !product.available;
        return `
            <div class="product-card ${isUnavailable ? 'unavailable' : ''}">
                <img src="${product.image}" alt="${product.name}" class="product-image" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDI4MCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyODAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZjVmNWY1Ii8+Cjx0ZXh0IHg9IjE0MCIgeT0iMTA1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTkiPvCfk4o8L3RleHQ+Cjwvc3ZnPgo='">
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-price">€${product.price.toFixed(2)}${product.unit ? '/' + product.unit : ''}</p>
                    <p class="product-description">${product.description || ''}</p>
                    <button class="add-to-cart" onclick="addToCart('${product.id}')" ${isUnavailable ? 'disabled' : ''}>
                        ${isUnavailable ? 'Non Disponibile' : 'Aggiungi al Carrello'}
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Search functionality
function performSearch() {
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    
    if (!searchInput || !categoryFilter) {
        console.error('Search elements not found');
        return;
    }
    
    const searchTerm = searchInput.value.toLowerCase();
    const categoryFilterValue = categoryFilter.value;
    
    let filteredProducts = products;
    
    // Filter by search term
    if (searchTerm) {
        filteredProducts = filteredProducts.filter(product => 
            product.name.toLowerCase().includes(searchTerm) ||
            (product.description && product.description.toLowerCase().includes(searchTerm))
        );
    }
    
    // Filter by category
    if (categoryFilterValue) {
        filteredProducts = filteredProducts.filter(product => 
            product.categoryId === categoryFilterValue
        );
    }
    
    console.log('Filtered products:', filteredProducts.length);
    renderProducts(filteredProducts);
}

// Filter by category
function filterByCategory(categoryId) {
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.value = categoryId || '';
    }
    
    // Show products section
    showSection('prodotti');
    
    // Update active nav
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector('a[href="#prodotti"]').classList.add('active');
    
    // Perform search with current filters
    performSearch();
}

// Cart functions
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }
    
    updateCartUI();
    console.log('Product added to cart:', product.name);
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartUI();
}

function updateQuantity(productId, newQuantity) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        if (newQuantity <= 0) {
            removeFromCart(productId);
        } else {
            item.quantity = newQuantity;
            updateCartUI();
        }
    }
}

function updateCartUI() {
    // Update cart count in navigation
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
    }
    
    // Update cart content
    const cartContent = document.getElementById('cart-content');
    const cartSummary = document.getElementById('cart-summary');
    
    if (!cartContent) return;
    
    if (cart.length === 0) {
        cartContent.innerHTML = `
            <div class="empty-state">
                <p>Il tuo carrello è vuoto</p>
                <p>Aggiungi alcuni prodotti per iniziare!</p>
            </div>
        `;
        if (cartSummary) cartSummary.classList.add('hidden');
    } else {
        cartContent.innerHTML = cart.map(item => `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjZjVmNWY1Ii8+Cjx0ZXh0IHg9IjQwIiB5PSI0NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5Ij7wn5OKCZ0ZXh0Pgo8L3N2Zz4K'">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">€${item.price.toFixed(2)}${item.unit ? '/' + item.unit : ''}</div>
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="updateQuantity('${item.id}', ${item.quantity - 1})">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
                    </div>
                </div>
                <button class="remove-item" onclick="removeFromCart('${item.id}')">Rimuovi</button>
            </div>
        `).join('');
        
        // Update total
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const cartTotal = document.getElementById('cart-total');
        if (cartTotal) {
            cartTotal.textContent = `Totale: €${total.toFixed(2)}`;
        }
        
        if (cartSummary) cartSummary.classList.remove('hidden');
    }
}

// Authentication functions
function handleAuthStateChange(user) {
    console.log('Auth state changed:', user ? 'logged in' : 'logged out');
    currentUser = user;
    updateUserUI();
}

function updateUserUI() {
    const loginLink = document.getElementById('login-link');
    const userMenu = document.getElementById('user-menu');
    const userName = document.getElementById('user-name');
    const adminLink = document.getElementById('admin-link');
    
    if (currentUser) {
        // User is logged in
        if (loginLink) loginLink.classList.add('hidden');
        if (userMenu) userMenu.classList.remove('hidden');
        if (userName) userName.textContent = currentUser.displayName || currentUser.email;
        
        // Show admin link for admin users
        if (adminLink && currentUser.email === 'admin@mirellaortofrutta.it') {
            adminLink.classList.remove('hidden');
        }
    } else {
        // User is logged out
        if (loginLink) loginLink.classList.remove('hidden');
        if (userMenu) userMenu.classList.add('hidden');
        if (adminLink) adminLink.classList.add('hidden');
    }
}

function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    console.log('Attempting login for:', email);
    
    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log('Login successful:', userCredential.user.email);
            closeLoginModal();
            showMessage('Login effettuato con successo!', 'success');
        })
        .catch((error) => {
            console.error('Login error:', error);
            showMessage('Errore durante il login: ' + error.message, 'error');
        });
}

function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const phone = document.getElementById('register-phone').value;
    const address = document.getElementById('register-address').value;
    
    console.log('Attempting registration for:', email);
    
    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log('Registration successful:', userCredential.user.email);
            
            // Update user profile
            return userCredential.user.updateProfile({
                displayName: name
            }).then(() => {
                // Save additional user data
                return db.ref('users/' + userCredential.user.uid).set({
                    name: name,
                    email: email,
                    phone: phone,
                    address: address,
                    createdAt: new Date().toISOString()
                });
            });
        })
        .then(() => {
            closeLoginModal();
            showMessage('Registrazione completata con successo!', 'success');
        })
        .catch((error) => {
            console.error('Registration error:', error);
            showMessage('Errore durante la registrazione: ' + error.message, 'error');
        });
}

function handleLogout() {
    firebase.auth().signOut()
        .then(() => {
            console.log('Logout successful');
            showMessage('Logout effettuato con successo!', 'success');
        })
        .catch((error) => {
            console.error('Logout error:', error);
            showMessage('Errore durante il logout: ' + error.message, 'error');
        });
}

function toggleUserMenu() {
    const dropdown = document.getElementById('user-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('hidden');
    }
}

// Checkout function
function handleCheckout() {
    if (!currentUser) {
        showMessage('Devi effettuare il login per procedere al checkout', 'error');
        openLoginModal();
        return;
    }
    
    if (cart.length === 0) {
        showMessage('Il carrello è vuoto', 'error');
        return;
    }
    
    // Create order with structure expected by admin.js
    const order = {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        items: cart,
        totalAmount: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0), // Cambiato da 'total' a 'totalAmount'
        status: 'pending',
        createdAt: firebase.database.ServerValue.TIMESTAMP, // Usa timestamp di Firebase invece di ISO string
        pickupDate: 'Da definire' // Aggiungi campo pickupDate
    };
    
    // Save order to Firebase
    db.ref('orders').push(order)
        .then(() => {
            console.log('Order created successfully');
            
            // Salva anche i dati del cliente per admin.js
            const userData = {
                name: currentUser.displayName || 'Nome non disponibile',
                email: currentUser.email,
                phone: 'N/A', // Potresti aggiungere un campo per il telefono nel form di registrazione
                address: 'N/A' // Potresti aggiungere un campo per l'indirizzo
            };
            
            // Salva i dati utente se non esistono già
            db.ref(`users/${currentUser.uid}`).once('value')
                .then(snapshot => {
                    if (!snapshot.exists()) {
                        return db.ref(`users/${currentUser.uid}`).set(userData);
                    }
                })
                .catch(error => {
                    console.error('Error saving user data:', error);
                });
            
            cart = [];
            updateCartUI();
            showMessage('Ordine inviato con successo! Ti contatteremo presto.', 'success');
        })
        .catch((error) => {
            console.error('Error creating order:', error);
            showMessage('Errore durante l\'invio dell\'ordine: ' + error.message, 'error');
        });
}

// Show message function
function showMessage(text, type = 'info') {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create new message
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    
    // Insert at top of main content
    const main = document.querySelector('main');
    if (main) {
        main.insertBefore(message, main.firstChild);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (message.parentNode) {
                message.remove();
            }
        }, 5000);
    }
}

// Initialize sample data if Firebase is empty
function initializeSampleData() {
    console.log('Initializing sample data...');
    
    const sampleCategories = [
        {
            id: 'frutta',
            name: 'Frutta',
            description: 'Frutta fresca di stagione',
            image: 'immagini/FruttaCopilot_20250906_124031.png'
        },
        {
            id: 'verdura',
            name: 'Verdura',
            description: 'Verdure fresche dell\'orto',
            image: 'immagini/VerduraCopilot_20250906_124758.png'
        },
        {
            id: 'gastronomia',
            name: 'Gastronomia',
            description: 'Prodotti gastronomici artigianali',
            image: 'immagini/GastronomiaCopilot_20250906_125746.png'
        },
        {
            id: 'varie',
            name: 'Varie',
            description: 'Altri prodotti selezionati',
            image: 'immagini/VarieCopilot_20250906_142429.png'
        }
    ];
    
    const sampleProducts = [
        {
            id: 'pomodoro-occhio-bue',
            name: 'Pomodoro Occhio di Bue',
            categoryId: 'verdura',
            price: 3.50,
            unit: 'kg',
            description: 'Pomodori grandi e saporiti, perfetti per insalate',
            image: 'immagini/PomodoroOcchioBueCopilot_20250906_151807.png',
            available: true
        },
        {
            id: 'melanzane-nere',
            name: 'Melanzane Nere',
            categoryId: 'verdura',
            price: 2.80,
            unit: 'kg',
            description: 'Melanzane nere lucide, ideali per ogni preparazione',
            image: 'immagini/MelanzaneNereCopilot_20250906_154038.png',
            available: true
        },
        {
            id: 'insalata-lattuga',
            name: 'Insalata Lattuga',
            categoryId: 'verdura',
            price: 1.50,
            unit: 'cespo',
            description: 'Lattuga fresca e croccante',
            image: 'immagini/InsalataLattugaOriCopilot_20250906_152254.png',
            available: true
        }
    ];
    
    // Set sample data
    categories = sampleCategories;
    products = sampleProducts;
    
    // Render the data
    renderCategories();
    updateCategoryFilter();
    renderProducts();
    
    console.log('Sample data initialized');
    
    // Save to Firebase if available
    if (db) {
        const updates = {};
        sampleCategories.forEach(category => {
            updates[`categories/${category.id}`] = category;
        });
        sampleProducts.forEach(product => {
            updates[`products/${product.id}`] = product;
        });
        
        db.ref().update(updates)
            .then(() => console.log('Sample data saved to Firebase'))
            .catch(error => console.error('Error saving sample data:', error));
    }
}

// Render products - UPDATED to handle stock field
function renderProducts(filteredProducts = null) {
    const container = document.getElementById('products-grid');
    if (!container) {
        console.error('Products container not found');
        return;
    }
    
    const productsToRender = filteredProducts || products;
    console.log('Rendering products:', productsToRender.length);
    
    if (productsToRender.length === 0) {
        container.innerHTML = '<p class="empty-state">Nessun prodotto disponibile</p>';
        return;
    }
    
    container.innerHTML = productsToRender.map(product => {
        // Check availability based on stock field from database
        const isUnavailable = !product.stock || product.stock <= 0;
        const stockText = product.stock ? `(${product.stock} disponibili)` : '';
        
        return `
            <div class="product-card ${isUnavailable ? 'unavailable' : ''}">
                <img src="${product.image}" alt="${product.name}" class="product-image" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDI4MCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyODAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZjVmNWY1Ii8+Cjx0ZXh0IHg9IjE0MCIgeT0iMTA1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTkiPvCfk4o8L3RleHQ+Cjwvc3ZnPgo='">
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-price">€${product.price.toFixed(2)}${product.unit ? '/' + product.unit : ''}</p>
                    <p class="product-description">${product.description || ''}</p>
                    <p class="product-stock">${stockText}</p>
                    <button class="add-to-cart" onclick="addToCart('${product.id}')" ${isUnavailable ? 'disabled' : ''}>
                        ${isUnavailable ? 'Non Disponibile' : 'Aggiungi al Carrello'}
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Carica gli ordini dell'utente corrente
function loadUserOrders() {
    if (!currentUser) {
        console.log('Nessun utente loggato');
        return;
    }

    console.log('Caricamento ordini per utente:', currentUser.uid);
    
    db.ref('orders').orderByChild('userId').equalTo(currentUser.uid)
        .once('value')
        .then(snapshot => {
            const orders = [];
            snapshot.forEach(childSnapshot => {
                const order = {
                    id: childSnapshot.key,
                    ...childSnapshot.val()
                };
                orders.push(order);
            });
            
            // Ordina per data (più recenti prima)
            orders.sort((a, b) => {
                const dateA = a.createdAt || 0;
                const dateB = b.createdAt || 0;
                return dateB - dateA;
            });
            
            renderUserOrders(orders);
        })
        .catch(error => {
            console.error('Errore nel caricamento degli ordini:', error);
            showMessage('Errore nel caricamento degli ordini', 'error');
        });
}

// Visualizza gli ordini dell'utente
function renderUserOrders(orders) {
    const ordersContent = document.getElementById('orders-content');
    if (!ordersContent) return;

    if (orders.length === 0) {
        ordersContent.innerHTML = `
            <div class="empty-state">
                <p>Non hai ancora effettuato ordini</p>
                <p>Vai alla sezione prodotti per iniziare!</p>
            </div>
        `;
        return;
    }

    const ordersHTML = orders.map(order => {
        const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('it-IT') : 'Data non disponibile';
        const statusClass = order.status || 'pending';
        const statusText = {
            'pending': 'In attesa',
            'completed': 'Completato',
            'cancelled': 'Annullato'
        }[statusClass] || 'In attesa';

        const itemsHTML = order.items ? order.items.map(item => `
            <div class="order-item">
                <div>
                    <div class="order-item-name">${item.name}</div>
                    <div class="order-item-details">${item.quantity} x €${item.price.toFixed(2)}</div>
                </div>
                <div>€${(item.quantity * item.price).toFixed(2)}</div>
            </div>
        `).join('') : '<p>Dettagli prodotti non disponibili</p>';

        return `
            <div class="order-card">
                <div class="order-header">
                    <div class="order-id">Ordine #${order.id.substring(0, 8)}</div>
                    <div class="order-date">${orderDate}</div>
                    <div class="order-status ${statusClass}">${statusText}</div>
                </div>
                <div class="order-items">
                    ${itemsHTML}
                </div>
                <div class="order-total">
                    Totale: €${(order.totalAmount || order.total || 0).toFixed(2)}
                </div>
            </div>
        `;
    }).join('');

    ordersContent.innerHTML = ordersHTML;
}
