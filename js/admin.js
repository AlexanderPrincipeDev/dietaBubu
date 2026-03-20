// admin.js - Creador y Administrador de Dietas

class AdminPanel {
    constructor() {
        this.init();
    }

    init() {
        this.select = document.getElementById('admin-category-select');
        this.list = document.getElementById('admin-items-list');
        this.addRow = document.getElementById('admin-add-row');
        this.inputNew = document.getElementById('admin-new-item');
        this.btnAdd = document.getElementById('btn-admin-add');
        this.btnSave = document.getElementById('btn-admin-save');
        this.btnMigrate = document.getElementById('btn-admin-migrate');
        
        // El objeto de trabajo (clon del estado actual)
        this.workingData = null;
        this.currentCategory = null;

        if (!this.select) return; // Si no existe la vista en HTML, ignorar.

        this.setupEvents();
    }

    setupEvents() {
        // Evento para migrar/inicializar
        this.btnMigrate.addEventListener('click', async () => {
            if (confirm("¿Seguro que deseas sobrescribir la nube con la dieta contenida localmente?")) {
                try {
                    this.btnMigrate.innerHTML = '<i class="ti ti-loader"></i> Restaurando...';
                    const uid = window.app && window.app.currentUser ? window.app.currentUser.uid : null;
                    if (!uid) throw new Error("Debes iniciar sesión primero");
                    
                    await window.db.collection('userDiets').doc(uid).set(window.dietaBubu);
                    
                    if(window.app) window.app.showToast("¡Dieta inicial restaurada con éxito a Firestore!", "success");
                    else alert("¡Dieta inicial subida con éxito a Firestore!");
                    
                    this.btnMigrate.innerHTML = '<i class="ti ti-check"></i> Carga Completa';
                    
                    // Trigger reload en la app si existe
                    if (window.app && typeof window.app.loadCloudDiet === 'function') {
                        await window.app.loadCloudDiet();
                    }
                    this.refreshEditor();
                } catch (e) {
                    console.error(e);
                    if(window.app) window.app.showToast("Error subiendo datos a la nube.", "error");
                    else alert("Error subiendo datos a la nube. Revisa consola.");
                    this.btnMigrate.innerHTML = '<i class="ti ti-cloud-upload"></i> Cargar dieta inicial a la nube';
                }
            }
        });

        // Eventos del editor
        const navBtn = document.getElementById('nav-btn-admin');
        if (navBtn) {
            navBtn.addEventListener('click', () => {
                this.refreshEditor(); // Carga las categorias cuando entramos
            });
        }

        this.select.addEventListener('change', (e) => {
            this.currentCategory = e.target.value;
            this.renderItems();
        });

        this.btnAdd.addEventListener('click', () => {
            this.addItem();
        });

        this.inputNew.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addItem();
        });

        this.btnSave.addEventListener('click', async () => {
            if (!this.workingData) return;
            const btn = this.btnSave;
            btn.disabled = true;
            btn.innerHTML = '<i class="ti ti-loader"></i> Guardando...';

            try {
                const uid = window.app && window.app.currentUser ? window.app.currentUser.uid : null;
                if (!uid) throw new Error("Debes iniciar sesión primero");
                
                await window.db.collection('userDiets').doc(uid).set(this.workingData);
                
                if(window.app) window.app.showToast("¡Cambios guardados exitosamente en la nube!", "success");
                else alert("¡Cambios guardados exitosamente en la nube!");
                
                // Actualizar la app en caliente
                if (window.app) {
                    // Update global state
                    Object.assign(window.app.generator.data, this.workingData);
                    window.dietaBubu = window.app.generator.data;
                    localStorage.setItem('cloudDietData', JSON.stringify(window.dietaBubu));
                    
                    // Refresh view
                    window.app.setupShoppingList();
                    window.app.renderMenu();
                    window.app.setupAlerts();
                }
            } catch(e) {
                console.error(e);
                if(window.app) window.app.showToast("Error al guardar cambios.", "error");
                else alert("Error al guardar cambios.");
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<i class="ti ti-device-floppy"></i> Guardar Cambios en la Nube';
            }
        });
    }

    refreshEditor() {
        // Clonamos la data actual viva (la que app.js tiene en ese momento)
        this.workingData = JSON.parse(JSON.stringify(window.dietaBubu));
        
        // Poblar select
        this.select.innerHTML = '<option value="">-- Selecciona una categoría --</option>';
        if (this.workingData.alimentos) {
            Object.keys(this.workingData.alimentos).forEach(cat => {
                const opt = document.createElement('option');
                opt.value = `alimentos|${cat}`;
                let catName = cat.replace(/_/g, " ").toUpperCase();
                opt.textContent = `Alimentos: ${catName}`;
                this.select.appendChild(opt);
            });
        }
        
        // Tipos basicos
        ['recomendacionesGenerales', 'noPermitidos', 'bebidasPermitidas'].forEach(k => {
            if (this.workingData[k]) {
                const opt = document.createElement('option');
                opt.value = `array|${k}`;
                opt.textContent = `Lista: ${k}`;
                this.select.appendChild(opt);
            }
        });

        this.list.innerHTML = '';
        this.addRow.style.display = 'none';
        
        // El boton de guardar solo aparece si hay data cargada en el editor
        if (Object.keys(this.workingData).length > 0) {
            this.btnSave.style.display = 'inline-flex';
        }
    }

    renderItems() {
        this.list.innerHTML = '';
        if (!this.currentCategory) {
            this.addRow.style.display = 'none';
            return;
        }

        const [type, key] = this.currentCategory.split('|');
        let arrayRef = [];

        if (type === 'alimentos') {
            arrayRef = this.workingData.alimentos[key];
        } else if (type === 'array') {
            arrayRef = this.workingData[key];
        }

        arrayRef.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'admin-item-row mb-2 section-anim';
            div.style.display = 'flex';
            div.style.justifyContent = 'space-between';
            div.style.alignItems = 'center';
            div.style.padding = '0.7rem';
            div.style.background = 'rgba(255,255,255,0.6)';
            div.style.borderRadius = '12px';
            div.style.border = '1px solid rgba(0,0,0,0.05)';
            if (document.body.classList.contains('dark-mode')) {
                div.style.background = 'rgba(0,0,0,0.2)';
            }

            const text = document.createElement('span');
            text.textContent = item;
            text.style.fontSize = '0.9rem';

            const delBtn = document.createElement('button');
            delBtn.className = 'btn-icon';
            delBtn.style.color = 'var(--danger)';
            delBtn.innerHTML = '<i class="ti ti-trash"></i>';
            delBtn.addEventListener('click', () => {
                if (confirm(`¿Eliminar "${item}" permanentemente al guardar?`)) {
                    arrayRef.splice(index, 1);
                    this.renderItems();
                }
            });

            div.appendChild(text);
            div.appendChild(delBtn);
            this.list.appendChild(div);
        });

        this.addRow.style.display = 'flex';
        this.inputNew.focus();
    }

    addItem() {
        const val = this.inputNew.value.trim();
        if (!val || !this.currentCategory) return;

        const [type, key] = this.currentCategory.split('|');
        if (type === 'alimentos') {
            this.workingData.alimentos[key].push(val);
        } else if (type === 'array') {
            this.workingData[key].push(val);
        }

        this.inputNew.value = '';
        this.renderItems();
    }
}

// Iniciar cuando el DOM cargue
window.addEventListener('load', () => {
    // Si DietaApp está instanciado, esperamos que cargue el window.dietaBubu
    // Igual refreshEditor() lee el estado vivo.
    window.adminPanel = new AdminPanel();
});
