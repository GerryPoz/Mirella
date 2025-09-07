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
    // Aspetta che Firebase sia completamente caricato
    setTimeout(() => {
        try {
            // Initialize Firebase services
            db = window.db || firebase.database();
            auth = firebase.auth(); // Inizializza auth direttamente qui
            
            console.log('Firebase services initialized:', { db: !!db, auth: !!auth });
            
            // Start the app
            initializeApp();
        } catch (error) {
            console.error('Error initializing Firebase:', error);
            // Fallback: riprova dopo un altro secondo
            setTimeout(() => {
                db = window.db || firebase.database();
                auth = firebase.auth();
                initializeApp();
            }, 1000);
        }
    }, 500);
});

function initializeApp() {
    console.log('Initializing app...');
    
    setupEventListeners();
    loadData();
    loadCart();
    
    // Auth state listener con gestione errori
    if (auth) {
        auth.onAuthStateChanged(function(user) {
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
    } else {
        console.error('Auth service not available');
    }
    
    // Show home section by default
    showSection('home');
}

// ... existing code ...

function loadData() {
    console.log('Loading data...');
    
    if (!db) {
        console.error('Database service not available');
        return;
    }
    
    // Initialize sample data if database is empty
    initializeSampleData();
    
    // Load categories con gestione errori
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
            console.log('No categories found, initializing sample data...');
        }
    }, function(error) {
        console.error('Error loading categories:', error);
    });
    
    // Load products con gestione errori
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

// ... existing code ...

function handleLogin(e) {
    e.preventDefault();
    
    if (!auth) {
        showMessage('Servizio di autenticazione non disponibile', 'error');
        return;
    }
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    console.log('Attempting login for:', email);
    
    auth.signInWithEmailAndPassword(email, password)
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
    
    if (!auth) {
        showMessage('Servizio di autenticazione non disponibile', 'error');
        return;
    }
    
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
    
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log('Registration successful:', userCredential.user.email);
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
    if (!auth) {
        showMessage('Servizio di autenticazione non disponibile', 'error');
        return;
    }
    
    console.log('Logging out...');
    
    auth.signOut().then(() => {
        console.log('Logout successful');
        showMessage('Logout effettuato con successo!', 'success');
        showSection('home');
    }).catch(error => {
        console.error('Logout error:', error);
        showMessage('Errore durante il logout', 'error');
    });
}

// ... existing code ...

function initializeSampleData() {
    if (!db) {
        console.error('Database not available for sample data initialization');
        return;
    }
    
    console.log('Checking for existing data...');
    
    // Check if data already exists
    db.ref('categories').once('value')
        .then(snapshot => {
            if (!snapshot.exists()) {
                console.log('No existing data found, initializing sample data...');
                
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
                
                return db.ref('categories').set(categoriesData);
            } else {
                console.log('Categories already exist');
            }
        })
        .then(() => {
            // Check and initialize products
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
