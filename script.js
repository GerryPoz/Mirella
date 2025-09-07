// Global variables
let currentUser = null;
let cart = [];
let products = [];
let categories = [];
let filteredProducts = [];

// Firebase services
let db, auth;

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Firebase services
    db = firebase.database();
    auth = firebase.auth();
    
    // Start the app
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    loadData();
    loadCart();
    
    // Auth state listener
    auth.onAuthStateChanged(function(user) {
        if (user) {
            currentUser = user;
            updateAuthUI(true);
            loadUserProfile();
        } else {
            currentUser = null;
            updateAuthUI(false);
        }
    });
    
    // Show home section by default
    showSection('home');
}

function setupEventListeners() {
    // Navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('href').substring(1);
            showSection(sectionId);
            
            // Update active nav link
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // Close mobile menu if open
            const navMenu = document.getElementById('nav-menu');
            if (navMenu) {
                navMenu.classList.remove('show');
            }
        });
    });
    
    // Mobile menu toggle
    const mobileToggle = document.getElementById('mobile-toggle');
    if (mobileToggle) {
        mobileToggle.addEventListener('click', function() {
            const navMenu = document.getElementById('nav-menu');
            if (navMenu) {
                navMenu.classList.toggle('show');
            }
        });
    }
    
    // Search functionality
    const searchBox = document.getElementById('search-box');
    if (searchBox) {
        searchBox.addEventListener('input', performSearch);
    }
    
    // Category filter
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            filterByCategory(this.value);
        });
    }
    
    // Auth forms
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Auth tabs
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const targetForm = this.getAttribute('data-form');
            
            // Update active tab
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding form
            document.querySelectorAll('.auth-form').forEach(form => {
                form.classList.remove('active');
            });
            document.getElementById(targetForm).classList.add('active');
        });
    });
    
    // Checkout button
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', handleCheckout);
    }
}

function loadData() {
    // Initialize sample data if database is empty
    initializeSampleData();
    
    // Load categories
    db.ref('categories').on('value', function(snapshot) {
        const data = snapshot.val();
        if (data) {
            categories = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            }));
            renderCategories();
            updateCategoryFilter();
        }
    });
    
    // Load products
    db.ref('products').on('value', function(snapshot) {
        const data = snapshot.val();
        if (data) {
            products = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            }));
            filteredProducts = [...products];
            renderProducts();
        }
    });
}

function renderCategories() {
    const categoriesContainer = document.getElementById('categories-container');
    if (!categoriesContainer) return;
    
    categoriesContainer.innerHTML = categories.map(category => `
        <div class="category-card" onclick="filterByCategory('${category.id}'); showSection('prodotti');">
            <img src="${category.image}" alt="${category.name}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjZjBmMGYwIi8+CjxwYXRoIGQ9Ik00MCAyMEM0Ni42Mjc0IDIwIDUyIDI1LjM3MjYgNTIgMzJDNTIgMzguNjI3NCA0Ni42Mjc0IDQ0IDQwIDQ0QzMzLjM3MjYgNDQgMjggMzguNjI3NCAyOCAzMkMyOCAyNS4zNzI2IDMzLjM3MjYgMjAgNDAgMjBaIiBmaWxsPSIjY2NjIi8+CjxwYXRoIGQ9Ik0yMCA1Nkw2MCA1NkM2MCA1MiA1NiA0OCA1MiA0OEwyOCA0OEMyNCA0OCAyMCA1MiAyMCA1NloiIGZpbGw9IiNjY2MiLz4KPC9zdmc+'">
            <h3>${category.name}</h3>
            <p>${category.description}</p>
        </div>
    `).join('');
}

