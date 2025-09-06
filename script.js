// Variabili globali
let currentUser = null;
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let products = [];
let categories = [];

// Inizializzazione
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadData();
    
    // Gestisce la navigazione iniziale basata sull'URL
    const initialSection = getInitialSection();
    showSection(initialSection, false); // false = non aggiungere alla cronologia
});

function initializeApp() {
    // Controlla stato autenticazione
    auth.onAuthStateChanged(user => {
        currentUser = user;
        updateUI();
        if (user) {
            loadUserProfile();
        }
    });
    
    updateCartUI();
}

function setupEventListeners() {
    // Navigation - aggiornato per la nuova struttura navbar
    document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = e.target.getAttribute('href').substring(1);
            showSection(section);
        });
    });
    
    // Gestione pulsanti avanti/indietro del browser
    window.addEventListener('popstate', (e) => {
        if (e.state && e.state.section) {
            showSection(e.state.section, false);
        } else {
            showSection('home', false);
        }
    });
    
    // Auth forms - aggiornati gli ID con controlli di esistenza
    const loginSubmit = document.getElementById('login-submit');
    const registerSubmit = document.getElementById('register-submit');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (loginSubmit) loginSubmit.addEventListener('click', handleLogin);
    if (registerSubmit) registerSubmit.addEventListener('click', handleRegister);
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    
    // Form toggles
    const showRegister = document.getElementById('show-register');
    const showLogin = document.getElementById('show-login');
    
    if (showRegister) {
        showRegister.addEventListener('click', () => {
            const loginForm = document.getElementById('login-form');
            const registerForm = document.getElementById('register-form');
            if (loginForm) loginForm.style.display = 'none';
            if (registerForm) registerForm.style.display = 'block';
        });
    }
    
    if (showLogin) {
        showLogin.addEventListener('click', () => {
            const registerForm = document.getElementById('register-form');
            const loginForm = document.getElementById('login-form');
            if (registerForm) registerForm.style.display = 'none';
            if (loginForm) loginForm.style.display = 'block';
        });
    }
    
    // Search and filters
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    
    if (searchInput) searchInput.addEventListener('input', filterProducts);
    if (categoryFilter) categoryFilter.addEventListener('change', filterProducts);
    
    // Checkout
    const checkoutBtn = document.getElementById('checkout-btn');
    const checkoutForm = document.getElementById('checkout-form');
    
    if (checkoutBtn) checkoutBtn.addEventListener('click', showCheckoutModal);
    if (checkoutForm) checkoutForm.addEventListener('submit', handleCheckout);
    
    // Modal close
    const closeBtn = document.querySelector('.close');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal();
        }
    });
    
    // Aggiungi gestione per il menu mobile
    const navbarToggler = document.querySelector('.navbar-toggler');
    const navbarCollapse = document.querySelector('.navbar-collapse');
    
    if (navbarToggler && navbarCollapse) {
        navbarToggler.addEventListener('click', () => {
            navbarCollapse.classList.toggle('show');
        });
    }
}

function loadData() {
    // Carica categorie dal Realtime Database
    db.ref('categories').on('value', (snapshot) => {
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
    
    // Carica prodotti dal Realtime Database
    db.ref('products').on('value', (snapshot) => {
        products = [];
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                products.push({ 
                    id: childSnapshot.key, 
                    ...childSnapshot.val() 
                });
            });
        }
        renderProducts();
        renderFeaturedProducts();
    });
}

function renderCategories() {
    const container = document.getElementById('categories-grid');
    if (!container) return;
    
    container.innerHTML = categories.map(category => `
        <div class="category-card" onclick="filterByCategory('${category.id}')">
            <div class="category-image">
                ${category.image ? 
                    `<img src="${category.image}" alt="${category.name}" loading="lazy">` : 
                    `<div class="no-image-placeholder">
                        <i class="fas fa-image"></i>
                        <span>Nessuna immagine</span>
                    </div>`
                }
            </div>
            <div class="category-info">
                <h3>${category.name}</h3>
                <p>${category.description || ''}</p>
            </div>
        </div>
    `).join('');
}

