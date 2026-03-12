// app.js - Lógica de Interfaz y estado de la aplicación

class DietaApp {
    constructor() {
        this.generator = new DietGenerator(window.dietaBubu);

        // Estado Local
        this.currentMealId = this.generator.getCurrentMealId();
        this.waterGlasses = parseInt(localStorage.getItem('waterGlasses')) || 0;
        this.hasWalked = localStorage.getItem('hasWalked') === 'true';
        this.lastCheckDate = localStorage.getItem('lastCheckDate');

        // Inicialización
        this.init();
    }

    init() {
        this.checkNewDay();
        this.setupNavigation();
        this.setupHeader();
        this.setupGenerator();
        this.setupTracker();
        this.setupSearch();
        this.setupAlerts();
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
            localStorage.setItem('waterGlasses', 0);
            localStorage.setItem('hasWalked', false);
            localStorage.setItem('lastCheckDate', today);
        }
    }

    /* --- NAVIGATION MODO SPA --- */
    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                // Remover active class de boton
                navItems.forEach(btn => btn.classList.remove('active'));

                // Añadir active class
                const btn = e.currentTarget;
                btn.classList.add('active');

                // Ocultar todas las views
                const views = document.querySelectorAll('.view');
                views.forEach(v => v.classList.remove('active'));
                setTimeout(() => views.forEach(v => {
                    if (!v.classList.contains('active')) v.classList.add('hidden');
                }), 400); // Wait fadeout

                // Mostrar la vista objetivo
                const targetId = btn.getAttribute('data-target');
                const targetView = document.getElementById(targetId);
                targetView.classList.remove('hidden');
                setTimeout(() => targetView.classList.add('active'), 10);
            });
        });
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

        // Dynamic Greeting Good Morning/Afternoon/Night
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
        greetingTitle.textContent = `${greeting}, Evelyn!!! ${emoji}`;

        // Subtítulo
        subtitleElement.textContent = `Es hora de tu ${this.generator.formatMealName(this.currentMealId)}`;

        // Tip aleatorio
        const tips = this.generator.data.recomendacionesGenerales;
        document.getElementById('daily-tip').textContent = tips[Math.floor(Math.random() * tips.length)];
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
            let catTitle = categoria.toUpperCase();
            if (catTitle === 'CEREALES_CENA') catTitle = 'CEREALES (CENA)';

            const titleEl = document.createElement('h3');
            titleEl.className = 'category-title';
            titleEl.textContent = catTitle;
            groupDiv.appendChild(titleEl);

            // Renderizar los items de esta categoria
            items.forEach(item => {
                const el = document.createElement('div');
                el.className = 'portion-item section-anim';

                const iconMap = {
                    'lacteos': '🥛',
                    'huevos': '🥚',
                    'cereales': '🌾',
                    'cereales_cena': '🥔',
                    'fruta': '🍎',
                    'grasas': '🥑',
                    'verduras': '🥗',
                    'carne': '🥩'
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

        if (this.hasWalked) {
            walkBtn.classList.add('checked');
            walkBtn.innerHTML = '<i class="ti ti-check"></i> ¡Caminata Lograda! 🎉';
        }
    }

    renderWaterTracker() {
        const container = document.getElementById('water-tracker');
        container.innerHTML = '';

        // 8 Vasos
        for (let i = 0; i < 8; i++) {
            const glass = document.createElement('div');
            glass.className = `glass ${i < this.waterGlasses ? 'filled' : ''}`;
            glass.innerHTML = '<i class="ti ti-droplet"></i>';
            glass.dataset.index = i;

            glass.addEventListener('click', () => {
                // Si haces click en el llenado, lo vacias (Undo). Si no, lo llenas hasta ese vaso.
                if (i === this.waterGlasses - 1) {
                    this.waterGlasses--;
                } else {
                    this.waterGlasses = i + 1;
                }
                localStorage.setItem('waterGlasses', this.waterGlasses);
                this.renderWaterTracker();
            });
            container.appendChild(glass);
        }
    }

    toggleWalk() {
        this.hasWalked = !this.hasWalked;
        localStorage.setItem('hasWalked', this.hasWalked);
        const walkBtn = document.getElementById('btn-walk');

        if (this.hasWalked) {
            walkBtn.classList.add('checked');
            walkBtn.innerHTML = '<i class="ti ti-check"></i> ¡Caminata Lograda! 🎉';
        } else {
            walkBtn.classList.remove('checked');
            walkBtn.innerHTML = '<i class="ti ti-check"></i> Actividad Completada';
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
                resultsContainer.innerHTML = '<p class="placeholder-text">No encontré ese alimento en la lista de la dieta. Asegúrate de escribirlo bien o consultar a Evelyn Puerta.</p>';
            } else {
                let html = '';
                results.forEach(res => {
                    if (res.isWarning) {
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

    /* --- ALERTAS --- */
    setupAlerts() {
        const forbiddenList = document.getElementById('forbidden-list');
        this.generator.data.noPermitidos.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            forbiddenList.appendChild(li);
        });
    }
}

// Inicializar la App cuando cargue el DOM
document.addEventListener('DOMContentLoaded', () => {
    window.app = new DietaApp();
});
