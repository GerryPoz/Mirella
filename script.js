// Global variables
let currentUser = null;
let cart = [];
let products = [];
let categories = [];
let filteredProducts = [];

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app...');
    
    // Check if Firebase services are available
    if (typeof firebase !== 'undefined' && firebase.database && firebase.auth) {
        console.log('Firebase services initialized:', {
            db: !!firebase.database(),
            auth: !!firebase.auth()
        });
        
        // Initialize app after a short delay to ensure Firebase is ready
        setTimeout(() => {
            try {
                initializeApp();
            } catch (error) {
                console.error('Error initializing Firebase:', error);
                // Retry after another delay
                setTimeout(() => {
                    initializeApp();
                }, 2000);
            }
        }, 1000);
    } else {
        console.error('Firebase services not available');
    }
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
    const searchBox = document.getElementById('search-input');
    if (searchBox) {
        searchBox.addEventListener('input', performSearch);
    }
    
    const searchButton = document.getElementById('search-button');
    if (searchButton) {
        searchButton.addEventListener('click', performSearch);
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
            const targetFormElement = document.getElementById(targetForm);
            if (targetFormElement) {
                targetFormElement.classList.add('active');
            }
        });
    });
    
    // Checkout button
    const checkoutBtn = document.getElementById('checkout-button');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', handleCheckout);
    }
}

function loadData() {
    console.log('Loading data...');
    
    // Initialize sample data if database is empty
    initializeSampleData();
    
    // Load categories
    firebase.database().ref('categories').on('value', function(snapshot) {
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
    firebase.database().ref('products').on('value', function(snapshot) {
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
        
        // Update page title
        const sectionTitles = {
            'home': 'Home - Mirella Ortofrutta',
            'chi-siamo': 'Chi Siamo - Mirella Ortofrutta',
            'prodotti': 'Prodotti - Mirella Ortofrutta',
            'carrello': 'Carrello - Mirella Ortofrutta',
            'accedi': 'Accedi - Mirella Ortofrutta'
        };
        document.title = sectionTitles[sectionId] || 'Mirella Ortofrutta';
    }
}

function renderCategories() {
    const categoriesContainer = document.getElementById('categories-grid');
    if (!categoriesContainer) {
        console.error('Categories container not found');
        return;
    }
    
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
    const productsContainer = document.getElementById('products-grid');
    if (!productsContainer) {
        console.error('Products container not found');
        return;
    }
    
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
    if (!product || !product.available) {
        showMessage('Prodotto non disponibile', 'error');
        return;
    }
    
    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += 1;
        showMessage(`Quantità di ${product.name} aumentata`, 'success');
    } else {
        cart.push({
            id: productId,
            name: product.name,
            price: product.price,
            unit: product.unit,
            image: product.image,
            quantity: 1
        });
        showMessage(`${product.name} aggiunto al carrello`, 'success');
    }
    
    updateCartUI();
    saveCart();
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
    const cartContent = document.getElementById('cart-content');
    const cartSummary = document.getElementById('cart-summary');
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    
    if (!cartContent || !cartSummary || !cartItems || !cartTotal) {
        console.error('Cart UI elements not found');
        return;
    }
    
    if (cart.length === 0) {
        cartContent.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <p>Il tuo carrello è vuoto</p>
                <button onclick="showSection('prodotti')" class="btn-primary">
                    Inizia a fare la spesa
                </button>
            </div>
        `;
        cartSummary.style.display = 'none';
    } else {
        cartContent.innerHTML = '';
        cartSummary.style.display = 'block';
        
        let total = 0;
        cartItems.innerHTML = cart.map(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            
            return `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <p>€${item.price.toFixed(2)}/${item.unit}</p>
                    </div>
                    <div class="cart-item-controls">
                        <button onclick="updateCartQuantity('${item.id}', ${item.quantity - 1})" class="btn-quantity">-</button>
                        <span class="quantity">${item.quantity}</span>
                        <button onclick="updateCartQuantity('${item.id}', ${item.quantity + 1})" class="btn-quantity">+</button>
                    </div>
                    <div class="cart-item-total">
                        €${itemTotal.toFixed(2)}
                    </div>
                    <button onclick="removeFromCart('${item.id}')" class="btn-remove">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        }).join('');
        
        cartTotal.textContent = total.toFixed(2);
    }
    
    // Update cart badge in navigation
    const cartBadge = document.querySelector('.cart-badge');
    if (cartBadge) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartBadge.textContent = totalItems;
        cartBadge.style.display = totalItems > 0 ? 'block' : 'none';
    }
}