function renderProducts() {
    const container = document.getElementById('products-grid');
    if (!container) return;
    
    const filteredProducts = getFilteredProducts();
    
    container.innerHTML = filteredProducts.map(product => `
        <div class="product-card">
            <div class="product-image">
                ${product.image ? 
                    `<img src="${product.image}" alt="${product.name}" loading="lazy">` : 
                    `<div class="no-image-placeholder">
                        <i class="fas fa-image"></i>
                        <span>Nessuna immagine</span>
                    </div>`
                }
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="product-description">${product.description || ''}</p>
                <div class="product-price">€${product.price.toFixed(2)}/${product.unit || 'pz'}</div>
                <div class="product-stock">Disponibili: ${product.stock}</div>
                <button class="btn btn-primary" onclick="addToCart('${product.id}')" 
                        ${product.stock <= 0 ? 'disabled' : ''}>
                    ${product.stock <= 0 ? 'Esaurito' : 'Aggiungi al Carrello'}
                </button>
            </div>
        </div>
    `).join('');
}

function renderFeaturedProducts() {
    const container = document.getElementById('featured-products-grid');
    if (!container) return;
    
    const featuredProducts = products.filter(p => p.featured).slice(0, 6);
    
    container.innerHTML = featuredProducts.map(product => `
        <div class="product-card featured">
            <div class="product-image">
                ${product.image ? 
                    `<img src="${product.image}" alt="${product.name}" loading="lazy">` : 
                    `<div class="no-image-placeholder">
                        <i class="fas fa-image"></i>
                        <span>Nessuna immagine</span>
                    </div>`
                }
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <div class="product-price">€${product.price.toFixed(2)}/${product.unit || 'pz'}</div>
                <button class="btn btn-primary" onclick="addToCart('${product.id}')" 
                        ${product.stock <= 0 ? 'disabled' : ''}>
                    ${product.stock <= 0 ? 'Esaurito' : 'Aggiungi'}
                </button>
            </div>
        </div>
    `).join('');
}

function getFilteredProducts() {
    let filtered = products;
    
    // Filtro per categoria
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter && categoryFilter.value) {
        filtered = filtered.filter(p => p.categoryId === categoryFilter.value);
    }
    
    // Filtro per ricerca
    const searchInput = document.getElementById('search-input');
    if (searchInput && searchInput.value.trim()) {
        const searchTerm = searchInput.value.toLowerCase();
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(searchTerm) ||
            (p.description && p.description.toLowerCase().includes(searchTerm))
        );
    }
    
    return filtered;
}

function filterProducts() {
    renderProducts();
}

function filterByCategory(categoryId) {
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.value = categoryId;
    }
    showSection('products');
    filterProducts();
}

function updateCategoryFilter() {
    const select = document.getElementById('category-filter');
    if (!select) return;
    
    select.innerHTML = '<option value="">Tutte le categorie</option>' +
        categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
}

// Funzioni carrello
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product || product.stock <= 0) return;
    
    const existingItem = cart.find(item => item.productId === productId);
    
    if (existingItem) {
        if (existingItem.quantity < product.stock) {
            existingItem.quantity += 1;
        } else {
            alert('Quantità massima disponibile raggiunta');
            return;
        }
    } else {
        cart.push({
            productId: productId,
            name: product.name,
            price: product.price,
            unit: product.unit,
            quantity: 1,
            image: product.image
        });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
    
    // Feedback visivo
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = 'Aggiunto!';
    button.style.backgroundColor = '#28a745';
    
    setTimeout(() => {
        button.textContent = originalText;
        button.style.backgroundColor = '';
    }, 1000);
}

function changeQuantity(productId, change) {
    const item = cart.find(item => item.productId === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            cart = cart.filter(item => item.productId !== productId);
        }
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
}

