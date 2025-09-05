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
    
    if (!name) {
        alert('Inserisci il nome della categoria');
        return;
    }
    
    // Chiedi se vuole aggiungere un'immagine
    const addImage = confirm('Vuoi aggiungere un\'immagine per questa categoria?');
    let imageData = null;
    
    if (addImage) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = async function(e) {
            const file = e.target.files[0];
            if (file) {
                try {
                    imageData = await fileToBase64(file);
                } catch (error) {
                    alert('Errore nel caricamento dell\'immagine: ' + error.message);
                    return;
                }
            }
            
            // Salva la categoria con l'immagine
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
                alert('Categoria aggiunta!');
            }).catch(error => {
                alert('Errore: ' + error.message);
            });
        };
        
        input.click();
    } else {
        // Salva la categoria senza immagine
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

// Gestione Prodotti - versione aggiornata
async function addProduct() {
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
    
    // Chiedi se vuole aggiungere un'immagine
    const addImage = confirm('Vuoi aggiungere un\'immagine per questo prodotto?');
    let imageData = null;
    
    if (addImage) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = async function(e) {
            const file = e.target.files[0];
            if (file) {
                try {
                    imageData = await fileToBase64(file);
                } catch (error) {
                    alert('Errore nel caricamento dell\'immagine: ' + error.message);
                    return;
                }
            }
            
            // Salva il prodotto con l'immagine
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
                alert('Prodotto aggiunto!');
            }).catch(error => {
                alert('Errore: ' + error.message);
            });
        };
        
        input.click();
    } else {
        // Salva il prodotto senza immagine
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
