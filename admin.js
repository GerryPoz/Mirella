// Funzione per convertire file in base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Gestione Categorie - versione aggiornata
async function addCategory() {
    const name = document.getElementById('category-name').value;
    const description = document.getElementById('category-desc').value;
    const imageFile = document.getElementById('category-image').files[0];
    
    if (!name) {
        alert('Inserisci il nome della categoria');
        return;
    }
    
    let imageData = null;
    if (imageFile) {
        try {
            imageData = await fileToBase64(imageFile);
        } catch (error) {
            alert('Errore nel caricamento dell\'immagine: ' + error.message);
            return;
        }
    }
    
    const categoryData = {
        name,
        description,
        createdAt: firebase.database.ServerValue.TIMESTAMP
    };
    
    if (imageData) {
        categoryData.image = imageData;
    }
    
    db.ref('categories').push(categoryData).then(() => {
        document.getElementById('category-name').value = '';
        document.getElementById('category-desc').value = '';
        document.getElementById('category-image').value = '';
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
            <td>
                ${category.image ? 
                    `<img src="${category.image}" alt="${category.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;">` : 
                    'Nessuna immagine'
                }
            </td>
            <td class="action-buttons">
                <button class="btn-small btn-edit" onclick="editCategory('${category.id}')">Modifica</button>
                <button class="btn-small btn-delete" onclick="deleteCategory('${category.id}')">Elimina</button>
            </td>
        </tr>
    `).join('');
}

async function editCategory(id) {
    const category = categories.find(c => c.id === id);
    if (!category) return;
    
    const newName = prompt('Nuovo nome categoria:', category.name);
    if (newName === null) return;
    
    const newDescription = prompt('Nuova descrizione:', category.description || '');
    if (newDescription === null) return;
    
    const changeImage = confirm('Vuoi cambiare l\'immagine?');
    let newImageData = category.image;
    
    if (changeImage) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = async function(e) {
            const file = e.target.files[0];
            if (file) {
                try {
                    newImageData = await fileToBase64(file);
                } catch (error) {
                    alert('Errore nel caricamento dell\'immagine: ' + error.message);
                    return;
                }
            } else {
                newImageData = null;
            }
            
            // Aggiorna la categoria
            const updates = {
                name: newName,
                description: newDescription,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            };
            
            if (newImageData) {
                updates.image = newImageData;
            }
            
            db.ref(`categories/${id}`).update(updates)
                .then(() => alert('Categoria aggiornata!'))
                .catch(error => alert('Errore: ' + error.message));
        };
        
        input.click();
    } else {
        // Aggiorna solo nome e descrizione
        const updates = {
            name: newName,
            description: newDescription,
            updatedAt: firebase.database.ServerValue.TIMESTAMP
        };
        
        db.ref(`categories/${id}`).update(updates)
            .then(() => alert('Categoria aggiornata!'))
            .catch(error => alert('Errore: ' + error.message));
    }
}

// Gestione Prodotti - versione aggiornata
async function addProduct() {
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
    
    let imageData = null;
    if (imageFile) {
        try {
            imageData = await fileToBase64(imageFile);
        } catch (error) {
            alert('Errore nel caricamento dell\'immagine: ' + error.message);
            return;
        }
    }
    
    const productData = {
        name,
        description,
        price,
        stock,
        categoryId,
        unit,
        createdAt: firebase.database.ServerValue.TIMESTAMP
    };
    
    if (imageData) {
        productData.image = imageData;
    }
    
    db.ref('products').push(productData).then(() => {
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
                <td>
                    ${product.image ? 
                        `<img src="${product.image}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;">` : 
                        'Nessuna immagine'
                    }
                </td>
                <td class="action-buttons">
                    <button class="btn-small btn-edit" onclick="editProduct('${product.id}')">Modifica</button>
                    <button class="btn-small btn-delete" onclick="deleteProduct('${product.id}')">Elimina</button>
                </td>
            </tr>
        `;
    }).join('');
}

async function editProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    const newName = prompt('Nuovo nome prodotto:', product.name);
    if (newName === null) return;
    
    const newDescription = prompt('Nuova descrizione:', product.description || '');
    if (newDescription === null) return;
    
    const newPrice = prompt('Nuovo prezzo (€):', product.price);
    if (newPrice === null) return;
    
    const newStock = prompt('Nuove scorte:', product.stock);
    if (newStock === null) return;
    
    const newUnit = prompt('Nuova unità:', product.unit);
    if (newUnit === null) return;
    
    const changeImage = confirm('Vuoi cambiare l\'immagine?');
    let newImageData = product.image;
    
    if (changeImage) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = async function(e) {
            const file = e.target.files[0];
            if (file) {
                try {
                    newImageData = await fileToBase64(file);
                } catch (error) {
                    alert('Errore nel caricamento dell\'immagine: ' + error.message);
                    return;
                }
            } else {
                newImageData = null;
            }
            
            // Aggiorna il prodotto
            const updates = {
                name: newName,
                description: newDescription,
                price: parseFloat(newPrice),
                stock: parseInt(newStock),
                unit: newUnit,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            };
            
            if (newImageData) {
                updates.image = newImageData;
            }
            
            db.ref(`products/${id}`).update(updates)
                .then(() => alert('Prodotto aggiornato!'))
                .catch(error => alert('Errore: ' + error.message));
        };
        
        input.click();
    } else {
        // Aggiorna senza cambiare l'immagine
        const updates = {
            name: newName,
            description: newDescription,
            price: parseFloat(newPrice),
            stock: parseInt(newStock),
            unit: newUnit,
            updatedAt: firebase.database.ServerValue.TIMESTAMP
        };
        
        db.ref(`products/${id}`).update(updates)
            .then(() => alert('Prodotto aggiornato!'))
            .catch(error => alert('Errore: ' + error.message));
    }
}
