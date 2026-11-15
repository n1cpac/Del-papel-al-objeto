/** Datos de las piezas tomados de la ficha de colección (Momentos 2, 3 y 5). */
export type Piece = {
    id: string;
    station: string;
    name: string;
    /** Posición del pedestal y altura del objeto enfocado. */
    x: number;
    z: number;
    y: number;
    status?: string;
    fields: [label: string, value: string][];
    description: string;
    detail: string;
    /** Canción que suena al inspeccionar la pieza (la del recorrido se pausa); `gain` la atenúa (0…1). */
    audio?: { src: string; gain?: number };
    /**
     * Pieza colgada o fija frente al pasillo: solo se enfoca desde delante (z mayor que la suya),
     * no añade zona de exclusión automática y en la inspección no gira 360°.
     */
    onWall?: boolean;
    /** Marca el stand de la infografía para abrir la actividad de reflexión (Lugar E). */
    isReflection?: boolean;
    /** Marca la puerta de salida final para terminar el recorrido al interactuar. */
    isExit?: boolean;
};

export const piecesById = {
    intro: {
        id: 'intro',
        station: 'A · Introducción',
        name: 'Introducción a la colección',
        x: 7.05,
        z: 4.3,
        y: 1.82,
        onWall: true,
        // Textos del guion curatorial (Lugar A) y de la ficha de colección (Momentos 1 y 4).
        fields: [
            ['Exposición', 'Del papel al objeto'],
            ['Institución', 'Universidad Militar Nueva Granada'],
            ['Objetos', 'Manga, deck TCG, dos Funko Pop y peluche'],
            ['Pieza ancla', 'Funko Pop Yuji Itadori #1111']
        ],
        description:
            'Cinco objetos cuentan cómo personajes japoneses pasan del papel o la pantalla al coleccionismo en Occidente.',
        detail: ''
    },
    manga: {
        id: 'manga',
        audio: { src: './audio/piezas/manga.mp3', gain: 0.45 },
        station: 'B · El papel, el origen',
        name: 'Tomo de manga de Yu-Gi-Oh!',
        x: 10.35,
        z: -0.72,
        y: 1.21,
        status: 'Adquisición propuesta',
        fields: [
            ['Tipo', 'Publicación gráfica (tankōbon)'],
            ['Creador', 'Kazuki Takahashi / Shueisha'],
            ['Año', 'c. 1996'],
            ['Técnica', 'Litografía en papel prensa (Japón)']
        ],
        description: 'Soporte primario en papel del que nacen los personajes y narrativas de la colección.',
        detail: ''
    },
    deck: {
        id: 'deck',
        audio: { src: './audio/piezas/deck.mp3' },
        station: 'C · Del personaje al producto',
        name: 'Deck estructurado de Kaiba',
        x: 7.65,
        z: -0.72,
        y: 1.11,
        fields: [
            ['Tipo', 'Cartas de TCG (Konami, 2011)'],
            ['Material', 'Cartón plastificado litografiado'],
            ['Dimensiones', '59 × 86 mm (fundas: 69 × 94 mm)'],
            ['Procedencia', 'Japón']
        ],
        description: 'Baraja coleccionable de Yu-Gi-Oh! enfocada en la estrategia de Kaiba.',
        detail: ''
    },
    yuji: {
        id: 'yuji',
        audio: { src: './audio/piezas/yuji.mp3' },
        station: 'C · Del personaje al producto',
        name: 'Funko Pop Yuji Itadori #1111',
        x: 4.75,
        z: -0.72,
        y: 1.38,
        fields: [
            ['Tipo', 'Figura coleccionable (Funko, 2021)'],
            ['Material', 'Vinilo moldeado por inyección'],
            ['Dimensiones', 'Aprox. 10 cm'],
            ['Procedencia', 'Estados Unidos']
        ],
        description: 'Figura estilizada de Yuji Itadori conservada en su caja original.',
        detail: ''
    },
    gon: {
        id: 'gon',
        audio: { src: './audio/piezas/gon.mp3' },
        station: 'C · Del personaje al producto',
        name: 'Funko Pop Gon Freecss #651',
        x: 2.65,
        z: -0.72,
        y: 1.38,
        fields: [
            ['Tipo', 'Figura coleccionable (Funko, 2019)'],
            ['Material', 'Vinilo moldeado por inyección'],
            ['Dimensiones', 'Aprox. 10 cm'],
            ['Procedencia', 'Estados Unidos']
        ],
        description: 'Figura chibi de Gon Freecss (Hunter × Hunter), ícono shōnen.',
        detail: ''
    },
    miku: {
        id: 'miku',
        audio: { src: './audio/piezas/miku.mp3' },
        station: 'D · El ídolo que se vuelve objeto',
        name: 'Peluche de Hatsune Miku',
        x: -0.2,
        z: -0.72,
        y: 1.31,
        fields: [
            ['Tipo', 'Peluche textil (Crypton, 2013)'],
            ['Técnica', 'Costura industrial por capas'],
            ['Dimensiones', '25 cm'],
            ['Procedencia', 'Japón']
        ],
        description: 'Figura textil de la cantante virtual Hatsune Miku.',
        detail: ''
    },
    coleccion: {
        id: 'coleccion',
        station: 'E · ¿Qué hace una colección?',
        name: 'Actividad de cierre · ¿Qué hace una colección?',
        x: -3.45,
        z: -0.72,
        y: 2.02,
        onWall: true,
        isReflection: true,
        fields: [],
        description: '',
        detail: ''
    },
    salida: {
        id: 'salida',
        station: 'E · Fin del recorrido',
        name: 'Puerta de salida',
        x: -5.68,
        z: 2.2,
        y: 1.25,
        onWall: true,
        isExit: true,
        fields: [],
        description: '',
        detail: ''
    }
} satisfies Record<string, Piece>;

export const pieces: Piece[] = Object.values(piecesById);
