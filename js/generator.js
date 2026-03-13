// generator.js - Motor de generacion de dietas

class DietGenerator {
    constructor(data) {
        this.data = data;
        // Estado de "fijados" (Locks)
        this.lockedItems = {}; // { 'desayuno-cereales-0': '½ taza de avena...' }
        this.currentMealId = '';
    }

    /**
     * Determina el ID de la comida según la hora actual
     */
    getCurrentMealId() {
        const hour = new Date().getHours();

        if (hour >= 6 && hour < 10) return 'desayuno';
        if (hour >= 10 && hour < 12) return 'media_manana';
        if (hour >= 12 && hour < 16) return 'almuerzo';
        if (hour >= 16 && hour < 19) return 'media_tarde';
        return 'cena';
    }

    /**
     * Genera un menú aleatorio para una comida específica respetando las porciones y locks
     * @param {string} mealId 'desayuno', 'almuerzo', etc.
     */
    generateMenu(mealId) {
        this.currentMealId = mealId;
        const mealDef = this.data.comidas[mealId];
        if (!mealDef) return null;

        let generatedMenu = [];

        mealDef.porciones.forEach(porcion => {
            const { categoria, cantidad } = porcion;
            const availableOptions = this.data.alimentos[categoria];

            if (!availableOptions) {
                console.warn(`Categoría no encontrada: ${categoria}`);
                return;
            }

            // Elegir N items de forma aleatoria (sin repetir en la misma comida si es posible)
            let selectedItems = [];
            let tempOptions = [...availableOptions]; // Clonamos para no editar el original

            for (let i = 0; i < cantidad; i++) {
                const lockKey = `${mealId}-${categoria}-${i}`;

                // 1. Verificamos si este slot especifico está "bloqueado" por el usuario
                if (this.lockedItems[lockKey] && availableOptions.includes(this.lockedItems[lockKey])) {
                    selectedItems.push({
                        categoria,
                        name: this.lockedItems[lockKey],
                        lockedKey: lockKey,
                        isLocked: true
                    });

                    // Removemos de las temporales para no duplicarlo si hay más slots de esta categoria
                    tempOptions = tempOptions.filter(item => item !== this.lockedItems[lockKey]);
                } else {
                    // 2. Si no, escogemos uno al azar
                    if (tempOptions.length === 0) tempOptions = [...availableOptions]; // Reset por si piden más que la lista

                    const randomIndex = Math.floor(Math.random() * tempOptions.length);
                    const chosen = tempOptions[randomIndex];

                    selectedItems.push({
                        categoria,
                        name: chosen,
                        lockedKey: lockKey,
                        isLocked: false
                    });

                    // Remover de tempOptions para forzar variedad (ej. no 2 panes idénticos)
                    tempOptions.splice(randomIndex, 1);
                }
            }

            generatedMenu.push(...selectedItems);
        });

        return {
            mealId,
            mealName: this.formatMealName(mealId),
            subtitle: mealDef.horaAprox,
            items: generatedMenu,
            porcionesDef: mealDef.porciones // Agregamos la definicion original de porciones
        };
    }

    /**
     * Cambia el estado "locked" de un ítem para mantenerlo en los siguientes giros
     */
    toggleLock(lockKey, itemName) {
        if (this.lockedItems[lockKey]) {
            delete this.lockedItems[lockKey];
            return false;
        } else {
            this.lockedItems[lockKey] = itemName;
            return true;
        }
    }

    // Solo para limpiar los locks si cambia de comida (Opcional, pero util)
    clearLocks() {
        this.lockedItems = {};
    }

    formatMealName(id) {
        const names = {
            'desayuno': 'Desayuno',
            'media_manana': 'Media Mañana',
            'almuerzo': 'Almuerzo',
            'media_tarde': 'Media Tarde',
            'cena': 'Cena'
        };
        return names[id] || id;
    }

    // Funcionalidad de Búsqueda Inversa
    searchFood(query) {
        if (!query.trim()) return [];
        query = query.toLowerCase();

        // 1. Check for cravings (Antojos)
        if (this.data.antojos) {
            for (const [antojo, sustituto] of Object.entries(this.data.antojos)) {
                if (antojo.includes(query) || query.includes(antojo)) {
                    return [{
                        isWarning: false,
                        isCraving: true,
                        antojoBuscado: antojo,
                        sustituto: sustituto
                    }];
                }
            }
        }

        let results = [];

        // 2. Busqueda en categorias normales
        const categoryMatches = [];
        for (const [catName, options] of Object.entries(this.data.alimentos)) {
            const found = options.filter(opt => opt.toLowerCase().includes(query));
            if (found.length > 0) {
                categoryMatches.push({
                    categoria: catName,
                    ejemplos: found
                });
            }
        }

        // 3. Si no está en ninguna categoría, revisar alertas de No Permitidos
        if (categoryMatches.length === 0) {
            const malMatch = this.data.noPermitidos.find(n => n.toLowerCase().includes(query));
            if (malMatch) {
                return [{ isWarning: true, message: `⚠️ Cuidado: "${malMatch}" está en tu lista de NO PERMITIDOS.` }];
            }
            return [];
        }

        // Si lo encontró, cruzar esos datos con "En qué comidas lo puedo ingerir"
        categoryMatches.forEach(match => {
            const compatibleMeals = [];
            for (const [mealId, mealDef] of Object.entries(this.data.comidas)) {
                // Check if this meal requires this category
                const requires = mealDef.porciones.find(p => p.categoria === match.categoria);
                if (requires) {
                    compatibleMeals.push({
                        meal: this.formatMealName(mealId),
                        cantidad: requires.cantidad
                    });
                }
            }

            let formattedCat = match.categoria.toUpperCase();
            // Human-readable category names
            const catNames = {
                'CEREALES_DESAYUNO': 'CEREALES (DESAYUNO / MEDIA TARDE)',
                'CEREALES_ALMUERZO': 'CEREALES (ALMUERZO / CENA)',
                'CEREALES_CENA':     'CEREALES (CENA)',
                'FRUTA_CUBOS':       'FRUTA EN CUBOS (DESAYUNO)',
                'FRUTA_MEDIANA':     'FRUTA MEDIANA (MEDIA MAÑANA)',
                'GRASAS_SNACK':      'GRASAS (SNACK — FRUTOS SECOS)',
                'GRASAS_ALMUERZO':   'GRASAS (ALMUERZO / CENA)',
                'CARNE_ALMUERZO':    'PROTEÍNA (ALMUERZO)',
                'CARNE_CENA':        'PROTEÍNA (CENA)'
            };
            formattedCat = catNames[formattedCat] || formattedCat;

            results.push({
                isWarning: false,
                categoria: formattedCat,
                alimentosReales: match.ejemplos,
                comidasPosibles: compatibleMeals
            });
        });

        return results;
    }
}
