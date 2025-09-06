// Global variables
let currentUser = null;
let cart = [];
let products = [];
let categories = [];
let filteredProducts = [];

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    loadData();
    
    // Check if user is logged in
    if (window.auth) {
        window.auth.onAuthStateChanged(user => {
            if (user) {
                currentUser = user;
                updateAuthUI(true);
                loadUserProfile();
            } else {
                currentUser = null;
                updateAuthUI(false);
            }
        });
    }
}

function setupEventListeners() {
    // Navigation - esclude il link di autenticazione
    document.querySelectorAll('.nav-menu .nav-link:not(#auth-link)').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            showSection(targetId);
            
            // Update active nav link
            document.querySelectorAll('.nav-link:not(#auth-link)').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Close mobile menu
            document.getElementById('nav-menu').classList.remove('active');
        });
    });

    // Authentication link handler - gestore dedicato
    const authLink = document.getElementById('auth-link');
    if (authLink) {
        authLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentUser) {
                // User is logged in, show user profile or create a dropdown menu
                // Per ora mostriamo una sezione profilo utente
                showUserMenu(e);
            } else {
                // User is not logged in, show login section
                showSection('login');
                // Update active nav link
                document.querySelectorAll('.nav-link:not(#auth-link)').forEach(l => l.classList.remove('active'));
                const loginNavLink = document.querySelector('a[href="#login"]:not(#auth-link)');
                if (loginNavLink) {
                    loginNavLink.classList.add('active');
                }
            }
            // Close mobile menu
            document.getElementById('nav-menu').classList.remove('active');
        });
    }

    // Mobile menu toggle
    const mobileToggle = document.getElementById('mobile-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }

    // Authentication forms
    const loginForm = document.getElementById('login-form-element');
    const registerForm = document.getElementById('register-form-element');
    const showRegister = document.getElementById('show-register');
    const showLogin = document.getElementById('show-login');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    if (showRegister) {
        showRegister.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('login-form').style.display = 'none';
            document.getElementById('register-form').style.display = 'block';
        });
    }
    
    if (showLogin) {
        showLogin.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('register-form').style.display = 'none';
            document.getElementById('login-form').style.display = 'block';
        });
    }

    // Search and filters
    const searchButton = document.getElementById('search-button');
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const priceFilter = document.getElementById('price-filter');

    if (searchButton) {
        searchButton.addEventListener('click', performSearch);
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', () => {
            const selectedCategory = categoryFilter.value;
            filterByCategory(selectedCategory);
        });
    }
    
    if (priceFilter) {
        priceFilter.addEventListener('change', () => {
            performSearch();
        });
    }

    // Cart buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-to-cart')) {
            const productId = e.target.getAttribute('data-product-id');
            addToCart(productId);
        }
        
        if (e.target.classList.contains('remove-from-cart')) {
            const productId = e.target.getAttribute('data-product-id');
            removeFromCart(productId);
        }
        
        if (e.target.classList.contains('quantity-btn')) {
            const productId = e.target.getAttribute('data-product-id');
            const change = e.target.classList.contains('increase') ? 1 : -1;
            updateQuantity(productId, change);
        }
    });

    // CTA button
    const ctaButton = document.getElementById('cta-button');
    if (ctaButton) {
        ctaButton.addEventListener('click', () => {
            showSection('products');
            document.querySelectorAll('.nav-link:not(#auth-link)').forEach(l => l.classList.remove('active'));
            document.querySelector('a[href="#products"]').classList.add('active');
        });
    }

    // Checkout button
    const checkoutButton = document.getElementById('checkout-button');
    if (checkoutButton) {
        checkoutButton.addEventListener('click', handleCheckout);
    }
}

