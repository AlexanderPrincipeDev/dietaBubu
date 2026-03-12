const dietaBubu = {
    "recomendacionesGenerales": [
        "Ingerir 6-8 vasos con agua por día",
        "Dormir 6-7 horas como MÍNIMO por día",
        "Esperar 1-2 horas después de la cena para dormir",
        "Actividad física: Caminata leve-moderada 45 min diarios (15' mañana, 30' tarde-noche)",
        "Cocinar sancochado, al horno, a la plancha, en guisos, a la parrilla, sudado o escalfado",
        "Disminuir sal y azúcar",
        "Masticar bien los alimentos"
    ],
    "noPermitidos": [
        "Alimentos con Octógonos (Alto en grasas saturadas, trans, azúcar)",
        "Azúcar, miel, panela, algarrobina, jarabes",
        "Frutas: Plátano, lúcuma, uvas, chirimoya, mango",
        "Chicharrón, embutidos, comidas rápidas, frituras, mayonesa, mantequilla",
        "Golosinas, dulces, chocolates",
        "Gaseosas, jugos envasados"
    ],
    "bebidasPermitidas": [
        "Manzanilla", "Jamaica", "Anís", "Hierba Luisa", "Emoliente", "Agua",
        "Agua de piña", "Agua de manzana", "Agua de durazno", "Chicha morada"
    ],
    // Sustitutos Inteligentes de Antojos
    "antojos": {
        "papas fritas": "Papas al horno con orégano o bastones de Camote asado 🍠",
        "chocolate": "1 cuadradito de chocolate amargo (sobre 70% cacao) 🍫",
        "gaseosa": "Agua con gas, rodajas de limón/naranja y hielo 🧊🍋",
        "dulce": "1 porción de tu fruta favorita (ej. Mango, Plátano, Fresas) 🍓",
        "pizza": "Pita pizza (pan pita integral, salsa de tomate natural, queso mozzarella y orégano) 🍕",
        "helado": "Helado de plátano congelado licuado con un chorrito de leche o yogurt 🍌🍦",
        "galletas": "Galletas de avena caseras (Avena + plátano machacado al horno) 🍪"
    },
    "comidas": {
        "desayuno": {
            "horaAprox": "8:00am",
            "porciones": [
                { "categoria": "lacteos", "cantidad": 1 },
                { "categoria": "huevos", "cantidad": 1 },
                { "categoria": "cereales", "cantidad": 2 },
                { "categoria": "fruta", "cantidad": 1 }
            ]
        },
        "media_manana": {
            "horaAprox": "10:30am - 11:00am",
            "porciones": [
                { "categoria": "grasas", "cantidad": 2 },
                { "categoria": "fruta", "cantidad": 1 }
            ]
        },
        "almuerzo": {
            "horaAprox": "1:00pm",
            "porciones": [
                { "categoria": "cereales", "cantidad": 2 },
                { "categoria": "grasas", "cantidad": 2 },
                { "categoria": "verduras", "cantidad": 2 },
                { "categoria": "carne", "cantidad": 2 }
            ]
        },
        "media_tarde": {
            "horaAprox": "5:00pm",
            "porciones": [
                { "categoria": "lacteos", "cantidad": 1 },
                { "categoria": "cereales", "cantidad": 1 },
                { "categoria": "grasas", "cantidad": 1 }
            ]
        },
        "cena": {
            "horaAprox": "8:00pm",
            "porciones": [
                { "categoria": "cereales_cena", "cantidad": 1 },
                { "categoria": "verduras", "cantidad": 3 },
                { "categoria": "carne", "cantidad": 2 },
                { "categoria": "grasas", "cantidad": 2 }
            ]
        }
    },
    "alimentos": {
        "lacteos": [
            "1 vaso de yogurt light (200ml)",
            "½ vaso de yogurt griego descremado (100-120ml)",
            "2 tajadas delgadas de queso fresco light",
            "2 tajadas de queso amarillo light (Edam, paria, etc.)",
            "1 vaso de leche fresca light ó semidescremada",
            "1 vaso de leche fresca sin lactosa light ó semidescremada",
            "½ taza de leche evaporada semidescremada",
            "½ taza de leche evaporada sin lactosa, semidescremada",
            "1 cdta. de queso crema light"
        ],
        "huevos": [
            "1 huevo entero (revuelto, sancochado u omelette)",
            "2 claras de huevo (revueltas, sancochadas u omelette)"
        ],
        "cereales": [
            "1 tostada ó tajada de pan de molde sin gluten",
            "¼ taza de granola sin miel",
            "2 panes pequeños sin gluten (15g aprox)",
            "½ taza de avena u otro cereal (quinua, cañihua)",
            "2 cda de avena cruda / tostada (priorizar 2-3 veces x semana)",
            "1 tortilla chica de maíz",
            "1 pan sin gluten / integral de panadería (30g)",
            "½ pan sin gluten de supermercado (30g)"
        ],
        "cereales_cena": [
            "½ taza de cereal cocido como: arroz, quinua (preferible integral)",
            "½ taza de pasta sin gluten",
            "½ taza de puré (papa, camote, yuca)",
            "1 papa pequeña hervida con cáscara",
            "1 camote pequeño sancochado con cáscara",
            "½ choclo"
        ],
        "fruta": [
            "½ taza de jugo de frutas sin azúcar (máximo 1vez / semana)",
            "1 taza de fruta en cubos (Kiwi, Tuna, Pitahaya, Piña, Papaya, Melón, Fresas, Sandia, Naranja (1), Arándanos (10), Aguaymanto (6-7))",
            "1 fruta mediana (Kiwi, Tuna, Granadilla, Aguaymanto (10), Mandarina)",
            "1 fruta mediana con cáscara (Manzana, Pera, Durazno)"
        ],
        "grasas": [
            "6 mitades de pecanas",
            "6 mitades de nueces",
            "6 nueces de brasil / cashews",
            "10 u de maní",
            "1 cdta de mantequilla de maní",
            "2 cda de palta",
            "3-4 aceitunas medianas",
            "1 cdta de aceite de oliva",
            "1 cdta de aceite vegetal"
        ],
        "verduras": [
            "½ taza de verduras cocidas",
            "1 taza de verduras frescas"
        ],
        "carne": [
            "½ filete de Pescado (50g cocido) - Máximo 2 veces x semana",
            "1 hamburguesa mediana de Res - Máximo 1 vez x semana",
            "3 trozos medianos de res sancochada",
            "½ filete de res (3/4 de mano)",
            "1 encuentro mediano de Pollo",
            "½ filete de pechuga de Pollo",
            "4 nuggets medianos de Pollo",
            "2 tajadas de Tofu (30g c/u)",
            "3 trozos medianos de Pavita para guiso",
            "1 chuleta de Pavita (sola pulpa)",
            "2 medallones de Pavita",
            "1 huevo + 1 clara",
            "3 claras de huevo"
        ]
    }
};

// Exportar para acceso desde otros modulos |
window.dietaBubu = dietaBubu;