function performSearch() {
    const searchBox = document.getElementById('search-input');
    if (!searchBox) return;
    
    const searchTerm = searchBox.value.toLowerCase();
    
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
    if (categoryId === '') {
        filteredProducts = [...products];
    } else {
        filteredProducts = products.filter(product => product.categoryId === categoryId);
    }
    
    renderProducts();
    
    // Update category filter select
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.value = categoryId;
    }
}

function updateCategoryFilter() {
    const categoryFilter = document.getElementById('category-filter');
    if (!categoryFilter) return;
    
    // Keep the "All categories" option and add category options
    const allOption = categoryFilter.querySelector('option[value=""]');
    categoryFilter.innerHTML = '';
    
    if (allOption) {
        categoryFilter.appendChild(allOption);
    } else {
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Tutte le categorie';
        categoryFilter.appendChild(defaultOption);
    }
    
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        categoryFilter.appendChild(option);
    });
}

function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
        showMessage('Inserisci email e password', 'error');
        return;
    }
    
    console.log('Attempting login for:', email);
    
    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log('Login successful:', userCredential.user.email);
            showMessage('Login effettuato con successo!', 'success');
            
            // Reset form
            document.getElementById('login-form').reset();
            
            // Redirect to home
            showSection('home');
        })
        .catch((error) => {
            console.error('Login error:', error);
            let errorMessage = 'Errore durante il login';
            
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'Utente non trovato';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Password errata';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Email non valida';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Troppi tentativi. Riprova più tardi';
                    break;
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
    
    if (!name || !email || !password || !confirmPassword) {
        showMessage('Compila tutti i campi', 'error');
        return;
    }
    
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
            
            // Update user profile with name
            return userCredential.user.updateProfile({
                displayName: name
            }).then(() => {
                // Save additional user data to database
                return firebase.database().ref('users/' + userCredential.user.uid).set({
                    name: name,
                    email: email,
                    createdAt: firebase.database.ServerValue.TIMESTAMP
                });
            });
        })
        .then(() => {
            showMessage('Registrazione completata con successo!', 'success');
            
            // Reset form
            document.getElementById('register-form').reset();
            
            // Redirect to home
            showSection('home');
        })
        .catch((error) => {
            console.error('Registration error:', error);
            let errorMessage = 'Errore durante la registrazione';
            
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'Email già in uso';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Email non valida';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Password troppo debole';
                    break;
            }
            
            showMessage(errorMessage, 'error');
        });
}

function handleLogout() {
    firebase.auth().signOut().then(() => {
        console.log('User logged out');
        showMessage('Logout effettuato con successo', 'success');
        showSection('home');
    }).catch((error) => {
        console.error('Logout error:', error);
        showMessage('Errore durante il logout', 'error');
    });
}

function updateAuthUI(isLoggedIn) {
    const authLink = document.getElementById('auth-link');
    if (!authLink) return;
    
    if (isLoggedIn && currentUser) {
        authLink.innerHTML = `
            <i class="fas fa-user"></i> ${currentUser.displayName || currentUser.email}
            <div class="user-dropdown" id="user-dropdown">
                <div class="dropdown-item" onclick="showUserProfile()">
                    <i class="fas fa-user-circle"></i> Profilo
                </div>
                <div class="dropdown-item" onclick="showSection('carrello')">
                    <i class="fas fa-shopping-cart"></i> Carrello
                </div>
                <div class="dropdown-item" onclick="handleLogout()">
                    <i class="fas fa-sign-out-alt"></i> Logout
                </div>
            </div>
        `;
        
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

function showUserMenu() {
    const dropdown = document.getElementById('user-dropdown');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function closeDropdown(e) {
            if (!e.target.closest('#auth-link')) {
                dropdown.style.display = 'none';
                document.removeEventListener('click', closeDropdown);
            }
        });
    }
}