function updateCartUI() {
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    const cartBadge = document.querySelector('.cart-badge');
    
    if (cartItems) {
        if (cart.length === 0) {
            cartItems.innerHTML = '<p class="empty-cart">Il carrello è vuoto</p>';
        } else {
            cartItems.innerHTML = cart.map((item, index) => `
                <div class="cart-item">
                    <div class="cart-item-image">
                        ${item.image ? 
                            `<img src="${item.image}" alt="${item.name}">` : 
                            `<div class="no-image-placeholder"><i class="fas fa-image"></i></div>`
                        }
                    </div>
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <p>€${item.price.toFixed(2)}/${item.unit || 'pz'}</p>
                    </div>
                    <div class="cart-item-controls">
                        <button onclick="updateCartQuantity(${index}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="updateCartQuantity(${index}, 1)">+</button>
                    </div>
                    <div class="cart-item-total">
                        €${(item.price * item.quantity).toFixed(2)}
                    </div>
                    <button class="btn-remove" onclick="removeFromCart(${index})">×</button>
                </div>
            `).join('');
        }
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (cartTotal) {
        cartTotal.textContent = `€${total.toFixed(2)}`;
    }
    
    // Aggiorna il badge del carrello
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartBadge) {
        cartBadge.textContent = totalItems;
        cartBadge.style.display = totalItems > 0 ? 'inline' : 'none';
    }
}

function updateCartQuantity(index, change) {
    const item = cart[index];
    const product = products.find(p => p.id === item.productId);
    
    if (change > 0 && product && item.quantity >= product.stock) {
        alert('Quantità massima disponibile raggiunta');
        return;
    }
    
    item.quantity += change;
    if (item.quantity <= 0) {
        cart.splice(index, 1);
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
}

// Funzioni autenticazione
function handleLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    auth.signInWithEmailAndPassword(email, password)
        .then(userCredential => {
            showSection('home');
            alert('Login effettuato con successo!');
        })
        .catch(error => {
            alert('Errore durante il login: ' + error.message);
        });
}

function handleRegister() {
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const name = document.getElementById('register-name').value;
    const phone = document.getElementById('register-phone').value;
    const address = document.getElementById('register-address').value;
    
    if (password !== confirmPassword) {
        alert('Le password non coincidono');
        return;
    }
    
    auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            // Salva informazioni aggiuntive dell'utente nel Realtime Database
            return db.ref(`users/${userCredential.user.uid}`).set({
                name: name,
                email: email,
                phone: phone,
                address: address,
                createdAt: firebase.database.ServerValue.TIMESTAMP
            });
        })
        .then(() => {
            showSection('home');
            alert('Registrazione completata con successo!');
        })
        .catch(error => {
            alert('Errore durante la registrazione: ' + error.message);
        });
}

function handleLogout() {
    auth.signOut().then(() => {
        showSection('home');
        alert('Logout effettuato con successo!');
    }).catch(error => {
        alert('Errore durante il logout: ' + error.message);
    });
}

