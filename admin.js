let categories = [];
let products = [];
let orders = [];

document.addEventListener('DOMContentLoaded', function() {
    loadData();
});

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
        renderCategoriesTable();
        updateProductCategorySelect();
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
        renderProductsTable();
        updateStats();
    });
    
    // Carica ordini
    db.ref('orders').on('value', (snapshot) => {
        orders = [];
        snapshot.forEach((child) => {
            orders.push({
                id: child.key,
                ...child.val()
            });
        });
        renderOrdersTable();
        updateStats();
    });
}

function showAdminSection(sectionId, element) {
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    document.querySelectorAll('.admin-tabs button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(sectionId).classList.add('active');
    if (element) {
        element.classList.add('active');
    }
}

// Gestione Categorie
function addCategory() {
    const name = document.getElementById('category-name').value;
    const description = document.getElementById('category-desc').value;
    
    if (!name) {
        alert('Inserisci il nome della categoria');
        return;
    }
    
    db.ref('categories').push({
        name,
        description,
        createdAt: firebase.database.ServerValue.TIMESTAMP
    }).then(() => {
        document.getElementById('category-name').value = '';
        document.getElementById('category-desc').value = '';
        alert('Categoria aggiunta!');
    }).catch(error => {
        alert('Errore: ' + error.message);
    });
}

function renderCategoriesTable() {
    const tbody = document.getElementById('categories-table');
    tbody.innerHTML = categories.map(category => `
        <tr>
            <td>${category.name}</td>
            <td>${category.description || ''}</td>
            <td class="action-buttons">
                <button class="btn-small btn-edit" onclick="editCategory('${category.id}')">Modifica</button>
                <button class="btn-small btn-delete" onclick="deleteCategory('${category.id}')">Elimina</button>
            </td>
        </tr>
    `).join('');
}

function editCategory(id) {
    const category = categories.find(c => c.id === id);
    if (!category) return;
    
    const newName = prompt('Nuovo nome categoria:', category.name);
    if (newName === null) return; // Utente ha annullato
    
    const newDescription = prompt('Nuova descrizione:', category.description || '');
    if (newDescription === null) return; // Utente ha annullato
    
    if (!newName.trim()) {
        alert('Il nome della categoria non può essere vuoto');
        return;
    }
    
    db.ref(`categories/${id}`).update({
        name: newName.trim(),
        description: newDescription.trim(),
        updatedAt: firebase.database.ServerValue.TIMESTAMP
    }).then(() => {
        alert('Categoria aggiornata!');
    }).catch(error => {
        alert('Errore: ' + error.message);
    });
}

function deleteCategory(id) {
    if (confirm('Sei sicuro di voler eliminare questa categoria?')) {
        db.ref(`categories/${id}`).remove()
            .then(() => alert('Categoria eliminata!'))
            .catch(error => alert('Errore: ' + error.message));
    }
}

// Gestione Prodotti
function addProduct() {
    const name = document.getElementById('product-name').value;
    const description = document.getElementById('product-desc').value;
    const price = parseFloat(document.getElementById('product-price').value);
    const stock = parseInt(document.getElementById('product-stock').value);
    const categoryId = document.getElementById('product-category').value;
    const unit = document.getElementById('product-unit').value || 'kg';
    
    if (!name || !price || !stock || !categoryId) {
        alert('Compila tutti i campi obbligatori');
        return;
    }
    
    db.ref('products').push({
        name,
        description,
        price,
        stock,
        categoryId,
        unit,
        createdAt: firebase.database.ServerValue.TIMESTAMP
    }).then(() => {
        document.getElementById('product-name').value = '';
        document.getElementById('product-desc').value = '';
        document.getElementById('product-price').value = '';
        document.getElementById('product-stock').value = '';
        document.getElementById('product-unit').value = '';
        alert('Prodotto aggiunto!');
    }).catch(error => {
        alert('Errore: ' + error.message);
    });
}

function renderProductsTable() {
    const tbody = document.getElementById('products-table');
    tbody.innerHTML = products.map(product => {
        const category = categories.find(c => c.id === product.categoryId);
        return `
            <tr>
                <td>${product.name}</td>
                <td>${category ? category.name : 'N/A'}</td>
                <td>€${product.price.toFixed(2)}</td>
                <td>${product.stock}</td>
                <td>${product.unit}</td>
                <td class="action-buttons">
                    <button class="btn-small btn-edit" onclick="editProduct('${product.id}')">Modifica</button>
                    <button class="btn-small btn-delete" onclick="deleteProduct('${product.id}')">Elimina</button>
                </td>
            </tr>
        `;
    }).join('');
}

function editProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    // Crea un form di modifica più user-friendly
    const newName = prompt('Nuovo nome prodotto:', product.name);
    if (newName === null) return;
    
    const newDescription = prompt('Nuova descrizione:', product.description || '');
    if (newDescription === null) return;
    
    const newPrice = prompt('Nuovo prezzo (€):', product.price);
    if (newPrice === null) return;
    
    const newStock = prompt('Nuovo stock:', product.stock);
    if (newStock === null) return;
    
    const newUnit = prompt('Nuova unità di misura:', product.unit || 'kg');
    if (newUnit === null) return;
    
    // Validazione
    if (!newName.trim()) {
        alert('Il nome del prodotto non può essere vuoto');
        return;
    }
    
    const price = parseFloat(newPrice);
    if (isNaN(price) || price <= 0) {
        alert('Inserisci un prezzo valido');
        return;
    }
    
    const stock = parseInt(newStock);
    if (isNaN(stock) || stock < 0) {
        alert('Inserisci uno stock valido');
        return;
    }
    
    // Aggiorna il prodotto
    db.ref(`products/${id}`).update({
        name: newName.trim(),
        description: newDescription.trim(),
        price: price,
        stock: stock,
        unit: newUnit.trim(),
        categoryId: product.categoryId, // Mantieni la categoria originale
        updatedAt: firebase.database.ServerValue.TIMESTAMP
    }).then(() => {
        alert('Prodotto aggiornato!');
    }).catch(error => {
        alert('Errore: ' + error.message);
    });
}

