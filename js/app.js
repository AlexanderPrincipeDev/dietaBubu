// app.js - Lógica de Interfaz y estado de la aplicación

class DietaApp {
    constructor() {
        this.generator = new DietGenerator(window.dietaBubu);

        // Estado Local
        this.currentMealId = this.generator.getCurrentMealId();
        this.waterGlasses = parseInt(localStorage.getItem('waterGlasses')) || 0;
        this.hasWalked = localStorage.getItem('hasWalked') === 'true';
        this.lastCheckDate = localStorage.getItem('lastCheckDate');
        this.isDarkMode = localStorage.getItem('isDarkMode') === 'true';
        this.weightLog = JSON.parse(localStorage.getItem('weightLog')) || [];
        this.shoppingList = []; // Se llena dinámicamente con smart list
        this.selectedShoppingItems = JSON.parse(localStorage.getItem('selectedShoppingItems')) || {}; // { "categoria|nombre": true }
        this.purchasedItems = JSON.parse(localStorage.getItem('purchasedItems')) || {}; // { "categoria|nombre": true }
        this.isFinalListActive = false; // Toggle entre catálogo y lista final
        this.deferredPrompt = null;

        // Aplicar Dark Mode inicial
        if (this.isDarkMode) document.body.classList.add('dark-mode');
        this.syncThemeColor();

        // Inicialización
        this.init();
    }

    init() {
        this.checkNewDay();
        this.setupDarkMode();

        // Cache management for master diet
        const cachedDiet = localStorage.getItem('cloudDietData');
        if (cachedDiet) {
            try {
                const parsed = JSON.parse(cachedDiet);
                Object.assign(this.generator.data, parsed);
                window.dietaBubu = this.generator.data;
            } catch (e) { }
        }

        // Inicialización prioritaria de lista de compras para evitar errores de carga
        try {
            this.setupShoppingList();
        } catch (e) {
            console.error("Error al inicializar lista de compras:", e);
        }

        // Firebase Auth Config
        this.setupAuth();

        this.setupNavigation();
        this.setupHeader();
        this.setupGenerator();
        this.setupMealTabs();
        this.setupTracker();
        this.setupWeightTracker();
        this.setupSearch();
        this.setupAlerts();
        this.applyInitialViewFromUrl();
        this.initPWAInstall();
    }

    /**
     * Resetea el tracking diario si es un nuevo día
     */
    checkNewDay() {
        const today = new Date().toDateString();
        if (this.lastCheckDate !== today) {
            this.waterGlasses = 0;
            this.hasWalked = false;
            this.generator.clearLocks();
            this.saveState('waterGlasses', 0);
            this.saveState('hasWalked', false);
            this.saveState('lastCheckDate', today);
        }
    }

    /* --- DARK MODE --- */
    setupDarkMode() {
        const btnDark = document.getElementById('btn-dark-mode');
        const icon = btnDark.querySelector('i');

        // Estado inicial icono
        if (this.isDarkMode) {
            icon.className = 'ti ti-sun';
        }

        btnDark.addEventListener('click', () => {
            this.isDarkMode = !this.isDarkMode;
            this.saveState('isDarkMode', this.isDarkMode);
            document.body.classList.toggle('dark-mode');
            this.syncThemeColor();

            // Toggle Icon
            icon.className = this.isDarkMode ? 'ti ti-sun' : 'ti ti-moon';

            // Pequeña animacion boton
            btnDark.style.transform = 'scale(0.8) rotate(90deg)';
            setTimeout(() => btnDark.style.transform = 'none', 200);
        });
    }