function renderProducts() {
    const productsContainer = document.getElementById('products-container');
    if (!productsContainer) return;
    
    if (filteredProducts.length === 0) {
        productsContainer.innerHTML = `
            <div class="empty-state">
                <p>Nessun prodotto trovato</p>
            </div>
        `;
        return;
    }
    
    productsContainer.innerHTML = filteredProducts.map(product => `
        <div class="product-card">
            <img src="${product.image}" alt="${product.name}" class="product-image" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDI4MCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyODAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZjBmMGYwIi8+CjxwYXRoIGQ9Ik0xNDAgNjBDMTUzLjI1NCA2MCA2NCA3MS43NDU4IDY0IDg2QzY0IDEwMC4yNTQgMTUzLjI1NCAxMTIgMTQwIDExMkMxMjYuNzQ2IDExMiAxMTYgMTAwLjI1NCAxMTYgODZDMTE2IDcxLjc0NTggMTI2Ljc0NiA2MCAxNDAgNjBaIiBmaWxsPSIjY2NjIi8+CjxwYXRoIGQ9Ik04MCA1NkwyMDAgNTZDMjAwIDUyIDE5NiA0OCAxOTIgNDhIODhDODQgNDggODAgNTIgODAgNTZaIiBmaWxsPSIjY2NjIi8+Cjwvc3ZnPg=='">
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-price">€${product.price.toFixed(2)}/${product.unit}</p>
                <p class="product-description">${product.description}</p>
                <button class="add-to-cart" onclick="addToCart('${product.id}')">
                    <i class="fas fa-cart-plus"></i> Aggiungi al Carrello
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
    
    // Update page title
    const titles = {
        'home': 'Home - Mirella Ortofrutta',
        'chi-siamo': 'Chi Siamo - Mirella Ortofrutta',
        'prodotti': 'Prodotti - Mirella Ortofrutta',
        'carrello': 'Carrello - Mirella Ortofrutta',
        'accedi': 'Accedi - Mirella Ortofrutta'
    };
    document.title = titles[sectionId] || 'Mirella Ortofrutta';
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
            unit: product.unit,
            image: product.image,
            quantity: 1
        });
    }
    
    updateCartUI();
    saveCart();
    showMessage(`${product.name} aggiunto al carrello!`, 'success');
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartUI();
    saveCart();
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            updateCartUI();
            saveCart();
        }
    }
}

function updateCartUI() {
    // Update cart count in navigation
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? 'inline' : 'none';
    }
    
    // Update cart items display
    const cartItems = document.getElementById('cart-items');
    if (cartItems) {
        if (cart.length === 0) {
            cartItems.innerHTML = `
                <div class="empty-state">
                    <p>Il tuo carrello è vuoto</p>
                    <button onclick="showSection('prodotti')" class="add-to-cart">
                        Inizia a fare la spesa
                    </button>
                </div>
            `;
        } else {
            cartItems.innerHTML = cart.map(item => `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjZjBmMGYwIi8+CjxwYXRoIGQ9Ik00MCAyMEM0Ni42Mjc0IDIwIDUyIDI1LjM3MjYgNTIgMzJDNTIgMzguNjI3NCA0Ni42Mjc0IDQ0IDQwIDQ0QzMzLjM3MjYgNDQgMjggMzguNjI3NCAyOCAzMkMyOCAyNS4zNzI2IDMzLjM3MjYgMjAgNDAgMjBaIiBmaWxsPSIjY2NjIi8+CjxwYXRoIGQ9Ik0yMCA1Nkw2MCA1NkM2MCA1MiA1NiA0OCA1MiA0OEwyOCA0OEMyNCA0OCAyMCA1MiAyMCA1NloiIGZpbGw9IiNjY2MiLz4KPC9zdmc+'">
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">€${item.price.toFixed(2)}/${item.unit}</div>
                        <div class="quantity-controls">
                            <button class="quantity-btn" onclick="updateQuantity('${item.id}', -1)">-</button>
                            <span class="quantity">${item.quantity}</span>
                            <button class="quantity-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
                        </div>
                    </div>
                    <button class="remove-item" onclick="removeFromCart('${item.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `).join('');
        }
    }
    
    // Update cart total
    const cartTotal = document.getElementById('cart-total');
    if (cartTotal) {
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartTotal.textContent = `Totale: €${total.toFixed(2)}`;
    }
    
    // Update checkout button
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.disabled = cart.length === 0;
    }
}

