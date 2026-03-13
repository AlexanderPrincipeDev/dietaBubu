const dietaBubu = {
    "recomendacionesGenerales": [
        "Beber 6 a 8 vasos de agua al día",
        "Dormir mínimo 6–7 horas",
        "Esperar 1–2 horas después de cenar antes de dormir",
        "Caminata leve-moderada 45 min diarios (15 min mañana + 30 min tarde/noche)",
        "Cocinar: sancochado, al horno, a la plancha, guisos, parrilla, sudado o escalfado",
        "Reducir sal y azúcar",
        "Masticar bien los alimentos y comer tranquila"
    ],
    "noPermitidos": [
        "Alimentos con octógonos: alto en grasas saturadas, grasas trans o azúcar",
        "Azúcar, miel, panela, algarrobina",
        "Frutas de alto índice glucémico: Plátano, Mango, Uvas, Lúcuma, Chirimoya",
        "Embutidos",
        "Frituras",
        "Pastelería",
        "Mayonesa y mantequilla",
        "Golosinas, dulces y chocolates",
        "Gaseosas y jugos envasados"
    ],
    "bebidasPermitidas": [
        "Manzanilla", "Jamaica", "Anís", "Hierba Luisa", "Emoliente", "Agua",
        "Agua de piña", "Agua de manzana", "Agua de durazno", "Chicha morada"
    ],
    // Sustitutos de antojos (sin plátano ni mango — están prohibidos)
    "antojos": {
        "papas fritas": "Papa al horno con orégano o bastones de camote asado 🍠",
        "chocolate": "1 cuadradito de chocolate amargo (más del 70% cacao) 🍫",
        "gaseosa": "Agua con gas, rodajas de limón/naranja y hielo 🧊🍋",
        "dulce": "1 porción de tu fruta permitida (ej. Fresas, Kiwi, Tuna) 🍓",
        "pizza": "Pita pizza: pan pita sin gluten, salsa de tomate natural, queso fresco y orégano 🍕",
        "helado": "Yogurt griego descremado congelado con fresas o kiwi 🍦",
        "galletas": "Galletas de avena y fruta caseras (avena + pera o manzana machacada, al horno) 🍪",
        "antojo": "Agua de piña bien fría, manzanilla con canela, o tu fruta permitida favorita 💧"
    },
    "comidas": {
        "desayuno": {
            "horaAprox": "8:00am",
            "porciones": [
                { "categoria": "lacteos", "cantidad": 1 },
                { "categoria": "huevos", "cantidad": 1 },
                { "categoria": "cereales_desayuno", "cantidad": 2 },
                { "categoria": "fruta_cubos", "cantidad": 1 }
            ]
        },
        "media_manana": {
            "horaAprox": "10:30 – 11:00am",
            "porciones": [
                { "categoria": "grasas_snack", "cantidad": 2 },
                { "categoria": "fruta_mediana", "cantidad": 1 }
            ]
        },
        "almuerzo": {
            "horaAprox": "1:00pm",
            "porciones": [
                { "categoria": "cereales_almuerzo", "cantidad": 2 },
                { "categoria": "grasas_almuerzo", "cantidad": 2 },
                { "categoria": "verduras", "cantidad": 2 },
                { "categoria": "carne_almuerzo", "cantidad": 2 }
            ]
        },
        "media_tarde": {
            "horaAprox": "5:00pm",
            "porciones": [
                { "categoria": "lacteos", "cantidad": 1 },
                { "categoria": "cereales_desayuno", "cantidad": 1 },
                { "categoria": "grasas_snack", "cantidad": 1 }
            ]
        },
        "cena": {
            "horaAprox": "8:00pm",
            "porciones": [
                { "categoria": "cereales_almuerzo", "cantidad": 1 },
                { "categoria": "verduras", "cantidad": 3 },
                { "categoria": "carne_cena", "cantidad": 2 },
                { "categoria": "grasas_cena", "cantidad": 2 }
            ]
        }
    },
    "alimentos": {
        // ─── LÁCTEOS (desayuno y media tarde) ───────────────────────────────
        "lacteos": [
            "1 vaso de yogurt light (200 ml)",
            "½ vaso de yogurt griego descremado (100–120 ml)",
            "2 tajadas delgadas de queso fresco light",
            "2 tajadas de queso amarillo light (Edam, Paria u otros)",
            "1 vaso de leche fresca light o semidescremada",
            "1 vaso de leche fresca sin lactosa light o semidescremada",
            "½ taza de leche evaporada semidescremada",
            "½ taza de leche evaporada semidescremada sin lactosa",
            "1 cucharadita de queso crema light"
        ],
        // ─── HUEVOS (desayuno) ──────────────────────────────────────────────
        "huevos": [
            "1 huevo entero (revuelto, sancochado u omelette)",
            "2 claras de huevo (revueltas, sancochadas u omelette)"
        ],
        // ─── CEREALES DESAYUNO y MEDIA TARDE ───────────────────────────────
        "cereales_desayuno": [
            "1 tostada o tajada de pan de molde sin gluten",
            "¼ taza de granola sin miel",
            "2 panes pequeños sin gluten (15 g aprox.)",
            "½ taza de avena u otro cereal (quinua, cañihua, etc.)",
            "2 cucharadas de avena cruda o tostada (priorizar 2–3 veces por semana)",
            "1 tortilla chica de maíz",
            "1 pan sin gluten o integral de panadería (30 g)",
            "½ pan sin gluten de supermercado (30 g)"
        ],
        // ─── CEREALES ALMUERZO y CENA ───────────────────────────────────────
        "cereales_almuerzo": [
            "½ taza de arroz o quinua cocida (preferir integral)",
            "½ taza de pasta sin gluten",
            "½ taza de puré (papa, camote, yuca u otro tubérculo)",
            "1 papa pequeña hervida con cáscara",
            "1 camote pequeño sancochado con cáscara",
            "½ choclo"
        ],
        // ─── FRUTA en cubos (desayuno) ──────────────────────────────────────
        "fruta_cubos": [
            "½ taza de jugo natural sin azúcar (máximo 1 vez por semana)",
            "1 taza de Kiwi en cubos",
            "1 taza de Tuna en cubos",
            "1 taza de Pitahaya en cubos",
            "1 taza de Piña en cubos",
            "1 taza de Papaya en cubos",
            "1 taza de Melón en cubos",
            "1 taza de Fresas",
            "1 taza de Sandía en cubos",
            "1 Naranja",
            "10 unidades de Arándanos",
            "6–7 unidades de Aguaymanto"
        ],
        // ─── FRUTA mediana (media mañana) ───────────────────────────────────
        "fruta_mediana": [
            "1 Kiwi",
            "1 Tuna",
            "1 Granadilla",
            "10 unidades de Aguaymanto",
            "1 Mandarina",
            "1 Manzana",
            "1 Pera",
            "1 Durazno"
        ],
        // ─── GRASAS para snacks (media mañana y media tarde) ────────────────
        "grasas_snack": [
            "6 mitades de pecanas",
            "6 mitades de nueces",
            "6 nueces de Brasil o cashews",
            "10 unidades de maní",
            "1 cucharadita de mantequilla de maní"
        ],
        // ─── GRASAS para almuerzo y cena ────────────────────────────────────
        "grasas_almuerzo": [
            "2 cucharadas de palta",
            "3–4 aceitunas medianas",
            "1 cucharadita de aceite de oliva",
            "1 cucharadita de aceite vegetal"
        ],
        // ─── GRASAS para cena ───────────────────────────────────────────────
        "grasas_cena": [
            "2 cucharadas de palta",
            "3–4 aceitunas medianas",
            "1 cucharadita de aceite de oliva",
            "1 cucharadita de aceite vegetal",
            "6 mitades de pecanas",
            "6 mitades de nueces"
        ],
        // ─── VERDURAS (almuerzo y cena) ─────────────────────────────────────
        "verduras": [
            "½ taza de verduras cocidas",
            "1 taza de verduras frescas"
        ],
        // ─── PROTEÍNAS / CARNE almuerzo ─────────────────────────────────────
        "carne_almuerzo": [
            "½ filete de Pescado (50 g cocido) — máx. 2 veces por semana",
            "1 hamburguesa mediana de Res — máx. 1 vez por semana",
            "3 trozos medianos de Res sancochada",
            "½ filete de Res (tamaño ¾ de mano)",
            "1 encuentro mediano de Pollo",
            "½ filete de pechuga de Pollo",
            "4 nuggets medianos de Pollo",
            "3 trozos medianos de Pavita para guiso",
            "1 chuleta de Pavita (solo pulpa)",
            "2 medallones de Pavita",
            "2 tajadas de Tofu (30 g c/u)",
            "2 claras de huevo"
        ],
        // ─── PROTEÍNAS / CARNE cena ─────────────────────────────────────────
        "carne_cena": [
            "½ filete de Pescado (60 g cocido)",
            "1 encuentro mediano de Pollo",
            "½ pechuga de Pollo",
            "4 nuggets medianos de Pollo",
            "3 trozos medianos de Pavita para guiso",
            "1 chuleta de Pavita (solo pulpa)",
            "2 medallones de Pavita",
            "1 huevo entero + 1 clara",
            "3 claras de huevo"
        ]
    }
};

// Exportar para acceso desde otros módulos
window.dietaBubu = dietaBubu;