    /* --- NAVIGATION MODO SPA --- */
    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => this.activateView(e.currentTarget.getAttribute('data-target')));
        });
    }

    activateView(targetId) {
        if (!targetId) return;

        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach((btn) => btn.classList.toggle('active', btn.getAttribute('data-target') === targetId));

        const views = document.querySelectorAll('.view');
        views.forEach((view) => view.classList.remove('active'));
        window.setTimeout(() => {
            views.forEach((view) => {
                if (!view.classList.contains('active')) view.classList.add('hidden');
            });
        }, 400);

        const targetView = document.getElementById(targetId);
        if (!targetView) return;

        targetView.classList.remove('hidden');
        window.setTimeout(() => targetView.classList.add('active'), 10);
    }

    applyInitialViewFromUrl() {
        const params = new URL(window.location.href).searchParams;
        const requestedView = params.get('view');
        const validViews = new Set(['view-home', 'view-tracker', 'view-search', 'view-alerts']);

        if (validViews.has(requestedView)) {
            this.activateView(requestedView);
        }
    }

    // --- UI HELPERS ---
    showToast(message, type = 'success') {
        const toastEl = document.getElementById('app-toast');
        const iconEl = document.getElementById('toast-icon');
        const msgEl = document.getElementById('toast-message');
        if(!toastEl) return;

        msgEl.textContent = message;
        toastEl.className = 'toast show ' + type;
        
        if (type === 'success') iconEl.className = 'ti ti-check toast-icon';
        else if (type === 'error') iconEl.className = 'ti ti-alert-circle toast-icon';
        else iconEl.className = 'ti ti-info-circle toast-icon';

        if(this._toastTimeout) clearTimeout(this._toastTimeout);
        this._toastTimeout = setTimeout(() => {
            toastEl.classList.remove('show');
        }, 3500);
    }

    // --- FIREBASE SYNC & AUTH ---
    async loadCloudDiet(uid) {
        if (!window.db || !uid) return;
        try {
            const docRef = db.collection('userDiets').doc(uid);
            const doc = await docRef.get();
            if (doc.exists) {
                const cloudData = doc.data();
                Object.assign(this.generator.data, cloudData);
                window.dietaBubu = this.generator.data;
                localStorage.setItem('cloudDietData', JSON.stringify(window.dietaBubu));

                // Refresh UI with latest data
                this.setupShoppingList();
                this.renderMenu();
                this.setupAlerts();
            }
        } catch (e) {
            console.error("No se pudo cargar la dieta personal de la nube:", e);
        }
    }

    saveState(key, value) {
        localStorage.setItem(key, typeof value === 'object' ? JSON.stringify(value) : value);
        if (this.currentUser && window.db) {
            db.collection('users').doc(this.currentUser.uid).set({
                [key]: value
            }, { merge: true }).catch(console.error);
        }
    }

    setupAuth() {
        if (!window.auth) return;

        const profileBtn = document.getElementById('user-profile');
        if (profileBtn) {
            profileBtn.addEventListener('click', () => {
                if (this.currentUser) {
                    if (confirm("¿Deseas cerrar sesión? (Tus datos seguirán guardados en la nube)")) {
                        auth.signOut();
                    }
                } else {
                    const provider = new firebase.auth.GoogleAuthProvider();
                    auth.signInWithPopup(provider).catch(e => {
                        console.error("Login fail:", e);
                        alert("Error al iniciar sesión.");
                    });
                }
            });
        }

        auth.onAuthStateChanged(user => this.handleAuthState(user));
    }

    handleAuthState(user) {
        this.currentUser = user;
        const userNameEl = document.getElementById('user-name');
        const userAvatarEl = document.getElementById('user-avatar');

        if (user) {
            if (userNameEl) {
                userNameEl.textContent = user.displayName ? user.displayName.split(' ')[0] : 'Usuario';
                userNameEl.style.display = 'block';
            }
            if (userAvatarEl) {
                userAvatarEl.src = user.photoURL || 'icons/avatar-evelyn.svg';
            }
            this.updateGreeting();

            // Mostrar pestaña "Mi Dieta" para cualquier usuario logueado
            const navBtnAdmin = document.getElementById('nav-btn-admin');
            if (navBtnAdmin) navBtnAdmin.style.display = 'flex';
            
            // Sync personal diet from Firestore
            this.loadCloudDiet(user.uid);

            // Sync progress from Firestore
            if (window.db) {
                db.collection('users').doc(user.uid).get().then(doc => {
                    if (doc.exists) {
                        const data = doc.data();
                        let changed = false;

                        if (data.waterGlasses !== undefined && data.waterGlasses !== this.waterGlasses) {
                            this.waterGlasses = data.waterGlasses;
                            localStorage.setItem('waterGlasses', this.waterGlasses);
                            changed = true;
                        }
                        if (data.hasWalked !== undefined && data.hasWalked !== this.hasWalked) {
                            this.hasWalked = data.hasWalked;
                            localStorage.setItem('hasWalked', this.hasWalked);
                            changed = true;
                        }
                        if (data.weightLog !== undefined) {
                            this.weightLog = data.weightLog;
                            localStorage.setItem('weightLog', JSON.stringify(this.weightLog));
                            changed = true;
                        }
                        if (data.selectedShoppingItems !== undefined) {
                            this.selectedShoppingItems = data.selectedShoppingItems;
                            localStorage.setItem('selectedShoppingItems', JSON.stringify(this.selectedShoppingItems));
                            changed = true;
                        }
                        if (data.purchasedItems !== undefined) {
                            this.purchasedItems = data.purchasedItems;
                            localStorage.setItem('purchasedItems', JSON.stringify(this.purchasedItems));
                            changed = true;
                        }
                        if (data.lastCheckDate !== undefined) {
                            this.lastCheckDate = data.lastCheckDate;
                            localStorage.setItem('lastCheckDate', this.lastCheckDate);
                        }
                        if (data.isDarkMode !== undefined && data.isDarkMode !== this.isDarkMode) {
                            this.isDarkMode = data.isDarkMode;
                            localStorage.setItem('isDarkMode', this.isDarkMode);
                            if (this.isDarkMode) document.body.classList.add('dark-mode');
                            else document.body.classList.remove('dark-mode');
                            this.syncThemeColor();
                            const icon = document.getElementById('btn-dark-mode')?.querySelector('i');
                            if (icon) icon.className = this.isDarkMode ? 'ti ti-sun' : 'ti ti-moon';
                        }

                        if (changed) {
                            this.renderWaterTracker();
                            this.setupTracker();
                            this.renderWeightSummary();
                            this.renderWeightChart();
                            this.renderShoppingList();
                        }
                    } else {
                        // First time: upload local state to cloud
                        db.collection('users').doc(user.uid).set({
                            waterGlasses: this.waterGlasses,
                            hasWalked: this.hasWalked,
                            weightLog: this.weightLog,
                            selectedShoppingItems: this.selectedShoppingItems,
                            purchasedItems: this.purchasedItems,
                            lastCheckDate: this.lastCheckDate || new Date().toDateString(),
                            isDarkMode: this.isDarkMode
                        });
                    }
                }).catch(e => console.error("Error sincronizando perfil:", e));
            }
        } else {
            if (userNameEl) userNameEl.style.display = 'none';
            if (userAvatarEl) userAvatarEl.src = 'icons/avatar-evelyn.svg';
            
            // Ocultar pestaña Mi Dieta
            const navBtnAdmin = document.getElementById('nav-btn-admin');
            if (navBtnAdmin) navBtnAdmin.style.display = 'none';

            this.updateGreeting();
            // Al hacer logout no vaciamos localStorage para mantener el fallback rápido offline.
        }
    }

    syncThemeColor() {
        const themeColorMeta = document.getElementById('theme-color-meta');
        if (!themeColorMeta) return;

        themeColorMeta.setAttribute('content', this.isDarkMode ? '#3e322f' : '#ff8a65');
    }

    /* --- HEADER (Saludo dinamico) --- */
    setupHeader() {
        const dateElement = document.getElementById('date-display');
        const subtitleElement = document.getElementById('meal-time-subtitle');
        const greetingTitle = document.getElementById('greeting-title');

        // Formato fecha
        const dateOptions = { weekday: 'long', month: 'short', day: 'numeric' };
        let dateString = new Date().toLocaleDateString('es-ES', dateOptions);
        dateString = dateString.charAt(0).toUpperCase() + dateString.slice(1);
        dateElement.textContent = dateString;

        this.updateGreeting();

        // Subtítulo
        subtitleElement.textContent = `Es hora de tu ${this.generator.formatMealName(this.currentMealId)}`;

        // Tip aleatorio
        const tips = this.generator.data.recomendacionesGenerales;
        document.getElementById('daily-tip').textContent = tips[Math.floor(Math.random() * tips.length)];
    }

    updateGreeting() {
        const greetingTitle = document.getElementById('greeting-title');
        if (!greetingTitle) return;

        const hour = new Date().getHours();
        let greeting = '¡Buenos días';
        let emoji = '☀️';
        if (hour >= 12 && hour < 19) {
            greeting = '¡Buenas tardes';
            emoji = '🌤️';
        } else if (hour >= 19 || hour < 5) {
            greeting = '¡Buenas noches';
            emoji = '🌙';
        }
        
        let firstName = 'Evelyn';
        if (this.currentUser && this.currentUser.displayName) {
            firstName = this.currentUser.displayName.split(' ')[0];
        }
        
        greetingTitle.textContent = `${greeting}, ${firstName}!!! ${emoji}`;
    }

    /* --- GENERADOR DE DIETA --- */
    setupGenerator() {
        const btnGenerate = document.getElementById('btn-generate-random');
        btnGenerate.addEventListener('click', () => {
            // Añadir pequeña animacion al boton
            btnGenerate.style.transform = 'rotate(180deg)';
            setTimeout(() => btnGenerate.style.transform = 'none', 300);
            this.renderMenu();
        });

        // Renderizar por primera vez
        this.renderMenu();

        this.setupShareWhatsApp();
    }

    /* --- COMPARTIR WHATSAPP --- */
    setupShareWhatsApp() {
        const btnShare = document.getElementById('btn-share-whatsapp');
        if (btnShare) {
            btnShare.addEventListener('click', () => {
                this.shareMenu();
            });
        }
    }

    shareMenu() {
        const menuData = this.generator.generateMenu(this.currentMealId);
        if (!menuData) return;

        let text = `*${menuData.mealName} - Dieta Bubu* 🤰\n\n`;

        // 1. Agrupar los items por categoria (reutilizando lógica de render para consistencia)
        const groupedItems = {};
        menuData.items.forEach(item => {
            if (!groupedItems[item.categoria]) {
                groupedItems[item.categoria] = [];
            }
            groupedItems[item.categoria].push(item);
        });

        const iconMap = {
            'lacteos': '🥛',
            'huevos': '🥚',
            'cereales': '🌾',
            'cereales_desayuno': '🌾',
            'cereales_almuerzo': '🥔',
            'cereales_cena': '🥔',
            'fruta': '🍎',
            'fruta_cubos': '🍎',
            'fruta_mediana': '🍊',
            'grasas': '🥑',
            'grasas_snack': '🥜',
            'grasas_almuerzo': '🥑',
            'grasas_cena': '🥑',
            'verduras': '🥗',
            'carne': '🥩',
            'carne_almuerzo': '🥩',
            'carne_cena': '🍗'
        };

        for (const [categoria, items] of Object.entries(groupedItems)) {
            const icon = iconMap[categoria] || '•';
            items.forEach(item => {
                text += `${icon} ${item.name}\n`;
            });
        }

        text += `\n_Generado el ${new Date().toLocaleDateString('es-ES')}_`;

        const encodedText = encodeURIComponent(text);
        const whatsappUrl = `https://wa.me/?text=${encodedText}`;

        window.open(whatsappUrl, '_blank');
    }


    /* --- SELECTOR MANUAL DE COMIDA (TABS) --- */
    setupMealTabs() {
        const tabs = document.querySelectorAll('.meal-tab');

        // Activar el tab correspondiente a la hora actual
        tabs.forEach(tab => {
            if (tab.dataset.meal === this.currentMealId) {
                tab.classList.add('active');
                // Scroll the active tab into center view
                setTimeout(() => tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }), 100);
            }

            tab.addEventListener('click', () => {
                const selectedMeal = tab.dataset.meal;
                if (selectedMeal === this.currentMealId) return; // Ya está activo

                // Update active tab style
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                // Update state
                this.currentMealId = selectedMeal;
                this.generator.clearLocks();

                // Update header subtitle
                const subtitleEl = document.getElementById('meal-time-subtitle');
                if (subtitleEl) subtitleEl.textContent = `Viendo: ${this.generator.formatMealName(selectedMeal)}`;

                // Animate + re-render
                const container = document.getElementById('meal-portions-container');
                container.style.opacity = '0';
                container.style.transition = 'none';

                // Render immediately
                this.renderMenu();

                // Fade in
                requestAnimationFrame(() => {
                    container.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
                    container.style.opacity = '1';
                    container.style.transform = 'none';
                });
            });
        });
    }

    renderMenu() {
        const container = document.getElementById('meal-portions-container');
        const menuData = this.generator.generateMenu(this.currentMealId);

        if (!menuData) {
            container.innerHTML = '<p>Error al generar el menú.</p>';
            return;
        }

        container.innerHTML = ''; // Limpiar

        // 1. Agrupar los items por categoria
        const groupedItems = {};
        menuData.items.forEach(item => {
            if (!groupedItems[item.categoria]) {
                groupedItems[item.categoria] = [];
            }
            groupedItems[item.categoria].push(item);
        });

        // 2. Renderizar grupos
        for (const [categoria, items] of Object.entries(groupedItems)) {
            // Contenedor del grupo
            const groupDiv = document.createElement('div');
            groupDiv.className = 'category-group mt-3';

            // Titulo de la categoria
            const catTitles = {
                'LACTEOS': 'Lácteos',
                'HUEVOS': 'Huevos',
                'CEREALES_DESAYUNO': 'Cereales',
                'CEREALES_ALMUERZO': 'Cereales',
                'CEREALES_CENA': 'Cereales',
                'CEREALES': 'Cereales',
                'FRUTA_CUBOS': 'Fruta',
                'FRUTA_MEDIANA': 'Fruta',
                'FRUTA': 'Fruta',
                'GRASAS_SNACK': 'Grasas (Frutos Secos)',
                'GRASAS_ALMUERZO': 'Grasas',
                'GRASAS_CENA': 'Grasas',
                'GRASAS': 'Grasas',
                'VERDURAS': 'Verduras',
                'CARNE_ALMUERZO': 'Proteína',
                'CARNE_CENA': 'Proteína',
                'CARNE': 'Proteína'
            };

            let catTitle = catTitles[categoria.toUpperCase()] || categoria.toUpperCase();

            // Buscar el numero de porciones en la definicion
            const porcionDef = menuData.porcionesDef.find(p => p.categoria === categoria);
            const numPorciones = porcionDef ? porcionDef.cantidad : 1;
            const portionText = numPorciones > 1 ? ` (${numPorciones} porciones)` : ` (${numPorciones} porción)`;

            const titleEl = document.createElement('h3');
            titleEl.className = 'category-title';
            titleEl.textContent = `${catTitle}${portionText}`;
            groupDiv.appendChild(titleEl);

            // Renderizar los items de esta categoria
            items.forEach(item => {
                const el = document.createElement('div');
                el.className = 'portion-item section-anim';

                const iconMap = {
                    'lacteos': '🥛',
                    'huevos': '🥚',
                    'cereales': '🌾',
                    'cereales_desayuno': '🌾',
                    'cereales_almuerzo': '🥔',
                    'cereales_cena': '🥔',
                    'fruta': '🍎',
                    'fruta_cubos': '🍎',
                    'fruta_mediana': '🍊',
                    'grasas': '🥑',
                    'grasas_snack': '🥜',
                    'grasas_almuerzo': '🥑',
                    'grasas_cena': '🥑',
                    'verduras': '🥗',
                    'carne': '🥩',
                    'carne_almuerzo': '🥩',
                    'carne_cena': '🍗'
                };

                const isLockedBtn = item.isLocked ? 'locked' : '';
                const lockIcon = item.isLocked ? 'ti-lock' : 'ti-lock-open';

                el.innerHTML = `
                    <div class="portion-icon">${iconMap[item.categoria] || '🍽️'}</div>
                    <div class="portion-text">
                        <p>${item.name}</p>
                    </div>
                    <button class="btn-lock ${isLockedBtn}" data-key="${item.lockedKey}" data-name="${item.name}" aria-label="Fijar ingrediente">
                        <i class="ti ${lockIcon}"></i>
                    </button>
                `;

                // Setup Event Listener for Lock Button
                el.querySelector('.btn-lock').addEventListener('click', (e) => {
                    const btn = e.currentTarget;
                    const lockedState = this.generator.toggleLock(btn.dataset.key, btn.dataset.name);

                    if (lockedState) {
                        btn.classList.add('locked');
                        btn.querySelector('i').className = 'ti ti-lock';
                    } else {
                        btn.classList.remove('locked');
                        btn.querySelector('i').className = 'ti ti-lock-open';
                    }
                });

                groupDiv.appendChild(el);
            });

            container.appendChild(groupDiv);
        }
    }

    /* --- TRACKER DE HÁBITOS --- */
    setupTracker() {
        this.renderWaterTracker();
        const walkBtn = document.getElementById('btn-walk');
        const walkIcon = document.getElementById('walk-icon');

        if (this.hasWalked) {
            if (walkBtn) {
                walkBtn.classList.add('checked');
                walkBtn.innerHTML = '<i class="ti ti-check"></i> ¡Caminata Lograda! 🎉';
            }
            if (walkIcon) {
                walkIcon.style.animation = 'none';
                walkIcon.textContent = '🧘‍♀️'; // Change icon to resting/relaxed when done
            }
        }
    }

    renderWaterTracker() {
        const container = document.getElementById('water-tracker');
        const progressText = document.getElementById('water-progress-text');

        container.innerHTML = '';
        if (progressText) {
            progressText.textContent = `${this.waterGlasses}/8 Vasos`;
        }

        // 8 Vasos
        for (let i = 0; i < 8; i++) {
            const glass = document.createElement('div');
            glass.className = `glass ${i < this.waterGlasses ? 'filled' : ''}`;
            // Use drop icon instead of droplet for the new shape
            glass.innerHTML = '<i class="ti ti-drop"></i>';
            glass.dataset.index = i;

            glass.addEventListener('click', () => {
                // Si haces click en el llenado, lo vacias (Undo). Si no, lo llenas hasta ese vaso.
                if (i === this.waterGlasses - 1) {
                    this.waterGlasses--;
                } else {
                    this.waterGlasses = i + 1;
                }
                this.saveState('waterGlasses', this.waterGlasses);

                // Trigger Confetti si completa los 8 vasos
                if (this.waterGlasses === 8) {
                    this.triggerConfetti();
                }

                this.renderWaterTracker();
            });
            container.appendChild(glass);
        }
    }

    toggleWalk() {
        this.hasWalked = !this.hasWalked;
        this.saveState('hasWalked', this.hasWalked);
        const walkBtn = document.getElementById('btn-walk');
        const walkIcon = document.getElementById('walk-icon');

        if (this.hasWalked) {
            if (walkBtn) {
                walkBtn.classList.add('checked');
                walkBtn.innerHTML = '<i class="ti ti-check"></i> ¡Caminata Lograda! 🎉';
            }
            if (walkIcon) {
                walkIcon.style.animation = 'none';
                walkIcon.textContent = '🧘‍♀️';
            }
            this.triggerConfetti(); // Celebración
        } else {
            if (walkBtn) {
                walkBtn.classList.remove('checked');
                walkBtn.innerHTML = '<i class="ti ti-check"></i> Marcar Completada';
            }
            if (walkIcon) {
                walkIcon.style.animation = 'bounce 2s infinite ease-in-out';
                walkIcon.textContent = '🏃‍♀️';
            }
        }
    }

    /* --- EFECTOS PREMIUM --- */
    triggerConfetti() {
        if (typeof confetti !== 'undefined') {
            const count = 200;
            const defaults = {
                origin: { y: 0.7 }
            };

            function fire(particleRatio, opts) {
                confetti(Object.assign({}, defaults, opts, {
                    particleCount: Math.floor(count * particleRatio)
                }));
            }

            fire(0.25, { spread: 26, startVelocity: 55 });
            fire(0.2, { spread: 60 });
            fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
            fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
            fire(0.1, { spread: 120, startVelocity: 45 });
        }
    }

    /* --- BUSCADOR --- */
    setupSearch() {
        const searchInput = document.getElementById('food-search-input');
        const resultsContainer = document.getElementById('search-results');

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value;

            if (query.length < 2) {
                resultsContainer.innerHTML = '<p class="placeholder-text">Escribe un alimento...</p>';
                return;
            }

            const results = this.generator.searchFood(query);

            if (results.length === 0) {
                resultsContainer.innerHTML = '<p class="placeholder-text">No encontré ese alimento en la lista de la dieta. Asegúrate de escribirlo bien o consultar a Evelyn.</p>';
            } else {
                let html = '';
                results.forEach(res => {
                    if (res.isCraving) {
                        html += `
                        <div class="craving-card mb-2" style="margin-bottom: 15px;">
                            <h3><i class="ti ti-heart-handshake"></i> ¿Antojo de ${res.antojoBuscado}?</h3>
                            <p style="color:var(--text-main); font-size:0.95rem; margin-top:0.3rem;"><strong>Mejor prueba esto:</strong> ${res.sustituto}</p>
                        </div>`;
                    } else if (res.isWarning) {
                        html += `<div class="alert-card warning glass-card mb-2" style="margin-bottom: 10px;">${res.message}</div>`;
                    } else {
                        html += `
                        <div class="glass-card mb-2" style="margin-bottom: 15px;">
                            <h4 style="color:var(--primary); margin-bottom:5px;">${res.categoria}</h4>
                            <p style="font-size: 0.9em; color:var(--text-muted);"><strong>Se encuentra como:</strong></p>
                            <ul style="margin-left: 20px; font-size: 0.9em; margin-bottom: 10px;">
                                ${res.alimentosReales.map(a => `<li>${a}</li>`).join('')}
                            </ul>
                            <p style="font-size: 0.9em; color:var(--text-muted);"><strong>Puedes comerlo en:</strong></p>
                            <ul style="margin-left: 20px; font-size: 0.9em;">
                                ${res.comidasPosibles.map(c => `<li>${c.meal} (${c.cantidad} porcion/es)</li>`).join('')}
                            </ul>
                        </div>`;
                    }
                });
                resultsContainer.innerHTML = html;
            }
        });
    }

    /* --- GUÍA Y ALERTAS --- */
    setupAlerts() {
        // Forbidden
        const forbiddenList = document.getElementById('forbidden-list');
        if (forbiddenList) {
            forbiddenList.innerHTML = '';
            this.generator.data.noPermitidos.forEach(item => {
                const div = document.createElement('div');
                div.className = 'forbidden-item';
                div.innerHTML = `<i class="ti ti-x"></i> <span>${item}</span>`;
                forbiddenList.appendChild(div);
            });
        }

        // Drinks
        const drinksList = document.getElementById('allowed-drinks-list');
        if (drinksList) {
            drinksList.innerHTML = '';
            this.generator.data.bebidasPermitidas.forEach(item => {
                const span = document.createElement('span');
                span.className = 'chip drink-chip';
                span.textContent = item;
                drinksList.appendChild(span);
            });
        }

        // General Tips
        const tipsList = document.getElementById('general-tips-list');
        if (tipsList) {
            tipsList.innerHTML = '';
            this.generator.data.recomendacionesGenerales.forEach(item => {
                const div = document.createElement('div');
                div.className = 'tip-item';
                div.innerHTML = `<i class="ti ti-check"></i> <p>${item}</p>`;
                tipsList.appendChild(div);
            });
        }
    }

    /* --- REGISTRO DE PESO (Feature #3) --- */
    setupWeightTracker() {
        const btn = document.getElementById('btn-register-weight');
        const input = document.getElementById('weight-input');

        // Render initial state
        this.renderWeightSummary();
        this.renderWeightChart();

        btn.addEventListener('click', () => {
            const val = parseFloat(input.value);
            if (isNaN(val) || val < 30 || val > 250) {
                input.style.borderColor = 'var(--danger)';
                setTimeout(() => input.style.borderColor = '', 1200);
                return;
            }

            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            // Sobreescribir si ya hay registro de hoy
            const existingIdx = this.weightLog.findIndex(e => e.date === today);
            if (existingIdx >= 0) {
                this.weightLog[existingIdx].weight = val;
            } else {
                this.weightLog.push({ date: today, weight: val });
            }

            // Mantener solo los últimos 90 días
            if (this.weightLog.length > 90) this.weightLog.shift();

            this.saveState('weightLog', this.weightLog);
            input.value = '';

            // Feedback visual button
            btn.innerHTML = '<i class="ti ti-check"></i> ¡Guardado!';
            btn.style.background = 'var(--success)';
            setTimeout(() => {
                btn.innerHTML = '<i class="ti ti-check"></i> Guardar';
                btn.style.background = '';
            }, 1800);

            if (this.weightLog.length === 8) this.triggerConfetti();

            this.renderWeightSummary();
            this.renderWeightChart();
        });
    }

    renderWeightSummary() {
        const summaryEl = document.getElementById('weight-summary');
        if (!summaryEl) return;

        const log = this.weightLog;
        if (log.length === 0) {
            summaryEl.classList.add('hidden');
            return;
        }

        summaryEl.classList.remove('hidden');
        const latest = log[log.length - 1];
        const prev = log.length >= 2 ? log[log.length - 2] : null;

        let badgeHtml = '';
        if (prev) {
            const diff = (latest.weight - prev.weight).toFixed(1);
            const sign = diff > 0 ? '+' : '';
            const cls = diff < 0 ? 'down' : diff > 0 ? 'up' : 'same';
            const emoji = diff < 0 ? '↓' : diff > 0 ? '↑' : '=';
            badgeHtml = `<span class="weight-badge ${cls}">${emoji} ${sign}${diff} kg</span>`;
        }

        summaryEl.innerHTML = `
            <span class="weight-current">${latest.weight.toFixed(1)}</span>
            <span class="weight-unit-label">kg</span>
            <small style="color:var(--text-muted); font-size:0.78rem;">${latest.date}</small>
            ${badgeHtml}
        `;
    }

    renderWeightChart() {
        const canvas = document.getElementById('weight-chart');
        const emptyMsg = document.getElementById('weight-chart-empty');
        if (!canvas) return;

        // Show last 14 entries max for readability
        const data = this.weightLog.slice(-14);

        if (data.length < 2) {
            // Single entry: show a centered point with label
            if (data.length === 0) {
                canvas.style.display = 'none';
                if (emptyMsg) emptyMsg.style.display = 'block';
                return;
            }

            canvas.style.display = 'block';
            if (emptyMsg) emptyMsg.style.display = 'none';

            const ctx = canvas.getContext('2d');
            const W = canvas.width;
            const H = canvas.height;
            ctx.clearRect(0, 0, W, H);
            const isDark = document.body.classList.contains('dark-mode');
            const textColor = isDark ? '#bcaaa4' : '#8d6e63';

            ctx.beginPath();
            ctx.arc(W / 2, H / 2, 10, 0, Math.PI * 2);
            ctx.fillStyle = '#ff8a65';
            ctx.fill();
            ctx.strokeStyle = isDark ? '#3e322f' : 'white';
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.fillStyle = textColor;
            ctx.font = 'bold 14px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${data[0].weight} kg`, W / 2, H / 2 - 20);

            const parts = data[0].date.split('-');
            ctx.font = '11px Outfit, sans-serif';
            ctx.fillText(`${parts[2]}/${parts[1]}/${parts[0]}`, W / 2, H / 2 + 28);
            ctx.fillStyle = 'rgba(141,110,99,0.25)';
            ctx.font = '11px Outfit, sans-serif';
            ctx.fillText('Registra más días para ver la tendencia →', W / 2, H - 12);
            return;
        }

        canvas.style.display = 'block';
        if (emptyMsg) emptyMsg.style.display = 'none';

        const ctx = canvas.getContext('2d');
        const W = canvas.width;
        const H = canvas.height;
        ctx.clearRect(0, 0, W, H);

        const isDark = document.body.classList.contains('dark-mode');
        const textColor = isDark ? '#bcaaa4' : '#8d6e63';
        const lineColor = '#ff8a65';
        const pointColor = '#ff8a65';
        const fillStart = 'rgba(255,138,101,0.18)';
        const fillEnd = 'rgba(255,138,101,0)';
        const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(141,110,99,0.1)';

        const PAD = { top: 20, right: 16, bottom: 40, left: 44 };
        const chartW = W - PAD.left - PAD.right;
        const chartH = H - PAD.top - PAD.bottom;

        const weights = data.map(d => d.weight);
        const minW = Math.min(...weights) - 1;
        const maxW = Math.max(...weights) + 1;
        const range = maxW - minW || 1;

        const xStep = chartW / (data.length - 1);
        const toX = i => PAD.left + i * xStep;
        const toY = w => PAD.top + chartH - ((w - minW) / range) * chartH;

        // Grid lines (horizontal)
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        for (let i = 0; i <= 4; i++) {
            const y = PAD.top + (chartH / 4) * i;
            ctx.beginPath();
            ctx.moveTo(PAD.left, y);
            ctx.lineTo(PAD.left + chartW, y);
            ctx.stroke();
        }
        ctx.setLineDash([]);

        // Y axis labels
        ctx.fillStyle = textColor;
        ctx.font = '10px Outfit, sans-serif';
        ctx.textAlign = 'right';
        for (let i = 0; i <= 4; i++) {
            const val = maxW - (range / 4) * i;
            const y = PAD.top + (chartH / 4) * i;
            ctx.fillText(val.toFixed(1), PAD.left - 5, y + 4);
        }

        // Gradient fill below line
        const grad = ctx.createLinearGradient(0, PAD.top, 0, PAD.top + chartH);
        grad.addColorStop(0, fillStart);
        grad.addColorStop(1, fillEnd);

        ctx.beginPath();
        ctx.moveTo(toX(0), toY(data[0].weight));
        for (let i = 1; i < data.length; i++) {
            const xc = (toX(i - 1) + toX(i)) / 2;
            const yc = (toY(data[i - 1].weight) + toY(data[i].weight)) / 2;
            ctx.quadraticCurveTo(toX(i - 1), toY(data[i - 1].weight), xc, yc);
        }
        ctx.lineTo(toX(data.length - 1), toY(data[data.length - 1].weight));
        ctx.lineTo(toX(data.length - 1), PAD.top + chartH);
        ctx.lineTo(toX(0), PAD.top + chartH);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        // Line
        ctx.beginPath();
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 2.5;
        ctx.lineJoin = 'round';
        ctx.moveTo(toX(0), toY(data[0].weight));
        for (let i = 1; i < data.length; i++) {
            const xc = (toX(i - 1) + toX(i)) / 2;
            const yc = (toY(data[i - 1].weight) + toY(data[i].weight)) / 2;
            ctx.quadraticCurveTo(toX(i - 1), toY(data[i - 1].weight), xc, yc);
        }
        ctx.lineTo(toX(data.length - 1), toY(data[data.length - 1].weight));
        ctx.stroke();

        // Data points
        data.forEach((d, i) => {
            ctx.beginPath();
            ctx.arc(toX(i), toY(d.weight), 4, 0, Math.PI * 2);
            ctx.fillStyle = pointColor;
            ctx.fill();
            ctx.strokeStyle = isDark ? '#3e322f' : 'white';
            ctx.lineWidth = 2;
            ctx.stroke();
        });

        // X axis labels (show dates, every nth if too many)
        const step = data.length <= 7 ? 1 : Math.ceil(data.length / 7);
        ctx.fillStyle = textColor;
        ctx.font = '9px Outfit, sans-serif';
        ctx.textAlign = 'center';
        data.forEach((d, i) => {
            if (i % step === 0 || i === data.length - 1) {
                const parts = d.date.split('-');
                const label = `${parts[2]}/${parts[1]}`; // DD/MM
                ctx.fillText(label, toX(i), H - PAD.bottom + 16);
            }
        });
    }
    /* --- LISTA DE COMPRAS --- */
    setupShoppingList() {
        // Cargar lista MAESTRA INTELIGENTE (agrupada)
        this.shoppingList = this.generator.getSmartMasterList();

        // Mapeo de categorías unificadas
        this.cartCategoryMapping = {
            'lacteos': 'Lácteos',
            'proteinas': 'Proteínas',
            'cereales': 'Cereales',
            'fruta': 'Frutas',
            'grasas': 'Grasas',
            'verduras': 'Verduras'
        };

        this.unifiedCategories = [...new Set(Object.values(this.cartCategoryMapping))];

        if (!this.activeCartCategory || !this.unifiedCategories.includes(this.activeCartCategory)) {
            this.activeCartCategory = this.unifiedCategories[0];
        }

        // Listener para el toggle de Mi Lista
        const btnToggle = document.getElementById('btn-toggle-cart-view');
        if (btnToggle) {
            btnToggle.addEventListener('click', () => {
                this.isFinalListActive = !this.isFinalListActive;
                btnToggle.innerHTML = this.isFinalListActive
                    ? '<i class="ti ti-list-search"></i> Ver Catálogo'
                    : '<i class="ti ti-shopping-cart"></i> Mi Lista';

                // Ocultar/Mostrar tabs según la vista
                const tabs = document.getElementById('cart-tabs');
                if (tabs) tabs.style.display = this.isFinalListActive ? 'none' : 'flex';

                // Título dinámico
                const title = document.querySelector('#view-cart .page-title h2');
                const subtitle = document.querySelector('#view-cart .page-title p');
                if (this.isFinalListActive) {
                    title.textContent = 'Mi Lista Final';
                    subtitle.textContent = 'Cosas por comprar 🛒';
                } else {
                    title.textContent = 'Catálogo de Opciones';
                    subtitle.textContent = 'Elige qué comprar 🛒';
                }

                this.renderShoppingList();
            });
        }

        this.renderCartTabs();
        this.renderShoppingList();
    }

    renderCartTabs() {
        const tabsContainer = document.getElementById('cart-tabs');
        if (!tabsContainer) return;

        tabsContainer.innerHTML = '';
        this.unifiedCategories.forEach(catName => {
            const pill = document.createElement('button');
            pill.className = `meal-tab ${this.activeCartCategory === catName ? 'active' : ''}`;
            pill.textContent = catName;

            pill.addEventListener('click', () => {
                this.activeCartCategory = catName;
                this.renderCartTabs();
                this.renderShoppingList();
            });

            tabsContainer.appendChild(pill);
        });
    }

    renderShoppingList() {
        const container = document.getElementById('cart-items-container');
        if (!container) return;

        container.innerHTML = '';

        let itemsToRender = [];

        if (this.isFinalListActive) {
            // Mostrar solo los items seleccionados
            itemsToRender = this.shoppingList.filter(item => {
                const itemKey = `${item.categoria}|${item.name}`;
                return this.selectedShoppingItems[itemKey];
            });

            if (itemsToRender.length === 0) {
                container.innerHTML = `<div class="placeholder-text mt-4" style="text-align:center;">
                    <i class="ti ti-shopping-cart-x" style="font-size:3rem; opacity:0.3; display:block; margin-bottom:1rem;"></i>
                    Tu lista de compras está vacía.<br>Elige items del catálogo primero.
                </div>`;
                return;
            }
        } else {
            // Mostrar catálogo filtrado por pestaña
            itemsToRender = this.shoppingList.filter(item =>
                this.cartCategoryMapping[item.categoria] === this.activeCartCategory
            );
        }

        const iconMap = {
            'lacteos': '🥛',
            'proteinas': '🥩',
            'cereales': '🌾',
            'fruta': '🍎',
            'grasas': '🥑',
            'verduras': '🥗'
        };

        itemsToRender.forEach(item => {
            const itemKey = `${item.categoria}|${item.name}`;
            const isSelected = this.selectedShoppingItems[itemKey] || false;
            const isPurchased = this.purchasedItems[itemKey] || false;

            const card = document.createElement('div');
            // Si estamos en la lista final, usamos la clase 'purchased' para tachar.
            // Si estamos en el catalogo, usamos una clase visual para indicar que está en la lista.
            card.className = `cart-item section-anim 
                ${this.isFinalListActive && isPurchased ? 'purchased' : ''} 
                ${!this.isFinalListActive && isSelected ? 'item-selected' : ''}`;
            card.style.marginBottom = '0.5rem';

            card.innerHTML = `
                <div class="cart-checkbox">
                    <i class="ti ${this.isFinalListActive ? 'ti-check' : (isSelected ? 'ti-minus' : 'ti-plus')}"></i>
                </div>
                <div class="cart-item-icon">${iconMap[item.categoria] || '🛒'}</div>
                <div class="cart-item-text">
                    <p>${item.name}</p>
                    ${!this.isFinalListActive ? `<small style="opacity:0.6">${item.originalNames.length} opciones</small>` : ''}
                </div>
            `;

            card.addEventListener('click', () => {
                if (this.isFinalListActive) {
                    // Acción: Marcar como Comprado
                    this.purchasedItems[itemKey] = !this.purchasedItems[itemKey];
                    this.saveState('purchasedItems', this.purchasedItems);
                    card.classList.toggle('purchased');
                } else {
                    // Acción: Agregar/Quitar de "Mi Lista"
                    this.selectedShoppingItems[itemKey] = !this.selectedShoppingItems[itemKey];
                    this.saveState('selectedShoppingItems', this.selectedShoppingItems);

                    // Feedback visual inmediato
                    card.classList.toggle('item-selected');
                    const icon = card.querySelector('.cart-checkbox i');
                    if (this.selectedShoppingItems[itemKey]) {
                        icon.className = 'ti ti-minus';
                    } else {
                        icon.className = 'ti ti-plus';
                    }
                }
            });

            container.appendChild(card);
        });
    }

    /* --- PWA INSTALLATION --- */
    initPWAInstall() {
        const installContainer = document.getElementById('install-container');
        const btnInstall = document.getElementById('btn-install-pwa');
        const installHomeBanner = document.getElementById('install-home-banner');
        const btnInstallHome = document.getElementById('btn-install-home');
        const installDescription = installContainer ? installContainer.querySelector('p') : null;
        const homeBannerText = installHomeBanner ? installHomeBanner.querySelector('.banner-text p') : null;
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
            || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches
            || window.navigator.standalone === true;
        const isMobileViewport = window.matchMedia('(max-width: 900px)').matches;

        const showInstallUI = ({
            homeText,
            detailText,
            buttonLabel = 'Instalar',
            buttonDisabled = false,
            showButton = true
        }) => {
            if (installContainer) installContainer.classList.remove('hidden');
            if (installHomeBanner) installHomeBanner.classList.remove('hidden');
            if (homeBannerText) homeBannerText.textContent = homeText;
            if (installDescription) installDescription.textContent = detailText;

            [btnInstall, btnInstallHome].forEach((button) => {
                if (!button) return;
                button.textContent = buttonLabel;
                button.disabled = buttonDisabled;
                button.style.display = showButton ? '' : 'none';
            });
        };

        const hideInstallUI = () => {
            if (installContainer) installContainer.classList.add('hidden');
            if (installHomeBanner) installHomeBanner.classList.add('hidden');
        };

        if (isStandalone || !isMobileViewport) {
            hideInstallUI();
            return;
        }

        if (isIOS) {
            showInstallUI({
                homeText: 'Toca "Compartir" y luego "Añadir a pantalla de inicio" 📲',
                detailText: 'En iPhone la instalación se hace desde el menú Compartir de Safari.',
                showButton: false
            });
            return;
        }

        showInstallUI({
            homeText: 'Preparando instalación...',
            detailText: 'Cuando el navegador habilite la instalación, verás el botón listo.',
            buttonLabel: 'Preparando...',
            buttonDisabled: true
        });

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            showInstallUI({
                homeText: 'Acceso rápido y sin internet',
                detailText: 'Instala la app para abrirla desde la pantalla principal.',
                buttonLabel: 'Instalar',
                buttonDisabled: false
            });
        });

        const fallbackInstallTimer = window.setTimeout(() => {
            if (!this.deferredPrompt) {
                showInstallUI({
                    homeText: 'Si es tu primera visita, actualiza una vez',
                    detailText: 'Luego puedes instalar desde el menú del navegador como "Instalar aplicación" si no aparece el aviso.',
                    showButton: false
                });
            }
        }, 3500);

        const handleInstallClick = async () => {
            if (!this.deferredPrompt) return;

            window.clearTimeout(fallbackInstallTimer);
            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;
            this.deferredPrompt = null;

            if (outcome === 'accepted') {
                hideInstallUI();
                return;
            }

            showInstallUI({
                homeText: 'Puedes instalarla más tarde desde el menú',
                detailText: 'Si cambias de idea, abre el menú del navegador y busca "Instalar aplicación".',
                buttonLabel: 'Instalación pendiente',
                buttonDisabled: true
            });
        };

        if (btnInstall) btnInstall.addEventListener('click', handleInstallClick);
        if (btnInstallHome) btnInstallHome.addEventListener('click', handleInstallClick);

        window.addEventListener('appinstalled', () => {
            window.clearTimeout(fallbackInstallTimer);
            hideInstallUI();
            this.deferredPrompt = null;
        });
    }
}

// Inicializar la App cuando cargue el DOM
document.addEventListener('DOMContentLoaded', () => {
    window.app = new DietaApp();
});