// Nuova funzione per gestire il menu utente
function showUserMenu(event) {
    // Rimuovi eventuali menu esistenti
    const existingMenu = document.querySelector('.user-dropdown');
    if (existingMenu) {
        existingMenu.remove();
        return;
    }

    // Crea il menu dropdown
    const dropdown = document.createElement('div');
    dropdown.className = 'user-dropdown';
    
    // Crea gli elementi del menu
    const profileItem = document.createElement('div');
    profileItem.className = 'user-menu-item';
    profileItem.innerHTML = '<i class="fas fa-user"></i> Profilo';
    profileItem.addEventListener('click', showUserProfile);
    
    const ordersItem = document.createElement('div');
    ordersItem.className = 'user-menu-item';
    ordersItem.innerHTML = '<i class="fas fa-shopping-bag"></i> I miei ordini';
    ordersItem.addEventListener('click', showUserOrders);
    
    const logoutItem = document.createElement('div');
    logoutItem.className = 'user-menu-item';
    logoutItem.innerHTML = '<i class="fas fa-sign-out-alt"></i> Disconnetti';
    logoutItem.addEventListener('click', handleLogout);
    
    // Aggiungi gli elementi al dropdown
    dropdown.appendChild(profileItem);
    dropdown.appendChild(ordersItem);
    dropdown.appendChild(logoutItem);

    // Posiziona il menu
    const authLink = event.target.closest('#auth-link');
    const rect = authLink.getBoundingClientRect();
    dropdown.style.position = 'fixed';
    dropdown.style.top = (rect.bottom + 5) + 'px';
    dropdown.style.right = '20px';
    dropdown.style.zIndex = '1000';

    document.body.appendChild(dropdown);

    // Chiudi il menu se si clicca altrove
    setTimeout(() => {
        document.addEventListener('click', function closeMenu(e) {
            if (!dropdown.contains(e.target) && !authLink.contains(e.target)) {
                dropdown.remove();
                document.removeEventListener('click', closeMenu);
            }
        });
    }, 100);
}

// Funzioni per le opzioni del menu utente
function showUserProfile() {
    // Chiudi il menu
    const dropdown = document.querySelector('.user-dropdown');
    if (dropdown) dropdown.remove();
    
    // Mostra la sezione profilo (se esiste) o crea una sezione temporanea
    showSection('profile');
    // Se non hai una sezione profilo, puoi mostrare i dati utente in un modal
    showMessage(`Benvenuto ${currentUser.displayName || currentUser.email}!`, 'info');
}

function showUserOrders() {
    // Chiudi il menu
    const dropdown = document.querySelector('.user-dropdown');
    if (dropdown) dropdown.remove();
    
    // Mostra gli ordini dell'utente
    showMessage('Funzionalità ordini in sviluppo', 'info');
}

function loadData() {
    if (!window.db) {
        console.error('Database not initialized');
        return;
    }

    // Load categories
    window.db.ref('categories').on('value', (snapshot) => {
        categories = [];
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                categories.push({
                    id: childSnapshot.key,
                    ...childSnapshot.val()
                });
            });
        }
        renderCategories();
        updateCategoryFilter();
    });

    // Load products
    window.db.ref('products').on('value', (snapshot) => {
        products = [];
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                products.push({
                    id: childSnapshot.key,
                    ...childSnapshot.val()
                });
            });
        }
        filteredProducts = [...products];
        renderProducts();
        renderFeaturedProducts();
    });
}

function renderCategories() {
    const categoriesGrid = document.getElementById('categories-grid');
    if (!categoriesGrid) return;

    if (categories.length === 0) {
        categoriesGrid.innerHTML = '<p class="loading">Caricamento categorie...</p>';
        return;
    }

    categoriesGrid.innerHTML = categories.map(category => `
        <div class="category-card" onclick="filterByCategory('${category.id}')">
            <img src="${category.image || 'immagini/VarieCopilot_20250906_142429.png'}" alt="${category.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 10px;">
            <h3>${category.name}</h3>
            <p>${category.description || ''}</p>
        </div>
    `).join('');
}

function renderProducts() {
    const productsGrid = document.getElementById('products-grid');
    if (!productsGrid) return;

    if (filteredProducts.length === 0) {
        productsGrid.innerHTML = '<p class="loading">Nessun prodotto trovato</p>';
        return;
    }

    productsGrid.innerHTML = filteredProducts.map(product => `
        <div class="product-card">
            <img src="${product.image || 'immagini/VarieCopilot_20250906_142429.png'}" alt="${product.name}" class="product-image">
            <div class="product-info">
                <h3>${product.name}</h3>
                <p>${product.description || ''}</p>
                <div class="product-price">€${product.price ? product.price.toFixed(2) : '0.00'}</div>
                <button class="add-to-cart" onclick="addToCart('${product.id}')">
                    <i class="fas fa-cart-plus"></i>
                    Aggiungi al carrello
                </button>
            </div>
        </div>
    `).join('');
}

