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
    showSection(initialSection, false);
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
    // Navigation - adattato alla nuova struttura del menu
    document.querySelectorAll('.nav-menu .nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const href = e.target.getAttribute('href');
            if (href && href.startsWith('#')) {
                const section = href.substring(1);
                if (section === 'logout') {
                    handleLogout();
                } else {
                    showSection(section);
                }
            }
        });
    });
    
    // Mobile menu toggle
    const mobileToggle = document.querySelector('.mobile-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }
    
    // Gestione pulsanti avanti/indietro del browser
    window.addEventListener('popstate', (e) => {
        if (e.state && e.state.section) {
            showSection(e.state.section, false);
        } else {
            showSection('home', false);
        }
    });
    
    // Auth forms
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Form toggles
    const showRegisterBtn = document.getElementById('show-register');
    const showLoginBtn = document.getElementById('show-login');
    
    if (showRegisterBtn) {
        showRegisterBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (loginForm) loginForm.style.display = 'none';
            if (registerForm) registerForm.style.display = 'block';
        });
    }
    
    if (showLoginBtn) {
        showLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
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
    
    // CTA button nella hero section
    const ctaButton = document.querySelector('.cta-button');
    if (ctaButton) {
        ctaButton.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('products');
        });
    }
    
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal();
        }
    });
}

function loadData() {
    // Carica categorie da Realtime Database
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
    
    // Carica prodotti da Realtime Database
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
    const categoriesContainer = document.getElementById('categories-container');
    if (!categoriesContainer) return;
    
    categoriesContainer.innerHTML = categories.map(category => `
        <div class="card category-card" onclick="filterByCategory('${category.id}')">
            <div class="card-image">
                <img src="${category.image || 'ellisse1.png'}" alt="${category.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 10px;">
            </div>
            <h3>${category.name}</h3>
            <p>${category.description || ''}</p>
        </div>
    `).join('');
}

function renderProducts() {
    const productsContainer = document.getElementById('products-container');
    if (!productsContainer) return;
    
    const filteredProducts = getFilteredProducts();
    
    if (filteredProducts.length === 0) {
        productsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                <h3>Nessun prodotto trovato</h3>
                <p>Prova a modificare i filtri di ricerca</p>
            </div>
        `;
        return;
    }
    
    productsContainer.innerHTML = filteredProducts.map(product => `
        <div class="card product-card">
            <div class="card-image">
                <img src="${product.image || 'ellisse1.png'}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 10px;">
            </div>
            <h3>${product.name}</h3>
            <p class="product-description">${product.description || ''}</p>
            <div class="product-price">€${product.price.toFixed(2)}</div>
            <button class="add-to-cart-btn" onclick="addToCart('${product.id}')">
                <i class="fas fa-cart-plus"></i> Aggiungi al Carrello
            </button>
        </div>
    `).join('');
}

function renderFeaturedProducts() {
    const featuredContainer = document.getElementById('featured-products');
    if (!featuredContainer) return;
    
    const featured = products.filter(p => p.featured).slice(0, 3);
    
    featuredContainer.innerHTML = featured.map(product => `
        <div class="card product-card">
            <div class="card-image">
                <img src="${product.image || 'ellisse1.png'}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 10px;">
            </div>
            <h3>${product.name}</h3>
            <p>${product.description || ''}</p>
            <div class="product-price">€${product.price.toFixed(2)}</div>
            <button class="add-to-cart-btn" onclick="addToCart('${product.id}')">
                <i class="fas fa-cart-plus"></i> Aggiungi
            </button>
        </div>
    `).join('');
}

function getFilteredProducts() {
    let filtered = [...products];
    
    const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
    const selectedCategory = document.getElementById('category-filter')?.value || '';
    
    if (searchTerm) {
        filtered = filtered.filter(product => 
            product.name.toLowerCase().includes(searchTerm) ||
            (product.description && product.description.toLowerCase().includes(searchTerm))
        );
    }
    
    if (selectedCategory) {
        filtered = filtered.filter(product => product.categoryId === selectedCategory);
    }
    
    return filtered;
}

function filterProducts() {
    renderProducts();
}

function filterByCategory(categoryId) {
    showSection('products');
    setTimeout(() => {
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            categoryFilter.value = categoryId;
            filterProducts();
        }
    }, 100);
}

function updateCategoryFilter() {
    const categoryFilter = document.getElementById('category-filter');
    if (!categoryFilter) return;
    
    categoryFilter.innerHTML = '<option value="">Tutte le categorie</option>' +
        categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
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
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
    
    // Feedback visivo
    const button = event.target;
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i> Aggiunto!';
    button.style.background = '#27ae60';
    
    setTimeout(() => {
        button.innerHTML = originalText;
        button.style.background = '';
    }, 1500);
}

function changeQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;
    
    item.quantity += change;
    
    if (item.quantity <= 0) {
        cart = cart.filter(item => item.id !== productId);
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
}

function updateCartUI() {
    // Aggiorna badge del carrello
    const cartBadge = document.querySelector('.cart-badge');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    if (cartBadge) {
        cartBadge.textContent = totalItems;
        cartBadge.style.display = totalItems > 0 ? 'block' : 'none';
    }
    
    // Aggiorna contenuto del carrello
    const cartContainer = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    const emptyCart = document.getElementById('empty-cart');
    const checkoutBtn = document.getElementById('checkout-btn');
    
    if (!cartContainer) return;
    
    if (cart.length === 0) {
        if (emptyCart) emptyCart.style.display = 'block';
        cartContainer.innerHTML = '';
        if (cartTotal) cartTotal.textContent = '€0.00';
        if (checkoutBtn) checkoutBtn.style.display = 'none';
        return;
    }
    
    if (emptyCart) emptyCart.style.display = 'none';
    if (checkoutBtn) checkoutBtn.style.display = 'block';
    
    cartContainer.innerHTML = cart.map((item, index) => `
        <div class="cart-item">
            <img src="${item.image || 'ellisse1.png'}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-details">
                <h4>${item.name}</h4>
                <p class="cart-item-price">€${item.price.toFixed(2)}</p>
            </div>
            <div class="cart-item-controls">
                <button onclick="updateCartQuantity(${index}, -1)" class="quantity-btn">-</button>
                <span class="quantity">${item.quantity}</span>
                <button onclick="updateCartQuantity(${index}, 1)" class="quantity-btn">+</button>
                <button onclick="removeFromCart(${index})" class="remove-btn">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (cartTotal) cartTotal.textContent = `€${total.toFixed(2)}`;
}

function updateCartQuantity(index, change) {
    if (cart[index]) {
        cart[index].quantity += change;
        
        if (cart[index].quantity <= 0) {
            cart.splice(index, 1);
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartUI();
    }
}

function removeFromCart(index) {
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
}

function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            showSection('home');
            document.getElementById('login-form').reset();
        })
        .catch(error => {
            alert('Errore di login: ' + error.message);
        });
}

