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
    // Navigation
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = e.target.getAttribute('href').substring(1);
            showSection(section);
        });
    });
    
    // Gestione pulsanti avanti/indietro del browser
    window.addEventListener('popstate', (e) => {
        if (e.state && e.state.section) {
            showSection(e.state.section, false); // false = non aggiungere alla cronologia
        } else {
            showSection('home', false);
        }
    });
    
    // Auth forms
    document.getElementById('login-submit').addEventListener('click', handleLogin);
    document.getElementById('register-submit').addEventListener('click', handleRegister);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    // Form toggles
    document.getElementById('show-register').addEventListener('click', () => {
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('register-form').style.display = 'block';
    });
    
    document.getElementById('show-login').addEventListener('click', () => {
        document.getElementById('register-form').style.display = 'none';
        document.getElementById('login-form').style.display = 'block';
    });
    
    // Search and filters
    document.getElementById('search-input').addEventListener('input', filterProducts);
    document.getElementById('category-filter').addEventListener('change', filterProducts);
    
    // Checkout
    document.getElementById('checkout-btn').addEventListener('click', showCheckoutModal);
    document.getElementById('checkout-form').addEventListener('submit', handleCheckout);
    
    // Modal close
    document.querySelector('.close').addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal();
        }
    });
}

function loadData() {
    // Carica categorie
    db.ref('categories').on('value', (snapshot) => {
        categories = [];
        snapshot.forEach((child) => {
            categories.push({
                id: child.key,
                ...child.val()
            });
        });
        renderCategories();
        updateCategoryFilter();
    });
    
    // Carica prodotti
    db.ref('products').on('value', (snapshot) => {
        products = [];
        snapshot.forEach((child) => {
            products.push({
                id: child.key,
                ...child.val()
            });
        });
        renderProducts();
        renderFeaturedProducts();
    });
}

function renderCategories() {
    const grid = document.getElementById('categories-grid');
    grid.innerHTML = categories.map(category => `
        <div class="category-card" onclick="filterByCategory('${category.id}')">
            <h3>${category.name}</h3>
            <p>${category.description || ''}</p>
        </div>
    `).join('');
}

function renderProducts() {
    const grid = document.getElementById('products-grid');
    const filteredProducts = getFilteredProducts();
    
    grid.innerHTML = filteredProducts.map(product => `
        <div class="product-card">
            ${product.image ? `<img src="${product.image}" alt="${product.name}">` : '<div class="no-image">📦</div>'}
            <h3>${product.name}</h3>
            <p class="description">${product.description || ''}</p>
            <div class="price">€${product.price.toFixed(2)}/${product.unit || 'kg'}</div>
            <div class="stock">Disponibili: ${product.stock}</div>
            ${product.stock > 0 ? `
                <div class="quantity-controls">
                    <button onclick="changeQuantity('${product.id}', -1)">-</button>
                    <span id="qty-${product.id}">1</span>
                    <button onclick="changeQuantity('${product.id}', 1)">+</button>
                </div>
                <button onclick="addToCart('${product.id}')" class="btn-primary">Aggiungi al Carrello</button>
            ` : '<button class="btn-disabled" disabled>Esaurito</button>'}
        </div>
    `).join('');
}

function renderFeaturedProducts() {
    const grid = document.getElementById('featured-grid');
    const featured = products.filter(p => p.stock > 0).slice(0, 6);
    
    grid.innerHTML = featured.map(product => `
        <div class="product-card">
            ${product.image ? `<img src="${product.image}" alt="${product.name}">` : '<div class="no-image">📦</div>'}
            <h3>${product.name}</h3>
            <div class="price">€${product.price.toFixed(2)}/${product.unit || 'kg'}</div>
            <button onclick="addToCart('${product.id}')" class="btn-primary">Aggiungi</button>
        </div>
    `).join('');
}

