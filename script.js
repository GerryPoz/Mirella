// Global variables
let currentUser = null;
let cart = [];
let products = [];
let categories = [];
let filteredProducts = [];

// Firebase configuration (compatibility mode)
const firebaseConfig = {
  // Sostituisci con la tua configurazione Firebase
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com/",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    loadData();
    loadCart();
    
    // Check authentication state
    auth.onAuthStateChanged(user => {
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

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            showSection(targetId);
            
            // Update active nav link
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Close mobile menu
            document.getElementById('nav-menu').classList.remove('active');
        });
    });

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

    // Checkout button
    const checkoutButton = document.getElementById('checkout-button');
    if (checkoutButton) {
        checkoutButton.addEventListener('click', handleCheckout);
    }

    // Product interactions (event delegation)
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

        if (e.target.classList.contains('category-card')) {
            const categoryId = e.target.getAttribute('data-category-id');
            showSection('prodotti');
            filterByCategory(categoryId);
        }
    });
}

function loadData() {
    // Load categories
    db.ref('categories').on('value', (snapshot) => {
        if (snapshot.exists()) {
            categories = [];
            snapshot.forEach((childSnapshot) => {
                categories.push({
                    id: childSnapshot.key,
                    ...childSnapshot.val()
                });
            });
            renderCategories();
            updateCategoryFilter();
        }
    });

    // Load products
    db.ref('products').on('value', (snapshot) => {
        if (snapshot.exists()) {
            products = [];
            snapshot.forEach((childSnapshot) => {
                products.push({
                    id: childSnapshot.key,
                    ...childSnapshot.val()
                });
            });
            filteredProducts = [...products];
            renderProducts();
        }
    });
}

function renderCategories() {
    const categoriesGrid = document.getElementById('categories-grid');
    if (!categoriesGrid) return;

    categoriesGrid.innerHTML = categories.map(category => `
        <div class="category-card" data-category-id="${category.id}">
            <div class="category-icon">
                <i class="${category.icon || 'fas fa-leaf'}"></i>
            </div>
            <h3>${category.name}</h3>
            <p>${category.description || ''}</p>
        </div>
    `).join('');
}

function renderProducts() {
    const productsGrid = document.getElementById('products-grid');
    if (!productsGrid) return;

    if (filteredProducts.length === 0) {
        productsGrid.innerHTML = '<p class="no-products">Nessun prodotto trovato</p>';
        return;
    }

    productsGrid.innerHTML = filteredProducts.map(product => `
        <div class="product-card">
            <div class="product-image">
                <img src="${product.image || './immagini/placeholder.png'}" alt="${product.name}" onerror="this.src='./immagini/placeholder.png'">
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="product-description">${product.description || ''}</p>
                <div class="product-price">€${product.price.toFixed(2)}</div>
                <div class="product-unit">${product.unit || 'al kg'}</div>
                <button class="add-to-cart btn-primary" data-product-id="${product.id}">
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
    
    // Update navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + sectionId) {
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
    const cartCount = document.getElementById('cart-count');
    const cartContent = document.getElementById('cart-content');
    const cartSummary = document.getElementById('cart-summary');
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    if (cartCount) {
        cartCount.textContent = totalItems;
    }

    if (cart.length === 0) {
        if (cartContent) cartContent.style.display = 'block';
        if (cartSummary) cartSummary.style.display = 'none';
    } else {
        if (cartContent) cartContent.style.display = 'none';
        if (cartSummary) cartSummary.style.display = 'block';

        if (cartItems) {
            cartItems.innerHTML = cart.map(item => `
                <div class="cart-item">
                    <div class="cart-item-image">
                        <img src="${item.image || './immagini/placeholder.png'}" alt="${item.name}">
                    </div>
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <p>€${item.price.toFixed(2)} ${item.unit}</p>
                    </div>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn decrease" data-product-id="${item.id}">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn increase" data-product-id="${item.id}">+</button>
                    </div>
                    <div class="cart-item-total">
                        €${(item.price * item.quantity).toFixed(2)}
                    </div>
                    <button class="remove-from-cart" data-product-id="${item.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `).join('');
        }

        if (cartTotal) {
            cartTotal.textContent = totalPrice.toFixed(2);
        }
    }
}

function performSearch() {
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const selectedCategory = categoryFilter ? categoryFilter.value : '';

    filteredProducts = products.filter(product => {
        const matchesSearch = !searchTerm || 
            product.name.toLowerCase().includes(searchTerm) ||
            (product.description && product.description.toLowerCase().includes(searchTerm));
        
        const matchesCategory = !selectedCategory || product.categoryId === selectedCategory;
        
        return matchesSearch && matchesCategory;
    });

    renderProducts();
}

