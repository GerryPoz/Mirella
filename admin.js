let categories = [];
let products = [];
let orders = [];

document.addEventListener('DOMContentLoaded', function() {
    loadData();
});

// Funzione per convertire file in base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
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
    const imageFile = document.getElementById('category-image').files[0];
    
    if (!name) {
        alert('Inserisci il nome della categoria');
        return;
    }
    
    const saveCategory = (imageData = null) => {
        db.ref('categories').push({
            name,
            description,
            image: imageData,
            createdAt: firebase.database.ServerValue.TIMESTAMP
        }).then(() => {
            document.getElementById('category-name').value = '';
            document.getElementById('category-desc').value = '';
            document.getElementById('category-image').value = '';
            alert('Categoria aggiunta!');
        }).catch(error => {
            alert('Errore: ' + error.message);
        });
    };
    
    if (imageFile) {
        fileToBase64(imageFile)
            .then(base64 => saveCategory(base64))
            .catch(error => {
                console.error('Errore conversione immagine:', error);
                saveCategory();
            });
    } else {
        saveCategory();
    }
}

function renderCategoriesTable() {
    const tbody = document.getElementById('categories-table');
    tbody.innerHTML = categories.map(category => `
        <tr>
            <td>
                ${category.image ? 
                    `<img src="${category.image}" alt="${category.name}" class="image-preview">` : 
                    `<div class="no-image">📷</div>`
                }
            </td>
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
    
    // Crea modal per modifica categoria
    const modal = document.createElement('div');
    modal.className = 'edit-modal';
    modal.innerHTML = `
        <div class="edit-modal-content">
            <div class="edit-modal-header">
                <h3>Modifica Categoria</h3>
                <span class="edit-close" onclick="closeEditModal()">&times;</span>
            </div>
            <div class="edit-modal-body">
                <div class="form-group">
                    <label>Nome categoria:</label>
                    <input type="text" id="edit-category-name" value="${category.name}">
                </div>
                <div class="form-group">
                    <label>Descrizione:</label>
                    <input type="text" id="edit-category-desc" value="${category.description || ''}">
                </div>
                <div class="form-group">
                    <label>Immagine attuale:</label>
                    <div class="current-image">
                        ${category.image ? 
                            `<img src="${category.image}" alt="${category.name}" class="edit-image-preview">` : 
                            `<div class="no-image-placeholder">📷 Nessuna immagine</div>`
                        }
                    </div>
                </div>
                <div class="form-group">
                    <label>Nuova immagine (opzionale):</label>
                    <input type="file" id="edit-category-image" accept="image/*">
                </div>
            </div>
            <div class="edit-modal-footer">
                <button onclick="closeEditModal()" class="btn-secondary">Annulla</button>
                <button onclick="saveEditCategory('${id}')" class="btn-primary">Salva Modifiche</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
}

function saveEditCategory(id) {
    const newName = document.getElementById('edit-category-name').value.trim();
    const newDescription = document.getElementById('edit-category-desc').value.trim();
    const imageFile = document.getElementById('edit-category-image').files[0];
    
    if (!newName) {
        alert('Il nome della categoria non può essere vuoto');
        return;
    }
    
    const updateCategory = (imageData = null) => {
        const updateData = {
            name: newName,
            description: newDescription,
            updatedAt: firebase.database.ServerValue.TIMESTAMP
        };
        
        // Aggiorna l'immagine solo se ne è stata selezionata una nuova
        if (imageData !== null) {
            updateData.image = imageData;
        }
        
        db.ref(`categories/${id}`).update(updateData).then(() => {
            alert('Categoria aggiornata!');
            closeEditModal();
        }).catch(error => {
            alert('Errore: ' + error.message);
        });
    };
    
    if (imageFile) {
        fileToBase64(imageFile)
            .then(base64 => updateCategory(base64))
            .catch(error => {
                console.error('Errore conversione immagine:', error);
                alert('Errore nel caricamento dell\'immagine');
            });
    } else {
        updateCategory();
    }
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
    const imageFile = document.getElementById('product-image').files[0];
    
    if (!name || !price || !stock || !categoryId) {
        alert('Compila tutti i campi obbligatori');
        return;
    }
    
    const saveProduct = (imageData = null) => {
        db.ref('products').push({
            name,
            description,
            price,
            stock,
            categoryId,
            unit,
            image: imageData,
            available: true, // Nuovo prodotto disponibile di default
            createdAt: firebase.database.ServerValue.TIMESTAMP
        }).then(() => {
            document.getElementById('product-name').value = '';
            document.getElementById('product-desc').value = '';
            document.getElementById('product-price').value = '';
            document.getElementById('product-stock').value = '';
            document.getElementById('product-unit').value = '';
            document.getElementById('product-image').value = '';
            alert('Prodotto aggiunto!');
        }).catch(error => {
            alert('Errore: ' + error.message);
        });
    };
    
    if (imageFile) {
        fileToBase64(imageFile)
            .then(base64 => saveProduct(base64))
            .catch(error => {
                console.error('Errore conversione immagine:', error);
                saveProduct();
            });
    } else {
        saveProduct();
    }
}

function renderProductsTable() {
    const tbody = document.getElementById('products-table');
    tbody.innerHTML = products.map(product => {
        const category = categories.find(c => c.id === product.categoryId);
        const isAvailable = product.available !== false; // Default true se non specificato
        const availabilityStatus = isAvailable ? 'Disponibile' : 'Non Disponibile';
        const availabilityClass = isAvailable ? 'status-available' : 'status-unavailable';
        const toggleButtonText = isAvailable ? 'Nascondi' : 'Mostra';
        
        return `
            <tr>
                <td>
                    ${product.image ? 
                        `<img src="${product.image}" alt="${product.name}" class="image-preview">` : 
                        `<div class="no-image">📷</div>`
                    }
                </td>
                <td>${product.name}</td>
                <td>${category ? category.name : 'N/A'}</td>
                <td>€${product.price.toFixed(2)}</td>
                <td>${product.stock}</td>
                <td>${product.unit}</td>
                <td>
                    <span class="availability-status ${availabilityClass}">${availabilityStatus}</span>
                </td>
                <td class="action-buttons">
                    <button class="btn-small btn-toggle" onclick="toggleProductAvailability('${product.id}')">${toggleButtonText}</button>
                    <button class="btn-small btn-edit" onclick="editProduct('${product.id}')">Modifica</button>
                    <button class="btn-small btn-delete" onclick="deleteProduct('${product.id}')">Elimina</button>
                </td>
            </tr>
        `;
    }).join('');
}

function toggleProductAvailability(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    const newAvailability = product.available !== false ? false : true;
    const statusText = newAvailability ? 'disponibile' : 'non disponibile';
    
    if (confirm(`Sei sicuro di voler rendere questo prodotto ${statusText}?`)) {
        db.ref(`products/${id}`).update({
            available: newAvailability,
            updatedAt: firebase.database.ServerValue.TIMESTAMP
        }).then(() => {
            alert(`Prodotto reso ${statusText}!`);
        }).catch(error => {
            alert('Errore: ' + error.message);
        });
    }
}

function editProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    // Crea modal per modifica prodotto
    const modal = document.createElement('div');
    modal.className = 'edit-modal';
    modal.innerHTML = `
        <div class="edit-modal-content">
            <div class="edit-modal-header">
                <h3>Modifica Prodotto</h3>
                <span class="edit-close" onclick="closeEditModal()">&times;</span>
            </div>
            <div class="edit-modal-body">
                <div class="form-group">
                    <label>Nome prodotto:</label>
                    <input type="text" id="edit-product-name" value="${product.name}">
                </div>
                <div class="form-group">
                    <label>Descrizione:</label>
                    <input type="text" id="edit-product-desc" value="${product.description || ''}">
                </div>
                <div class="form-group">
                    <label>Prezzo (€):</label>
                    <input type="number" id="edit-product-price" value="${product.price}" step="0.01">
                </div>
                <div class="form-group">
                    <label>Stock:</label>
                    <input type="number" id="edit-product-stock" value="${product.stock}">
                </div>
                <div class="form-group">
                    <label>Unità di misura:</label>
                    <input type="text" id="edit-product-unit" value="${product.unit || 'kg'}">
                </div>
                <div class="form-group">
                    <label>Immagine attuale:</label>
                    <div class="current-image">
                        ${product.image ? 
                            `<img src="${product.image}" alt="${product.name}" class="edit-image-preview">` : 
                            `<div class="no-image-placeholder">📷 Nessuna immagine</div>`
                        }
                    </div>
                </div>
                <div class="form-group">
                    <label>Nuova immagine (opzionale):</label>
                    <input type="file" id="edit-product-image" accept="image/*">
                </div>
            </div>
            <div class="edit-modal-footer">
                <button onclick="closeEditModal()" class="btn-secondary">Annulla</button>
                <button onclick="saveEditProduct('${id}')" class="btn-primary">Salva Modifiche</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
}

function saveEditProduct(id) {
    const newName = document.getElementById('edit-product-name').value.trim();
    const newDescription = document.getElementById('edit-product-desc').value.trim();
    const newPrice = parseFloat(document.getElementById('edit-product-price').value);
    const newStock = parseInt(document.getElementById('edit-product-stock').value);
    const newUnit = document.getElementById('edit-product-unit').value.trim();
    const imageFile = document.getElementById('edit-product-image').files[0];
    
    if (!newName) {
        alert('Il nome del prodotto non può essere vuoto');
        return;
    }
    
    if (isNaN(newPrice) || newPrice <= 0) {
        alert('Inserisci un prezzo valido');
        return;
    }
    
    if (isNaN(newStock) || newStock < 0) {
        alert('Inserisci uno stock valido');
        return;
    }
    
    const updateProduct = (imageData = null) => {
        const updateData = {
            name: newName,
            description: newDescription,
            price: newPrice,
            stock: newStock,
            unit: newUnit,
            updatedAt: firebase.database.ServerValue.TIMESTAMP
        };
        
        // Aggiorna l'immagine solo se ne è stata selezionata una nuova
        if (imageData !== null) {
            updateData.image = imageData;
        }
        
        db.ref(`products/${id}`).update(updateData).then(() => {
            alert('Prodotto aggiornato!');
            closeEditModal();
        }).catch(error => {
            alert('Errore: ' + error.message);
        });
    };
    
    if (imageFile) {
        fileToBase64(imageFile)
            .then(base64 => updateProduct(base64))
            .catch(error => {
                console.error('Errore conversione immagine:', error);
                alert('Errore nel caricamento dell\'immagine');
            });
    } else {
        updateProduct();
    }
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
    
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Nessun ordine trovato</td></tr>';
        return;
    }

    console.log('Rendering orders table. Total orders:', orders.length);
    
    // Per ogni ordine, carica anche i dati del cliente
    const orderPromises = orders.map(order => {
        console.log('Processing order:', {
            orderId: order.id,
            userId: order.userId,
            userEmail: order.userEmail
        });
        
        // Verifica che userId esista
        if (!order.userId) {
            console.warn('Order without userId:', order.id);
            return Promise.resolve({
                ...order,
                customerName: order.userEmail ? order.userEmail.split('@')[0] : 'Utente sconosciuto',
                customerEmail: order.userEmail || 'Email non disponibile',
                customerPhone: 'Non specificato',
                customerAddress: 'Non specificato'
            });
        }
        
        return db.ref(`users/${order.userId}`).once('value')
            .then(userSnapshot => {
                const userData = userSnapshot.val();
                console.log(`User data for ${order.userId}:`, userData);
                
                // Logica migliorata per il recupero dei dati
                let customerName, customerEmail, customerPhone, customerAddress;
                
                if (userData && typeof userData === 'object') {
                    // Se esistono dati utente nel database, usali
                    customerName = userData.name || userData.displayName || 
                                 (order.userEmail ? order.userEmail.split('@')[0] : 'Nome non disponibile');
                    customerEmail = userData.email || order.userEmail || 'Email non disponibile';
                    customerPhone = (userData.phone && userData.phone !== 'N/A' && userData.phone.trim() !== '') 
                                  ? userData.phone : 'Non specificato';
                    customerAddress = (userData.address && userData.address !== 'N/A' && userData.address.trim() !== '') 
                                    ? userData.address : 'Non specificato';
                } else {
                    console.warn(`No user data found for userId: ${order.userId}`);
                    // Se non ci sono dati utente, usa i dati dall'ordine
                    customerName = order.userEmail ? order.userEmail.split('@')[0] : 'Nome non disponibile';
                    customerEmail = order.userEmail || 'Email non disponibile';
                    customerPhone = 'Non specificato';
                    customerAddress = 'Non specificato';
                }
                
                return {
                    ...order,
                    customerName,
                    customerEmail,
                    customerPhone,
                    customerAddress
                };
            })
            .catch(error => {
                console.error(`Error loading user data for order ${order.id}, userId ${order.userId}:`, error);
                
                // Gestione dettagliata degli errori
                let errorType = 'Errore sconosciuto';
                if (error.code === 'PERMISSION_DENIED') {
                    errorType = 'Permessi negati';
                } else if (error.code === 'NETWORK_ERROR') {
                    errorType = 'Errore di rete';
                }
                
                return {
                    ...order,
                    customerName: order.userEmail ? order.userEmail.split('@')[0] : `Errore: ${errorType}`,
                    customerEmail: order.userEmail || 'N/A',
                    customerPhone: `Errore: ${errorType}`,
                    customerAddress: `Errore: ${errorType}`
                };
            });
    });
    
    Promise.all(orderPromises).then(ordersWithCustomers => {
        console.log('Orders with customer data:', ordersWithCustomers);
        
        tbody.innerHTML = ordersWithCustomers.map(order => {
            const itemsList = order.items ? order.items.map(item => 
                `<div class="order-item-detail">
                    <strong>${item.name}</strong><br>
                    Quantità: ${item.quantity} ${item.unit || 'pz'} - €${(item.price * item.quantity).toFixed(2)}
                </div>`
            ).join('') : 'Nessun prodotto';
            
            // Formatta la data e l'orario di ritiro per la visualizzazione nella tabella
            let pickupDisplayText = 'Da definire';
            if (order.pickupDate && order.pickupDate !== 'Da definire') {
                if (order.pickupDateRaw && order.pickupTime) {
                    // Nuovo formato con data e orario separati
                    const formattedDate = new Date(order.pickupDateRaw).toLocaleDateString('it-IT');
                    const timeText = order.pickupTime === 'mattina' ? 'Mattina' : 'Pomeriggio';
                    pickupDisplayText = `${formattedDate}<br><small>${timeText}</small>`;
                } else {
                    // Formato precedente (stringa completa)
                    pickupDisplayText = order.pickupDate;
                }
            }
            
            return `
                <tr>
                    <td>
                        <strong>#${order.id.substring(0, 8)}</strong>
                        <button class="btn-small btn-info" onclick="toggleOrderDetails('${order.id}')" style="margin-left: 10px;">Dettagli</button>
                    </td>
                    <td>
                        <div class="customer-info">
                            <strong>${order.customerName}</strong><br>
                            <small>${order.customerEmail}</small><br>
                            <small>Tel: ${order.customerPhone}</small>
                        </div>
                    </td>
                    <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                    <td>${pickupDisplayText}</td>
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
                <tr id="details-${order.id}" class="order-details-row" style="display: none;">
                    <td colspan="7">
                        <div class="order-details-content">
                            <div class="customer-details">
                                <h4>Dettagli Cliente:</h4>
                                <p><strong>Nome:</strong> ${order.customerName}</p>
                                <p><strong>Email:</strong> ${order.customerEmail}</p>
                                <p><strong>Telefono:</strong> ${order.customerPhone}</p>
                                <p><strong>Indirizzo:</strong> ${order.customerAddress}</p>
                                ${order.notes ? `<p><strong>Note ordine:</strong> ${order.notes}</p>` : ''}
                            </div>
                            <div class="order-products">
                                <h4>Prodotti Ordinati:</h4>
                                ${itemsList}
                            </div>
                            <div class="pickup-details" style="grid-column: 1 / -1; margin-top: 15px; padding: 15px; background: #e8f5e8; border-radius: 5px; border-left: 4px solid #28a745;">
                                <h4 style="color: #155724; margin-top: 0;">Dettagli Ritiro:</h4>
                                ${order.pickupDateRaw && order.pickupTime ? `
                                    <p><strong>Data prevista:</strong> ${new Date(order.pickupDateRaw).toLocaleDateString('it-IT', { 
                                        weekday: 'long', 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                    })}</p>
                                    <p><strong>Orario:</strong> ${order.pickupTime === 'mattina' ? 'Mattina (9:00 - 12:00)' : 'Pomeriggio (15:00 - 18:00)'}</p>
                                ` : `
                                    <p><strong>Ritiro:</strong> ${order.pickupDate || 'Da definire'}</p>
                                `}
                            </div>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }).catch(error => {
        console.error('Error rendering orders table:', error);
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: red;">Errore nel caricamento degli ordini. Controlla la console per dettagli.</td></tr>';
    });
}

// Funzione per mostrare/nascondere i dettagli dell'ordine
function toggleOrderDetails(orderId) {
    const detailsRow = document.getElementById(`details-${orderId}`);
    if (detailsRow.style.display === 'none') {
        detailsRow.style.display = 'table-row';
    } else {
        detailsRow.style.display = 'none';
    }
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

function closeEditModal() {
    const modal = document.querySelector('.edit-modal');
    if (modal) {
        modal.remove();
    }
}

// Chiudi modal cliccando fuori
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('edit-modal')) {
        closeEditModal();
    }
});
