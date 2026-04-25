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

        if (mealDef.tipo === 'opciones' && Array.isArray(mealDef.opciones) && mealDef.opciones.length > 0) {
            const selectedOption = mealDef.opciones[Math.floor(Math.random() * mealDef.opciones.length)];

            return {
                mealId,
                mealName: this.formatMealName(mealId),
                subtitle: mealDef.horaAprox,
                mode: 'opciones',
                selectedOption,
                items: (selectedOption.items || []).map((itemName, index) => ({
                    categoria: 'opcion',
                    name: itemName,
                    lockedKey: `${mealId}-opcion-${index}`,
                    isLocked: false
                })),
                porcionesDef: []
            };
        }

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

        const optionMealMatches = [];
        for (const [mealId, mealDef] of Object.entries(this.data.comidas)) {
            if (!Array.isArray(mealDef.opciones)) continue;

            mealDef.opciones.forEach((option) => {
                const matchedItems = (option.items || []).filter(item => item.toLowerCase().includes(query));
                if (matchedItems.length > 0) {
                    optionMealMatches.push({
                        mealId,
                        titulo: option.titulo,
                        items: matchedItems
                    });
                }
            });
        }

        // 3. Si no está en ninguna categoría, revisar alertas de No Permitidos
        if (categoryMatches.length === 0 && optionMealMatches.length === 0) {
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
                const requires = Array.isArray(mealDef.porciones)
                    ? mealDef.porciones.find(p => p.categoria === match.categoria)
                    : null;
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
                'FRUTA':             'FRUTA',
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

        optionMealMatches.forEach(match => {
            results.push({
                isWarning: false,
                categoria: `OPCIONES DE ${this.formatMealName(match.mealId).toUpperCase()}`,
                alimentosReales: match.items,
                comidasPosibles: [{
                    meal: this.formatMealName(match.mealId),
                    detalle: match.titulo
                }]
            });
        });

        return results;
    }

    /**
     * Genera un menú completo para todo el día (5 comidas)
     */
    generateFullDayMenu() {
        const meals = ['desayuno', 'media_manana', 'almuerzo', 'media_tarde', 'cena'];
        const fullDayMenu = {};

        meals.forEach(mealId => {
            fullDayMenu[mealId] = this.generateMenu(mealId);
        });

        return fullDayMenu;
    }

    /**
     * Agrega ingredientes de un menú completo en una lista de compras simplificada
     */
    getShoppingList(fullDayMenu) {
        const aggregated = {};

        Object.values(fullDayMenu).forEach(meal => {
            meal.items.forEach(item => {
                const key = `${item.categoria}|${item.name}`;
                if (!aggregated[key]) {
                    aggregated[key] = {
                        name: item.name,
                        categoria: item.categoria,
                        count: 0
                    };
                }
                aggregated[key].count++;
            });
        });

        // Convertir a array y ordenar por categoría
        return Object.values(aggregated).sort((a, b) => a.categoria.localeCompare(b.categoria));
    }

    /**
     * Retorna una lista MAESTRA "inteligente" donde se agrupan items específicos en nombres genéricos.
     * Ej: "1 vaso de leche light" y "1 vaso de leche descremada" se agrupan en "Leche".
     */
    getSmartMasterList() {
        const smartAgrupado = {};
        
        // Mapeo inteligente de palabras clave a nombres genéricos
        const smartMapping = [
            { keywords: ['leche'], label: 'Leche' },
            { keywords: ['yogurt', 'yogur'], label: 'Yogurt' },
            { keywords: ['queso'], label: 'Queso' },
            { keywords: ['huevo', 'claras'], label: 'Huevos / Claras' },
            { keywords: ['pan', 'tostada'], label: 'Pan / Tostadas' },
            { keywords: ['avena'], label: 'Avena' },
            { keywords: ['quinua'], label: 'Quinua' },
            { keywords: ['arroz'], label: 'Arroz' },
            { keywords: ['pasta', 'fideos'], label: 'Pasta' },
            { keywords: ['papa', 'camote', 'yuca'], label: 'Tubérculos (Papa/Camote)' },
            { keywords: ['pescado'], label: 'Pescado' },
            { keywords: ['salmon', 'trucha', 'bonito', 'atun'], label: 'Pescado' },
            { keywords: ['pollo'], label: 'Pollo' },
            { keywords: [' res', 'carne de res'], label: 'Carne de Res' },
            { keywords: ['pavita', 'jamon de pavo'], label: 'Pavita / Pavo' },
            { keywords: ['cerdo'], label: 'Cerdo' },
            { keywords: ['higado', 'sangrecita'], label: 'Hierro animal' },
            { keywords: ['palta'], label: 'Palta' },
            { keywords: ['aceituna'], label: 'Aceitunas' },
            { keywords: ['aceite'], label: 'Aceite (Oliva/Vegetal)' },
            { keywords: ['nueces', 'pecanas', 'cashews', 'mani', 'maní', 'almendras', 'chia', 'linaza'], label: 'Frutos Secos y Semillas' },
            { keywords: ['fresas', 'kiwi', 'pina', 'piña', 'naranja', 'arandanos', 'arándanos', 'aguaymanto', 'sandia', 'sandía', 'papaya', 'melon', 'melón', 'pera', 'manzana', 'durazno', 'granadilla', 'mandarina', 'tuna', 'pitahaya', 'mango', 'platano', 'plátano', 'higo'], label: 'Frutas' },
            { keywords: ['zanahoria'], label: 'Zanahoria' },
            { keywords: ['lechuga'], label: 'Lechuga' },
            { keywords: ['betarraga'], label: 'Betarraga' },
            { keywords: ['tomate'], label: 'Tomate' },
            { keywords: ['brócoli', 'brocoli'], label: 'Brócoli' },
            { keywords: ['espinaca', 'acelga'], label: 'Espinaca / Acelga' },
            { keywords: ['pepino'], label: 'Pepino' },
            { keywords: ['zapallito', 'caigua'], label: 'Zapallito / Caigua' },
            { keywords: ['alcachofa', 'champinones', 'champiñones', 'arugula', 'arrugula', 'palmitos', 'coliflor', 'esparragos', 'espárragos'], label: 'Verduras Variadas' },
            { keywords: ['verdura', 'ensalada'], label: 'Verduras Variadas' }
        ];

        const categories = Object.keys(this.data.alimentos || {});

        const resolveCategory = (cat) => {
            if (cat.includes('lact')) return 'lacteos';
            if (cat.includes('huevo') || cat.includes('carne')) return 'proteinas';
            if (cat.includes('cereal')) return 'cereales';
            if (cat.includes('fruta')) return 'fruta';
            if (cat.includes('grasa')) return 'grasas';
            if (cat.includes('verd')) return 'verduras';
            return 'proteinas';
        };

        categories.forEach(cat => {
            const options = this.data.alimentos[cat];
            if (!options) return;

            options.forEach(originalName => {
                const lowerName = originalName.toLowerCase();
                let finalLabel = originalName; // Fallback al original

                // Buscar si coincide con alguna regla smart
                const rule = smartMapping.find(r => r.keywords.some(k => lowerName.includes(k)));
                if (rule) {
                    finalLabel = rule.label;
                }

                const groupCat = resolveCategory(cat);
                const key = `${groupCat}|${finalLabel}`;
                if (!smartAgrupado[key]) {
                    smartAgrupado[key] = {
                        name: finalLabel,
                        categoria: groupCat,
                        originalNames: [] // Para auditoria si fuera necesario
                    };
                }
                if (!smartAgrupado[key].originalNames.includes(originalName)) {
                    smartAgrupado[key].originalNames.push(originalName);
                }
            });
        });

        return Object.values(smartAgrupado);
    }
}