function filterByCategory(categoryId) {
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.value = categoryId;
    }
    performSearch();
}

function updateCategoryFilter() {
    const categoryFilter = document.getElementById('category-filter');
    if (!categoryFilter) return;

    categoryFilter.innerHTML = '<option value="">Tutte le categorie</option>' +
        categories.map(category => 
            `<option value="${category.id}">${category.name}</option>`
        ).join('');
}

function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    auth.signInWithEmailAndPassword(email, password)
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
    const phone = document.getElementById('register-phone').value;
    const address = document.getElementById('register-address').value;

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            
            // Update user profile
            return user.updateProfile({
                displayName: name
            }).then(() => {
                // Save additional user data
                return db.ref('users/' + user.uid).set({
                    name: name,
                    email: email,
                    phone: phone,
                    address: address,
                    createdAt: firebase.database.ServerValue.TIMESTAMP
                });
            });
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
    auth.signOut().then(() => {
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
        authLink.onclick = (e) => {
            e.preventDefault();
            if (confirm('Vuoi disconnetterti?')) {
                handleLogout();
            }
        };
    } else {
        authLink.innerHTML = '<i class="fas fa-user"></i> Accedi';
        authLink.onclick = null;
    }
}

function loadUserProfile() {
    if (!currentUser) return;
    
    db.ref('users/' + currentUser.uid).once('value')
        .then((snapshot) => {
            if (snapshot.exists()) {
                const userData = snapshot.val();
                console.log('Dati utente caricati:', userData);
            }
        })
        .catch((error) => {
            console.error('Errore nel caricamento del profilo:', error);
        });
}

function handleCheckout() {
    if (!currentUser) {
        showMessage('Devi effettuare l\'accesso per ordinare', 'error');
        showSection('accedi');
        return;
    }

    if (cart.length === 0) {
        showMessage('Il carrello è vuoto', 'error');
        return;
    }

    const order = {
        userId: currentUser.uid,
        userEmail: currentUser.email,
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
        .catch((error) => {
            showMessage('Errore nell\'invio dell\'ordine: ' + error.message, 'error');
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

    const messageElement = document.createElement('div');
    messageElement.className = `message message-${type}`;
    messageElement.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;

    messageContainer.appendChild(messageElement);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (messageElement.parentElement) {
            messageElement.remove();
        }
    }, 5000);
}

// Initialize sample data (remove this in production)
function initializeSampleData() {
    // Sample categories
    const sampleCategories = {
        'frutta': {
            name: 'Frutta',
            description: 'Frutta fresca di stagione',
            icon: 'fas fa-apple-alt'
        },
        'verdura': {
            name: 'Verdura',
            description: 'Verdure fresche dell\'orto',
            icon: 'fas fa-carrot'
        },
        'gastronomia': {
            name: 'Gastronomia',
            description: 'Prodotti gastronomici artigianali',
            icon: 'fas fa-cheese'
        },
        'varie': {
            name: 'Varie',
            description: 'Altri prodotti selezionati',
            icon: 'fas fa-shopping-basket'
        }
    };

    // Sample products
    const sampleProducts = {
        'pomodori': {
            name: 'Pomodori Occhio di Bue',
            description: 'Pomodori freschi e succosi',
            price: 3.50,
            unit: 'al kg',
            categoryId: 'verdura',
            image: './immagini/PomodoroOcchioBueCopilot_20250906_151807.png'
        },
        'melanzane': {
            name: 'Melanzane Nere',
            description: 'Melanzane nere di prima qualità',
            price: 2.80,
            unit: 'al kg',
            categoryId: 'verdura',
            image: './immagini/MelanzaneNereCopilot_20250906_154038.png'
        },
        'lattuga': {
            name: 'Insalata Lattuga',
            description: 'Lattuga fresca e croccante',
            price: 1.50,
            unit: 'al pezzo',
            categoryId: 'verdura',
            image: './immagini/InsalataLattugaOriCopilot_20250906_152254.png'
        }
    };

    // Add to Firebase (uncomment to initialize)
    /*
    Object.keys(sampleCategories).forEach(key => {
        db.ref('categories/' + key).set(sampleCategories[key]);
    });

    Object.keys(sampleProducts).forEach(key => {
        db.ref('products/' + key).set(sampleProducts[key]);
    });
    */
}

// Call initialize sample data (remove in production)
// initializeSampleData();