function performSearch() {
    const searchTerm = document.getElementById('search-box').value.toLowerCase();
    
    if (searchTerm === '') {
        filteredProducts = [...products];
    } else {
        filteredProducts = products.filter(product => 
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm)
        );
    }
    
    renderProducts();
}

function filterByCategory(categoryId) {
    if (categoryId === '' || categoryId === 'all') {
        filteredProducts = [...products];
    } else {
        filteredProducts = products.filter(product => product.categoryId === categoryId);
    }
    renderProducts();
}

function updateCategoryFilter() {
    const categoryFilter = document.getElementById('category-filter');
    if (!categoryFilter) return;
    
    categoryFilter.innerHTML = `
        <option value="all">Tutte le categorie</option>
        ${categories.map(category => 
            `<option value="${category.id}">${category.name}</option>`
        ).join('')}
    `;
}

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            showMessage('Login effettuato con successo!', 'success');
            showSection('home');
        })
        .catch(error => {
            showMessage('Errore durante il login: ' + error.message, 'error');
        });
}

function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    
    if (password !== confirmPassword) {
        showMessage('Le password non coincidono', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage('La password deve essere di almeno 6 caratteri', 'error');
        return;
    }
    
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Save user profile
            const user = userCredential.user;
            return db.ref('users/' + user.uid).set({
                name: name,
                email: email,
                createdAt: firebase.database.ServerValue.TIMESTAMP
            });
        })
        .then(() => {
            showMessage('Registrazione completata con successo!', 'success');
            showSection('home');
        })
        .catch(error => {
            showMessage('Errore durante la registrazione: ' + error.message, 'error');
        });
}

function handleLogout() {
    auth.signOut().then(() => {
        showMessage('Logout effettuato con successo!', 'success');
        showSection('home');
    });
}

function updateAuthUI(isLoggedIn) {
    const authLink = document.getElementById('auth-link');
    if (authLink) {
        if (isLoggedIn) {
            authLink.innerHTML = '<i class="fas fa-user"></i> Profilo';
            authLink.onclick = function(e) {
                e.preventDefault();
                showUserMenu();
            };
        } else {
            authLink.innerHTML = '<i class="fas fa-user"></i> Accedi';
            authLink.onclick = function(e) {
                e.preventDefault();
                showSection('accedi');
            };
        }
    }
}

function showUserMenu() {
    // Create dropdown menu
    const existingMenu = document.getElementById('user-dropdown');
    if (existingMenu) {
        existingMenu.remove();
        return;
    }
    
    const dropdown = document.createElement('div');
    dropdown.id = 'user-dropdown';
    dropdown.className = 'user-dropdown';
    dropdown.innerHTML = `
        <div class="dropdown-item" onclick="showUserProfile()">
            <i class="fas fa-user"></i> Profilo
        </div>
        <div class="dropdown-item" onclick="showSection('carrello')">
            <i class="fas fa-shopping-cart"></i> I miei ordini
        </div>
        <div class="dropdown-item" onclick="handleLogout()">
            <i class="fas fa-sign-out-alt"></i> Logout
        </div>
    `;
    
    // Position dropdown
    const authLink = document.getElementById('auth-link');
    const rect = authLink.getBoundingClientRect();
    dropdown.style.position = 'fixed';
    dropdown.style.top = (rect.bottom + 5) + 'px';
    dropdown.style.right = '20px';
    dropdown.style.zIndex = '1001';
    
    document.body.appendChild(dropdown);
    
    // Close dropdown when clicking outside
    setTimeout(() => {
        document.addEventListener('click', function closeDropdown(e) {
            if (!dropdown.contains(e.target) && e.target !== authLink) {
                dropdown.remove();
                document.removeEventListener('click', closeDropdown);
            }
        });
    }, 100);
}

function showUserProfile() {
    if (currentUser) {
        showMessage(`Benvenuto, ${currentUser.email}!`, 'info');
    }
    document.getElementById('user-dropdown')?.remove();
}