function showUserProfile() {
    // Hide user menu
    const dropdown = document.getElementById('user-dropdown');
    if (dropdown) dropdown.style.display = 'none';
    
    // Show user profile (you can implement a profile section)
    showMessage('Funzionalità profilo in sviluppo', 'info');
}

function loadUserProfile() {
    if (!currentUser) return;
    
    firebase.database().ref('users/' + currentUser.uid).once('value')
        .then((snapshot) => {
            const userData = snapshot.val();
            if (userData) {
                console.log('User profile loaded:', userData);
                // You can use this data to populate user profile UI
            }
        })
        .catch((error) => {
            console.error('Error loading user profile:', error);
        });
}

function handleCheckout() {
    if (!currentUser) {
        showMessage('Devi effettuare il login per procedere', 'error');
        showSection('accedi');
        return;
    }
    
    if (cart.length === 0) {
        showMessage('Il carrello è vuoto', 'error');
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const order = {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        items: cart,
        total: total,
        status: 'pending',
        createdAt: firebase.database.ServerValue.TIMESTAMP
    };
    
    firebase.database().ref('orders').push(order)
        .then(() => {
            showMessage('Ordine inviato con successo!', 'success');
            cart = [];
            updateCartUI();
            saveCart();
            showSection('home');
        })
        .catch((error) => {
            console.error('Error creating order:', error);
            showMessage('Errore durante l\'invio dell\'ordine', 'error');
        });
}

function saveCart() {
    localStorage.setItem('mirella_cart', JSON.stringify(cart));
}

function loadCart() {
    const savedCart = localStorage.getItem('mirella_cart');
    if (savedCart) {
        try {
            cart = JSON.parse(savedCart);
            updateCartUI();
        } catch (error) {
            console.error('Error loading cart:', error);
            cart = [];
        }
    }
}

function showMessage(message, type = 'success') {
    const messageContainer = document.getElementById('message-container');
    if (!messageContainer) {
        console.log('Message:', message, '(Type:', type, ')');
        return;
    }
    
    const messageElement = document.createElement('div');
    messageElement.className = `message message-${type}`;
    messageElement.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" class="message-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    messageContainer.appendChild(messageElement);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (messageElement.parentElement) {
            messageElement.remove();
        }
    }, 5000);
}

function initializeSampleData() {
    console.log('Checking for existing data...');
    
    // Check if categories exist
    firebase.database().ref('categories').once('value')
        .then((snapshot) => {
            if (!snapshot.exists()) {
                console.log('No categories found, creating sample categories...');
                
                const sampleCategories = {
                    'frutta': {
                        name: 'Frutta',
                        description: 'Frutta fresca di stagione',
                        image: 'immagini/FruttaCopilot_20250906_124031.png'
                    },
                    'verdura': {
                        name: 'Verdura',
                        description: 'Verdure fresche dell\'orto',
                        image: 'immagini/VerduraCopilot_20250906_124758.png'
                    },
                    'gastronomia': {
                        name: 'Gastronomia',
                        description: 'Prodotti gastronomici artigianali',
                        image: 'immagini/GastronomiaCopilot_20250906_125746.png'
                    },
                    'varie': {
                        name: 'Varie',
                        description: 'Altri prodotti selezionati',
                        image: 'immagini/VarieCopilot_20250906_142429.png'
                    }
                };
                
                return firebase.database().ref('categories').set(sampleCategories);
            } else {
                console.log('Categories already exist');
            }
        })
        .then(() => {
            // Check if products exist
            return firebase.database().ref('products').once('value');
        })
        .then((snapshot) => {
            if (!snapshot.exists()) {
                console.log('No products found, creating sample products...');
                
                const sampleProducts = {
                    'pomodoro-occhio-bue': {
                        name: 'Pomodoro Occhio di Bue',
                        description: 'Pomodori grandi e succosi, perfetti per insalate',
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
                
                return firebase.database().ref('products').set(sampleProducts);
            } else {
                console.log('Products already exist');
            }
        })
        .catch((error) => {
            console.error('Error initializing sample data:', error);
        });
    
    console.log('Sample data initialization completed');
}
