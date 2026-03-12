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
            items: generatedMenu
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

        let results = [];

        // Buscar en qué categorías está el alimento
        const categoryMatches = [];
        for (const [cat, alimentos] of Object.entries(this.data.alimentos)) {
            const found = alimentos.filter(a => a.toLowerCase().includes(query));
            if (found.length > 0) {
                categoryMatches.push({
                    categoria: cat,
                    ejemplos: found
                });
            }
        }

        // Si no está en ninguna categoría, quizas sea de alertas
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

            results.push({
                isWarning: false,
                categoria: match.categoria.toUpperCase(),
                alimentosReales: match.ejemplos,
                comidasPosibles: compatibleMeals
            });
        });

        return results;
    }
}