function updateProductCategorySelect() {
    const select = document.getElementById('product-category');
    select.innerHTML = '<option value="">Seleziona categoria</option>' +
        categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
}

function deleteProduct(id) {
    if (confirm('Sei sicuro di voler eliminare questo prodotto?')) {
        db.ref(`products/${id}`).remove()
            .then(() => alert('Prodotto eliminato!'))
            .catch(error => alert('Errore: ' + error.message));
    }
}

// Gestione Ordini
function renderOrdersTable() {
    const tbody = document.getElementById('orders-table');
    tbody.innerHTML = orders.map(order => `
        <tr>
            <td>#${order.id.substring(0, 8)}</td>
            <td>User ${order.userId.substring(0, 8)}</td>
            <td>${new Date(order.createdAt).toLocaleDateString()}</td>
            <td>${order.pickupDate}</td>
            <td>€${order.totalAmount.toFixed(2)}</td>
            <td>
                <select onchange="updateOrderStatus('${order.id}', this.value)">
                    <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pendente</option>
                    <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confermato</option>
                    <option value="ready" ${order.status === 'ready' ? 'selected' : ''}>Pronto</option>
                    <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completato</option>
                    <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Annullato</option>
                </select>
            </td>
            <td class="action-buttons">
                <button class="btn-small btn-delete" onclick="deleteOrder('${order.id}')">Elimina</button>
            </td>
        </tr>
    `).join('');
}

function updateOrderStatus(orderId, newStatus) {
    db.ref(`orders/${orderId}`).update({
        status: newStatus,
        updatedAt: firebase.database.ServerValue.TIMESTAMP
    }).then(() => {
        alert('Stato ordine aggiornato!');
    }).catch(error => {
        alert('Errore: ' + error.message);
    });
}

function deleteOrder(id) {
    if (confirm('Sei sicuro di voler eliminare questo ordine?')) {
        db.ref(`orders/${id}`).remove()
            .then(() => alert('Ordine eliminato!'))
            .catch(error => alert('Errore: ' + error.message));
    }
}

// Statistiche
function updateStats() {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const activeProducts = products.filter(p => p.stock > 0).length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    
    document.getElementById('total-orders').textContent = totalOrders;
    document.getElementById('total-revenue').textContent = `€${totalRevenue.toFixed(2)}`;
    document.getElementById('active-products').textContent = activeProducts;
    document.getElementById('pending-orders').textContent = pendingOrders;
}