function handleRegister(e) {
    e.preventDefault();
    
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const name = document.getElementById('register-name').value;
    
    if (password !== confirmPassword) {
        alert('Le password non corrispondono');
        return;
    }
    
    if (password.length < 6) {
        alert('La password deve essere di almeno 6 caratteri');
        return;
    }
    
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            return userCredential.user.updateProfile({
                displayName: name
            });
        })
        .then(() => {
            showSection('home');
            document.getElementById('register-form').reset();
        })
        .catch(error => {
            alert('Errore di registrazione: ' + error.message);
        });
}

function handleLogout() {
    auth.signOut().then(() => {
        showSection('home');
    }).catch(error => {
        console.error('Errore durante il logout:', error);
    });
}

function loadUserProfile() {
    if (!currentUser) return;
    
    const profileInfo = document.getElementById('profile-info');
    if (profileInfo) {
        profileInfo.innerHTML = `
            <div class="profile-card">
                <div class="profile-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="profile-details">
                    <h3>${currentUser.displayName || 'Utente'}</h3>
                    <p>${currentUser.email}</p>
                    <p><small>Membro dal: ${new Date(currentUser.metadata.creationTime).toLocaleDateString('it-IT')}</small></p>
                </div>
            </div>
        `;
    }
    
    // Carica ordini utente da Realtime Database
    db.ref('orders').orderByChild('userId').equalTo(currentUser.uid).on('value', (snapshot) => {
        const ordersContainer = document.getElementById('orders-history');
        if (!ordersContainer) return;
        
        if (!snapshot.exists()) {
            ordersContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-shopping-bag" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                    <h3>Nessun ordine trovato</h3>
                    <p>I tuoi ordini appariranno qui</p>
                </div>
            `;
            return;
        }
        
        const orders = [];
        snapshot.forEach((childSnapshot) => {
            orders.push({ 
                id: childSnapshot.key, 
                ...childSnapshot.val() 
            });
        });
        
        // Ordina per data (più recenti prima)
        orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        ordersContainer.innerHTML = orders.map(order => `
            <div class="order-card">
                <div class="order-header">
                    <h4>Ordine #${order.id.substring(0, 8)}</h4>
                    <span class="order-status status-${order.status}">${getStatusText(order.status)}</span>
                </div>
                <div class="order-details">
                    <p><strong>Data:</strong> ${new Date(order.createdAt).toLocaleDateString('it-IT')}</p>
                    <p><strong>Totale:</strong> €${order.total.toFixed(2)}</p>
                    <p><strong>Indirizzo:</strong> ${order.address}</p>
                </div>
                <div class="order-items">
                    ${order.items.map(item => `
                        <div class="order-item">
                            <span>${item.name} x${item.quantity}</span>
                            <span>€${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    });
}

function getStatusText(status) {
    const statusMap = {
        'pending': 'In attesa',
        'confirmed': 'Confermato',
        'preparing': 'In preparazione',
        'ready': 'Pronto',
        'delivered': 'Consegnato',
        'cancelled': 'Annullato'
    };
    return statusMap[status] || status;
}

function requireAuth() {
    if (!currentUser) {
        showSection('login');
        return false;
    }
    return true;
}

function showCheckoutModal() {
    if (!requireAuth()) return;
    
    if (cart.length === 0) {
        alert('Il carrello è vuoto');
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
                <h4>Riepilogo Ordine</h4>
                ${cart.map(item => `
                    <div class="summary-item">
                        <span>${item.name} x${item.quantity}</span>
                        <span>€${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                `).join('')}
                <div class="summary-total">
                    <strong>Totale: €${total.toFixed(2)}</strong>
                </div>
            `;
        }
    }
}

function handleCheckout(e) {
    e.preventDefault();
    
    if (!currentUser) {
        alert('Devi essere loggato per effettuare un ordine');
        return;
    }
    
    const formData = new FormData(e.target);
    const orderData = {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: currentUser.displayName || 'Utente',
        items: cart,
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        address: formData.get('address'),
        phone: formData.get('phone'),
        notes: formData.get('notes') || '',
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    
    // Salva ordine nel Realtime Database
    db.ref('orders').push(orderData)
        .then(() => {
            alert('Ordine inviato con successo!');
            cart = [];
            localStorage.removeItem('cart');
            updateCartUI();
            closeModal();
            showSection('profile');
            loadUserProfile();
        })
        .catch(error => {
            console.error('Errore nell\'invio dell\'ordine:', error);
            alert('Errore nell\'invio dell\'ordine. Riprova.');
        });
}

function closeModal() {
    const modal = document.getElementById('checkout-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function showSection(sectionId, addToHistory = true) {
    // Chiudi menu mobile se aperto
    const navMenu = document.getElementById('nav-menu');
    if (navMenu) {
        navMenu.classList.remove('active');
    }
    
    // Controlla autenticazione per sezioni protette
    if (sectionId === 'profile' && !requireAuth()) {
        return;
    }
    
    // Nascondi tutte le sezioni
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Mostra la sezione richiesta
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Aggiorna stati attivi della navbar
    document.querySelectorAll('.nav-menu .nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
        }
    });
    
    // Gestisci cronologia del browser
    if (addToHistory) {
        const title = getPageTitle(sectionId);
        document.title = title;
        history.pushState({ section: sectionId }, title, `#${sectionId}`);
    }
    
    // Scroll to top
    window.scrollTo(0, 0);
}

function getInitialSection() {
    const hash = window.location.hash.substring(1);
    const validSections = ['home', 'products', 'cart', 'login', 'profile'];
    return validSections.includes(hash) ? hash : 'home';
}

function getPageTitle(sectionId) {
    const titles = {
        'home': 'Azienda Agricola Mirella - Prodotti Freschi e Genuini',
        'products': 'Prodotti - Azienda Agricola Mirella',
        'cart': 'Carrello - Azienda Agricola Mirella',
        'login': 'Accedi - Azienda Agricola Mirella',
        'profile': 'Il Mio Profilo - Azienda Agricola Mirella'
    };
    return titles[sectionId] || titles['home'];
}

function updateUI() {
    const loginLink = document.querySelector('a[href="#login"]');
    const profileLink = document.querySelector('a[href="#profile"]');
    const logoutLink = document.querySelector('a[href="#logout"]');
    
    if (currentUser) {
        if (loginLink) loginLink.style.display = 'none';
        if (profileLink) profileLink.style.display = 'block';
        if (logoutLink) logoutLink.style.display = 'block';
    } else {
        if (loginLink) loginLink.style.display = 'block';
        if (profileLink) profileLink.style.display = 'none';
        if (logoutLink) logoutLink.style.display = 'none';
    }
}