function renderFeaturedProducts() {
    const featuredGrid = document.getElementById('featured-products');
    if (!featuredGrid) return;

    const featured = products.filter(p => p.featured).slice(0, 3);
    
    if (featured.length === 0) {
        featuredGrid.innerHTML = '<p class="loading">Caricamento prodotti in evidenza...</p>';
        return;
    }

    featuredGrid.innerHTML = featured.map(product => `
        <div class="product-card">
            <img src="${product.image || 'immagini/VarieCopilot_20250906_142429.png'}" alt="${product.name}" class="product-image">
            <div class="product-info">
                <h3>${product.name}</h3>
                <p>${product.description || ''}</p>
                <div class="product-price">€${product.price ? product.price.toFixed(2) : '0.00'}</div>
                <button class="add-to-cart" onclick="addToCart('${product.id}')">
                    <i class="fas fa-cart-plus"></i>
                    Aggiungi al carrello
                </button>
            </div>
        </div>
    `).join('');
}

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
    
    // Update URL
    history.pushState({section: sectionId}, '', `#${sectionId}`);
    
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
        }
    });
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: productId,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1
        });
    }
    
    updateCartUI();
    
    // Show success message
    showMessage('Prodotto aggiunto al carrello!', 'success');
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartUI();
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;
    
    item.quantity += change;
    
    if (item.quantity <= 0) {
        removeFromCart(productId);
    } else {
        updateCartUI();
    }
}

