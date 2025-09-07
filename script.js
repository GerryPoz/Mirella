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
    console.log('Initializing app...');
    
    // Verifica che tutte le funzioni necessarie siano definite
    if (typeof setupEventListeners !== 'function') {
        console.error('setupEventListeners function is not defined');
        return;
    }
    
    if (typeof loadData !== 'function') {
        console.error('loadData function is not defined');
        return;
    }
    
    if (typeof loadCart !== 'function') {
        console.error('loadCart function is not defined');
        return;
    }
    
    setupEventListeners();
    loadData();
    loadCart();
    
    // Auth state listener
    firebase.auth().onAuthStateChanged(function(user) {
        console.log('Auth state changed:', user ? 'logged in' : 'logged out');
        if (user) {
            currentUser = user;
            updateAuthUI(true);
            loadUserProfile();
            console.log('User logged in:', user.email);
        } else {
            currentUser = null;
            updateAuthUI(false);
            console.log('User logged out');
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
    console.log('Loading data...');
    
    // Initialize sample data if database is empty
    initializeSampleData();
    
    // Load categories
    db.ref('categories').on('value', function(snapshot) {
        console.log('Categories snapshot received');
        const data = snapshot.val();
        if (data) {
            categories = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            }));
            console.log('Categories loaded:', categories.length);
            renderCategories();
            updateCategoryFilter();
        } else {
            console.log('No categories found');
        }
    }, function(error) {
        console.error('Error loading categories:', error);
    });
    
    // Load products
    db.ref('products').on('value', function(snapshot) {
        console.log('Products snapshot received');
        const data = snapshot.val();
        if (data) {
            products = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            }));
            filteredProducts = [...products];
            console.log('Products loaded:', products.length);
            renderProducts();
        } else {
            console.log('No products found');
        }
    }, function(error) {
        console.error('Error loading products:', error);
    });
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

function renderCategories() {
    const categoriesContainer = document.getElementById('categories-container');
    if (!categoriesContainer) return;
    
    categoriesContainer.innerHTML = categories.map(category => `
        <div class="category-card" onclick="filterByCategory('${category.id}'); showSection('prodotti');">
            <img src="${category.image}" alt="${category.name}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbW1hZ2luZTwvdGV4dD48L3N2Zz4='">
            <div class="category-info">
                <h3>${category.name}</h3>
                <p>${category.description}</p>
            </div>
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
            <img src="${product.image}" alt="${product.name}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbW1hZ2luZTwvdGV4dD48L3N2Zz4='">
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-price">€${product.price.toFixed(2)}/${product.unit}</div>
                <button class="btn btn-primary" onclick="addToCart('${product.id}')" ${!product.available ? 'disabled' : ''}>
                    ${product.available ? '<i class="fas fa-cart-plus"></i> Aggiungi' : 'Non disponibile'}
                </button>
            </div>
        </div>
    `).join('');
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product || !product.available) return;
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
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

function updateCartQuantity(productId, newQuantity) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        if (newQuantity <= 0) {
            removeFromCart(productId);
        } else {
            item.quantity = newQuantity;
            updateCartUI();
            saveCart();
        }
    }
}

function updateCartUI() {
    // Update cart count badge
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
                    <i class="fas fa-shopping-cart" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                    <p>Il tuo carrello è vuoto</p>
                    <button class="btn btn-primary" onclick="showSection('prodotti')">Inizia a fare acquisti</button>
                </div>
            `;
        } else {
            cartItems.innerHTML = cart.map(item => `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjEyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1tYWdpbmU8L3RleHQ+PC9zdmc+'">
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <p>€${item.price.toFixed(2)}/${item.unit}</p>
                    </div>
                    <div class="cart-item-controls">
                        <button onclick="updateCartQuantity('${item.id}', ${item.quantity - 1})">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="updateCartQuantity('${item.id}', ${item.quantity + 1})">+</button>
                    </div>
                    <div class="cart-item-total">
                        €${(item.price * item.quantity).toFixed(2)}
                    </div>
                    <button class="remove-btn" onclick="removeFromCart('${item.id}')">
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
    
    console.log('Attempting login for:', email);
    
    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log('Login successful:', userCredential.user.email);
            showMessage('Login effettuato con successo!', 'success');
            showSection('home');
        })
        .catch(error => {
            console.error('Login error:', error);
            let errorMessage = 'Errore durante il login: ';
            
            switch(error.code) {
                case 'auth/user-not-found':
                    errorMessage += 'Utente non trovato';
                    break;
                case 'auth/wrong-password':
                    errorMessage += 'Password errata';
                    break;
                case 'auth/invalid-email':
                    errorMessage += 'Email non valida';
                    break;
                case 'auth/too-many-requests':
                    errorMessage += 'Troppi tentativi. Riprova più tardi';
                    break;
                default:
                    errorMessage += error.message;
            }
            
            showMessage(errorMessage, 'error');
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
    
    console.log('Attempting registration for:', email);
    
    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log('Registration successful:', userCredential.user.email);
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
            console.error('Registration error:', error);
            let errorMessage = 'Errore durante la registrazione: ';
            
            switch(error.code) {
                case 'auth/email-already-in-use':
                    errorMessage += 'Email già in uso';
                    break;
                case 'auth/invalid-email':
                    errorMessage += 'Email non valida';
                    break;
                case 'auth/weak-password':
                    errorMessage += 'Password troppo debole';
                    break;
                default:
                    errorMessage += error.message;
            }
            
            showMessage(errorMessage, 'error');
        });
}

function handleLogout() {
    console.log('Logging out...');
    
    firebase.auth().signOut().then(() => {
        console.log('Logout successful');
        showMessage('Logout effettuato con successo!', 'success');
        showSection('home');
    }).catch(error => {
        console.error('Logout error:', error);
        showMessage('Errore durante il logout', 'error');
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
    
    const authLink = document.getElementById('auth-link');
    const rect = authLink.getBoundingClientRect();
    dropdown.style.position = 'fixed';
    dropdown.style.top = (rect.bottom + 5) + 'px';
    dropdown.style.right = '20px';
    dropdown.style.zIndex = '1001';
    
    document.body.appendChild(dropdown);
    
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
    
    setTimeout(() => {
        if (messageDiv.parentElement) {
            messageDiv.remove();
        }
    }, 5000);
}

function initializeSampleData() {
    console.log('Checking for existing data...');
    
    db.ref('categories').once('value')
        .then(snapshot => {
            if (!snapshot.exists()) {
                console.log('No existing data found, initializing sample data...');
                
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
                
                return db.ref('categories').set(categoriesData);
            } else {
                console.log('Categories already exist');
            }
        })
        .then(() => {
            return db.ref('products').once('value');
        })
        .then(snapshot => {
            if (!snapshot.exists()) {
                console.log('Initializing products...');
                
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
                
                return db.ref('products').set(productsData);
            } else {
                console.log('Products already exist');
            }
        })
        .then(() => {
            console.log('Sample data initialization completed');
        })
        .catch(error => {
            console.error('Error initializing sample data:', error);
        });
}