function getFilteredProducts() {
    let filtered = products;
    
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const categoryFilter = document.getElementById('category-filter').value;
    
    if (searchTerm) {
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(searchTerm) ||
            (p.description && p.description.toLowerCase().includes(searchTerm))
        );
    }
    
    if (categoryFilter) {
        filtered = filtered.filter(p => p.categoryId === categoryFilter);
    }
    
    return filtered;
}

function filterProducts() {
    renderProducts();
}

function filterByCategory(categoryId) {
    document.getElementById('category-filter').value = categoryId;
    showSection('products');
    filterProducts();
}

function updateCategoryFilter() {
    const select = document.getElementById('category-filter');
    select.innerHTML = '<option value="">Tutte le categorie</option>' +
        categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
}

// Gestione carrello
function addToCart(productId) {
    if (!currentUser) {
        alert('Devi effettuare l\'accesso per aggiungere prodotti al carrello');
        showSection('login');
        return;
    }
    
    const product = products.find(p => p.id === productId);
    const quantity = parseInt(document.getElementById(`qty-${productId}`).textContent);
    
    const existingItem = cart.find(item => item.productId === productId);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            productId,
            name: product.name,
            price: product.price,
            unit: product.unit,
            quantity
        });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
    alert(`${product.name} aggiunto al carrello!`);
}

function changeQuantity(productId, change) {
    const qtyElement = document.getElementById(`qty-${productId}`);
    let qty = parseInt(qtyElement.textContent) + change;
    qty = Math.max(1, qty);
    qtyElement.textContent = qty;
}

function updateCartUI() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    document.getElementById('cart-count').textContent = count;
    document.getElementById('cart-total').textContent = total.toFixed(2);
    
    const cartItems = document.getElementById('cart-items');
    if (cart.length === 0) {
        cartItems.innerHTML = '<p>Il carrello è vuoto</p>';
    } else {
        cartItems.innerHTML = cart.map((item, index) => `
            <div class="cart-item">
                <h4>${item.name}</h4>
                <div class="item-controls">
                    <button onclick="updateCartQuantity(${index}, -1)">-</button>
                    <span>${item.quantity} ${item.unit}</span>
                    <button onclick="updateCartQuantity(${index}, 1)">+</button>
                    <button onclick="removeFromCart(${index})" class="btn-remove">Rimuovi</button>
                </div>
                <div class="item-total">€${(item.price * item.quantity).toFixed(2)}</div>
            </div>
        `).join('');
    }
}

function updateCartQuantity(index, change) {
    cart[index].quantity += change;
    if (cart[index].quantity <= 0) {
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

// Autenticazione
function handleLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            alert('Accesso effettuato con successo!');
            showSection('home');
        })
        .catch(error => {
            alert('Errore: ' + error.message);
        });
}

function handleRegister() {
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const phone = document.getElementById('register-phone').value;
    const address = document.getElementById('register-address').value;
    const password = document.getElementById('register-password').value;
    
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Salva profilo utente
            return db.ref(`users/${userCredential.user.uid}`).set({
                name,
                email,
                phone,
                address,
                createdAt: firebase.database.ServerValue.TIMESTAMP
            });
        })
        .then(() => {
            alert('Registrazione completata!');
            showSection('home');
        })
        .catch(error => {
            alert('Errore: ' + error.message);
        });
}

function handleLogout() {
    auth.signOut().then(() => {
        cart = [];
        localStorage.removeItem('cart');
        updateCartUI();
        showSection('home');
        alert('Disconnesso con successo!');
    });
}