function loadUserProfile() {
    if (!currentUser) return;
    
    db.ref(`users/${currentUser.uid}`).once('value').then(snapshot => {
        if (snapshot.exists()) {
            const userData = snapshot.val();
            
            // Popola i campi del profilo
            const fields = ['profile-name', 'profile-email', 'profile-phone', 'profile-address'];
            fields.forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (field) {
                    const key = fieldId.replace('profile-', '');
                    field.value = userData[key] || '';
                }
            });
        }
    });
    
    // Carica cronologia ordini
    db.ref('orders').orderByChild('userId').equalTo(currentUser.uid).once('value')
        .then(snapshot => {
            const ordersContainer = document.getElementById('orders-history');
            if (!ordersContainer) return;
            
            if (!snapshot.exists()) {
                ordersContainer.innerHTML = '<p>Nessun ordine trovato</p>';
                return;
            }
            
            const orders = [];
            snapshot.forEach(childSnapshot => {
                orders.push({
                    id: childSnapshot.key,
                    ...childSnapshot.val()
                });
            });
            
            // Ordina per data (più recenti prima)
            orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            
            ordersContainer.innerHTML = orders.map(order => {
                const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Data non disponibile';
                
                return `
                    <div class="order-item">
                        <div class="order-header">
                            <h4>Ordine #${order.id.substring(0, 8)}</h4>
                            <span class="order-date">${date}</span>
                            <span class="order-status status-${order.status}">${order.status}</span>
                        </div>
                        <div class="order-total">Totale: €${order.total.toFixed(2)}</div>
                        <div class="order-items">
                            ${order.items.map(item => `
                                <div class="order-product">
                                    <span>${item.name} x${item.quantity}</span>
                                    <span>€${(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }).join('');
        })
        .catch(error => {
            console.error('Errore nel caricamento degli ordini:', error);
        });
}

// Funzioni checkout
function showCheckoutModal() {
    if (cart.length === 0) {
        alert('Il carrello è vuoto');
        return;
    }
    
    if (!currentUser) {
        alert('Devi effettuare il login per procedere con l\'ordine');
        showSection('login');
        return;
    }
    
    const modal = document.getElementById('checkout-modal');
    if (modal) {
        modal.style.display = 'block';
        
        // Popola il riepilogo dell'ordine
        const orderSummary = document.getElementById('order-summary');
        if (orderSummary) {
            const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            orderSummary.innerHTML = `
                <h3>Riepilogo Ordine</h3>
                ${cart.map(item => `
                    <div class="order-item-summary">
                        <span>${item.name} x${item.quantity}</span>
                        <span>€${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                `).join('')}
                <div class="order-total-summary">
                    <strong>Totale: €${total.toFixed(2)}</strong>
                </div>
            `;
        }
    }
}

function handleCheckout(e) {
    e.preventDefault();
    
    const deliveryAddress = document.getElementById('delivery-address').value;
    const deliveryNotes = document.getElementById('delivery-notes').value;
    
    if (!deliveryAddress.trim()) {
        alert('Inserisci l\'indirizzo di consegna');
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const orderData = {
        userId: currentUser.uid,
        items: cart,
        total: total,
        deliveryAddress: deliveryAddress,
        deliveryNotes: deliveryNotes,
        status: 'pending',
        createdAt: firebase.database.ServerValue.TIMESTAMP
    };
    
    db.ref('orders').push(orderData)
        .then(() => {
            alert('Ordine inviato con successo!');
            cart = [];
            localStorage.removeItem('cart');
            updateCartUI();
            closeModal();
            showSection('profile');
        })
        .catch(error => {
            alert('Errore nell\'invio dell\'ordine: ' + error.message);
        });
}

function closeModal() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
}

// Funzioni di navigazione
function closeNavbarCollapse() {
    const navbarCollapse = document.querySelector('.navbar-collapse');
    if (navbarCollapse && navbarCollapse.classList.contains('show')) {
        navbarCollapse.classList.remove('show');
    }
}

function showSection(sectionId, addToHistory = true) {
    // Chiudi il menu mobile se aperto
    closeNavbarCollapse();
    
    // Rimuove la classe active da tutte le sezioni
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Aggiunge la classe active alla sezione corrente
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Aggiorna gli stati attivi nella navbar
        document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${sectionId}`) {
                link.classList.add('active');
            }
        });
        
        // Aggiunge alla cronologia del browser se richiesto
        if (addToHistory) {
            const state = { section: sectionId };
            const title = `${getPageTitle(sectionId)} - Azienda Agricola`;
            const url = `#${sectionId}`;
            
            history.pushState(state, title, url);
            document.title = title;
        }
    }
}

function getInitialSection() {
    // Ottiene la sezione dall'URL hash
    const hash = window.location.hash.substring(1);
    const validSections = ['home', 'categories', 'products', 'cart', 'login', 'profile'];
    
    if (hash && validSections.includes(hash)) {
        return hash;
    }
    
    return 'home'; // sezione predefinita
}

function getPageTitle(sectionId) {
    const titles = {
        'home': 'Home',
        'categories': 'Categorie',
        'products': 'Prodotti',
        'cart': 'Carrello',
        'login': 'Accesso',
        'profile': 'Profilo'
    };
    
    return titles[sectionId] || 'Home';
}

function updateUI() {
    const loginLink = document.querySelector('a[href="#login"]');
    const profileLink = document.querySelector('a[href="#profile"]');
    const logoutBtn = document.querySelector('a[href="#logout"]');
    
    if (currentUser) {
        if (loginLink) loginLink.style.display = 'none';
        if (profileLink) profileLink.style.display = 'inline';
        if (logoutBtn) logoutBtn.style.display = 'inline';
    } else {
        if (loginLink) loginLink.style.display = 'inline';
        if (profileLink) profileLink.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
    }
    
    // Aggiorna il badge del carrello se presente
    const cartBadge = document.querySelector('.cart-badge');
    if (cartBadge) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartBadge.textContent = totalItems;
        cartBadge.style.display = totalItems > 0 ? 'inline' : 'none';
    }
}