function loadUserProfile() {
    if (currentUser) {
        db.ref('users/' + currentUser.uid).once('value')
            .then(snapshot => {
                const userData = snapshot.val();
                if (userData) {
                    console.log('User data loaded:', userData);
                }
            })
            .catch(error => {
                console.error('Error loading user profile:', error);
            });
    }
}

function handleCheckout() {
    if (!currentUser) {
        showMessage('Devi effettuare il login per completare l\'ordine', 'error');
        showSection('accedi');
        return;
    }
    
    if (cart.length === 0) {
        showMessage('Il carrello è vuoto', 'error');
        return;
    }
    
    const order = {
        userId: currentUser.uid,
        items: cart,
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        status: 'pending',
        createdAt: firebase.database.ServerValue.TIMESTAMP
    };
    
    db.ref('orders').push(order)
        .then(() => {
            showMessage('Ordine inviato con successo! Ti contatteremo presto.', 'success');
            cart = [];
            updateCartUI();
            saveCart();
            showSection('home');
        })
        .catch(error => {
            showMessage('Errore durante l\'invio dell\'ordine: ' + error.message, 'error');
        });
}

function saveCart() {
    localStorage.setItem('mirella_cart', JSON.stringify(cart));
}

function loadCart() {
    const savedCart = localStorage.getItem('mirella_cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartUI();
    }
}

function showMessage(message, type = 'success') {
    const messageContainer = document.getElementById('message-container');
    if (!messageContainer) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" style="background: none; border: none; color: inherit; font-size: 1.2em; cursor: pointer; margin-left: 10px;">&times;</button>
    `;
    
    messageContainer.appendChild(messageDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentElement) {
            messageDiv.remove();
        }
    }, 5000);
}

function initializeSampleData() {
    // Check if data already exists
    db.ref('categories').once('value')
        .then(snapshot => {
            if (!snapshot.exists()) {
                // Initialize categories
                const categoriesData = {
                    'verdura': {
                        name: 'Verdura',
                        description: 'Verdure fresche di stagione',
                        image: 'immagini/VerduraCopilot_20250906_124758.png'
                    },
                    'frutta': {
                        name: 'Frutta',
                        description: 'Frutta fresca e di qualità',
                        image: 'immagini/FruttaCopilot_20250906_124031.png'
                    },
                    'gastronomia': {
                        name: 'Gastronomia',
                        description: 'Prodotti gastronomici locali',
                        image: 'immagini/GastronomiaCopilot_20250906_125746.png'
                    },
                    'varie': {
                        name: 'Varie',
                        description: 'Altri prodotti selezionati',
                        image: 'immagini/VarieCopilot_20250906_142429.png'
                    }
                };
                
                db.ref('categories').set(categoriesData);
                
                // Initialize products
                const productsData = {
                    'pomodoro-occhio-bue': {
                        name: 'Pomodoro Occhio di Bue',
                        description: 'Pomodori freschi e saporiti, perfetti per insalate',
                        price: 3.50,
                        unit: 'kg',
                        categoryId: 'verdura',
                        image: 'immagini/PomodoroOcchioBueCopilot_20250906_151807.png',
                        available: true
                    },
                    'melanzane-nere': {
                        name: 'Melanzane Nere',
                        description: 'Melanzane nere di prima qualità',
                        price: 2.80,
                        unit: 'kg',
                        categoryId: 'verdura',
                        image: 'immagini/MelanzaneNereCopilot_20250906_154038.png',
                        available: true
                    },
                    'insalata-lattuga': {
                        name: 'Insalata Lattuga',
                        description: 'Lattuga fresca e croccante',
                        price: 1.50,
                        unit: 'cespo',
                        categoryId: 'verdura',
                        image: 'immagini/InsalataLattugaOriCopilot_20250906_152254.png',
                        available: true
                    }
                };
                
                db.ref('products').set(productsData);
            }
        })
        .catch(error => {
            console.error('Error initializing sample data:', error);
        });
}