function updateCartUI() {
    // Update cart count
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
    }
    
    // Update cart items
    const cartItems = document.getElementById('cart-items');
    const cartSummary = document.getElementById('cart-summary');
    
    if (!cartItems) return;
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">Il carrello è vuoto</p>';
        if (cartSummary) cartSummary.style.display = 'none';
        return;
    }
    
    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${item.image || 'immagini/VarieCopilot_20250906_142429.png'}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p>€${item.price ? item.price.toFixed(2) : '0.00'} ciascuno</p>
            </div>
            <div class="cart-item-controls">
                <button class="quantity-btn" onclick="updateQuantity('${item.id}', -1)">
                    <i class="fas fa-minus"></i>
                </button>
                <span class="quantity">${item.quantity}</span>
                <button class="quantity-btn" onclick="updateQuantity('${item.id}', 1)">
                    <i class="fas fa-plus"></i>
                </button>
                <button class="remove-btn" onclick="removeFromCart('${item.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="cart-item-price">
                €${((item.price || 0) * item.quantity).toFixed(2)}
            </div>
        </div>
    `).join('');
    
    // Update total
    const total = cart.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
    const cartTotal = document.getElementById('cart-total');
    if (cartTotal) {
        cartTotal.textContent = total.toFixed(2);
    }
    
    if (cartSummary) {
        cartSummary.style.display = 'block';
    }
}

function performSearch() {
    const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
    const categoryFilter = document.getElementById('category-filter')?.value || '';
    const priceFilter = document.getElementById('price-filter')?.value || '';
    
    filteredProducts = products.filter(product => {
        // Text search
        const matchesSearch = !searchTerm || 
            product.name.toLowerCase().includes(searchTerm) ||
            (product.description && product.description.toLowerCase().includes(searchTerm));
        
        // Category filter
        const matchesCategory = !categoryFilter || product.categoryId === categoryFilter;
        
        // Price filter
        let matchesPrice = true;
        if (priceFilter && product.price) {
            const price = product.price;
            switch(priceFilter) {
                case '0-5':
                    matchesPrice = price >= 0 && price <= 5;
                    break;
                case '5-10':
                    matchesPrice = price > 5 && price <= 10;
                    break;
                case '10-20':
                    matchesPrice = price > 10 && price <= 20;
                    break;
                case '20+':
                    matchesPrice = price > 20;
                    break;
            }
        }
        
        return matchesSearch && matchesCategory && matchesPrice;
    });
    
    renderProducts();
}

function filterByCategory(categoryId) {
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.value = categoryId;
        performSearch();
        showSection('products');
        
        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        document.querySelector('a[href="#products"]').classList.add('active');
    }
}

function updateCategoryFilter() {
    const categoryFilter = document.getElementById('category-filter');
    if (!categoryFilter) return;
    
    // Keep existing options and add new ones
    const existingOptions = Array.from(categoryFilter.options).map(opt => opt.value);
    
    categories.forEach(category => {
        if (!existingOptions.includes(category.id)) {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categoryFilter.appendChild(option);
        }
    });
}

function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if (!window.auth) {
        showMessage('Servizio di autenticazione non disponibile', 'error');
        return;
    }
    
    window.auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            showMessage('Accesso effettuato con successo!', 'success');
            showSection('home');
        })
        .catch((error) => {
            showMessage('Errore durante l\'accesso: ' + error.message, 'error');
        });
}

function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    
    if (!window.auth) {
        showMessage('Servizio di autenticazione non disponibile', 'error');
        return;
    }
    
    window.auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Update user profile
            return userCredential.user.updateProfile({
                displayName: name
            });
        })
        .then(() => {
            // Save user data to database
            if (window.db && currentUser) {
                return window.db.ref('users/' + currentUser.uid).set({
                    name: name,
                    email: email,
                    createdAt: new Date().toISOString()
                });
            }
        })
        .then(() => {
            showMessage('Registrazione completata con successo!', 'success');
            showSection('home');
        })
        .catch((error) => {
            showMessage('Errore durante la registrazione: ' + error.message, 'error');
        });
}

function handleLogout() {
    if (!window.auth) return;
    
    window.auth.signOut().then(() => {
        showMessage('Disconnessione effettuata', 'success');
        showSection('home');
    }).catch((error) => {
        showMessage('Errore durante la disconnessione', 'error');
    });
}

function updateAuthUI(isLoggedIn) {
    const authLink = document.getElementById('auth-link');
    if (!authLink) return;
    
    if (isLoggedIn && currentUser) {
        authLink.innerHTML = `<i class="fas fa-user"></i> ${currentUser.displayName || 'Utente'}`;
        authLink.href = '#';
        // Non impostiamo onclick qui perché è gestito in setupEventListeners
        authLink.onclick = null;
    } else {
        authLink.innerHTML = '<i class="fas fa-user"></i> Accedi';
        authLink.href = '#login';
        authLink.onclick = null;
    }
}

function loadUserProfile() {
    if (!currentUser || !window.db) return;
    
    window.db.ref('users/' + currentUser.uid).once('value')
        .then((snapshot) => {
            if (snapshot.exists()) {
                const userData = snapshot.val();
                console.log('User data loaded:', userData);
            }
        })
        .catch((error) => {
            console.error('Error loading user profile:', error);
        });
}

function handleCheckout() {
    if (!currentUser) {
        showMessage('Devi effettuare l\'accesso per procedere con l\'ordine', 'error');
        showSection('login');
        return;
    }
    
    if (cart.length === 0) {
        showMessage('Il carrello è vuoto', 'error');
        return;
    }
    
    const order = {
        userId: currentUser.uid,
        items: cart,
        total: cart.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0),
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    
    if (!window.db) {
        showMessage('Servizio database non disponibile', 'error');
        return;
    }
    
    window.db.ref('orders').push(order)
        .then(() => {
            showMessage('Ordine inviato con successo! Ti contatteremo presto.', 'success');
            cart = [];
            updateCartUI();
            showSection('home');
        })
        .catch((error) => {
            showMessage('Errore durante l\'invio dell\'ordine: ' + error.message, 'error');
        });
}

function showMessage(message, type = 'success') {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.success-message, .error-message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = type === 'success' ? 'success-message' : 'error-message';
    messageDiv.textContent = message;
    
    // Insert at the top of the current section
    const activeSection = document.querySelector('.section.active');
    if (activeSection) {
        const container = activeSection.querySelector('.container') || activeSection;
        container.insertBefore(messageDiv, container.firstChild);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }
}

// Utility functions
function formatPrice(price) {
    return `€${(price || 0).toFixed(2)}`;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT');
}

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