function loadUserProfile() {
    if (!currentUser) return;
    
    db.ref(`users/${currentUser.uid}`).once('value')
        .then(snapshot => {
            const userData = snapshot.val();
            if (userData) {
                document.getElementById('profile-details').innerHTML = `
                    <p><strong>Nome:</strong> ${userData.name}</p>
                    <p><strong>Email:</strong> ${userData.email}</p>
                    <p><strong>Telefono:</strong> ${userData.phone || 'Non specificato'}</p>
                    <p><strong>Indirizzo:</strong> ${userData.address || 'Non specificato'}</p>
                `;
            }
        });
    
    // Carica ordini utente
    db.ref('orders').orderByChild('userId').equalTo(currentUser.uid)
        .on('value', snapshot => {
            const orders = [];
            snapshot.forEach(child => {
                orders.push({
                    id: child.key,
                    ...child.val()
                });
            });
            
            const ordersList = document.getElementById('orders-list');
            if (orders.length === 0) {
                ordersList.innerHTML = '<p>Nessun ordine trovato</p>';
            } else {
                ordersList.innerHTML = orders.map(order => {
                    const statusLabels = {
                        'pending': 'In attesa',
                        'confirmed': 'Confermato',
                        'ready': 'Pronto per il ritiro',
                        'completed': 'Completato',
                        'cancelled': 'Annullato'
                    };
                    
                    const itemsList = order.items ? order.items.map(item => `
                        <div class="order-product">
                            <span class="product-name">${item.name}</span>
                            <span class="product-details">Quantità: ${item.quantity} ${item.unit || 'pz'} - €${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    `).join('') : '<p>Nessun prodotto trovato</p>';
                    
                    return `
                        <div class="order-item">
                            <div class="order-header">
                                <h4>Ordine #${order.id.substring(0, 8)}</h4>
                                <span class="order-status status-${order.status}">${statusLabels[order.status] || order.status}</span>
                            </div>
                            <div class="order-info">
                                <p><strong>Data ordine:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
                                <p><strong>Data ritiro:</strong> ${order.pickupDate}</p>
                                ${order.notes ? `<p><strong>Note:</strong> ${order.notes}</p>` : ''}
                            </div>
                            <div class="order-products">
                                <h5>Prodotti ordinati:</h5>
                                ${itemsList}
                            </div>
                            <div class="order-total">
                                <strong>Totale: €${order.totalAmount.toFixed(2)}</strong>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        });
}

// Checkout
function showCheckoutModal() {
    if (cart.length === 0) {
        alert('Il carrello è vuoto!');
        return;
    }
    
    if (!currentUser) {
        alert('Devi effettuare l\'accesso per completare l\'ordine');
        showSection('login');
        return;
    }
    
    // Imposta data minima (domani)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('pickup-date').min = tomorrow.toISOString().split('T')[0];
    
    // Mostra riepilogo
    const checkoutItems = document.getElementById('checkout-items');
    checkoutItems.innerHTML = cart.map(item => `
        <div class="checkout-item">
            <span>${item.name} x ${item.quantity} ${item.unit}</span>
            <span>€${(item.price * item.quantity).toFixed(2)}</span>
        </div>
    `).join('');
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    document.getElementById('checkout-total').textContent = total.toFixed(2);
    
    document.getElementById('checkout-modal').style.display = 'block';
}

function handleCheckout(e) {
    e.preventDefault();
    
    const pickupDate = document.getElementById('pickup-date').value;
    const notes = document.getElementById('order-notes').value;
    
    const order = {
        userId: currentUser.uid,
        items: cart,
        totalAmount: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        pickupDate,
        notes,
        status: 'pending',
        createdAt: firebase.database.ServerValue.TIMESTAMP
    };
    
    db.ref('orders').push(order)
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
    document.getElementById('checkout-modal').style.display = 'none';
}

// Utility functions
function showSection(sectionId, addToHistory = true) {
    // Rimuove la classe active da tutte le sezioni
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Aggiunge la classe active alla sezione corrente
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        
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
    const loginLink = document.getElementById('login-link');
    const profileLink = document.getElementById('profile-link');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (currentUser) {
        loginLink.style.display = 'none';
        profileLink.style.display = 'inline';
        logoutBtn.style.display = 'inline';
    } else {
        loginLink.style.display = 'inline';
        profileLink.style.display = 'none';
        logoutBtn.style.display = 'none';
    }
}
