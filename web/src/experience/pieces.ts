/** Datos de las piezas tomados de la ficha de colección (Momentos 2, 3 y 5). */
export type Piece = {
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
};

export const piecesById = {
    manga: {
        station: 'B · El papel, el origen',
        name: 'Tomo de manga de Yu-Gi-Oh!',
        x: 10.4,
        z: -0.72,
        y: 1.18,
        status: 'Adquisición propuesta · pieza aún no disponible',
        fields: [
            ['Tipo de objeto', 'Publicación editorial gráfica (tankōbon)'],
            ['Autor / creador', 'Kazuki Takahashi / Shueisha'],
            ['Fecha o periodo', 'c. 1996'],
            ['Técnica', 'Impresión litográfica / offset en papel prensa'],
            ['Procedencia', 'Japón']
        ],
        description:
            'Cubre el origen en papel de las historias: el soporte primario del cual se originaron los objetos tridimensionales de la colección.',
        detail: 'Permite contrastar la fuente original en blanco y negro con su transformación en cartas, figuras y textiles en Occidente.'
    },
    deck: {
        station: 'C · Del personaje al producto',
        name: 'Deck estructurado de Kaiba',
        x: 7.8,
        z: -0.72,
        y: 1.22,
        fields: [
            ['Tipo de objeto', 'Cartas de TCG'],
            ['Autor / creador', 'Konami'],
            ['Fecha o periodo', '2011'],
            ['Material(es)', 'Cartón plastificado'],
            ['Técnica', 'Impresión litográfica'],
            ['Dimensiones', '59 × 86 mm (fundas: 69 × 94 mm)'],
            ['Procedencia', 'Japón']
        ],
        description: 'Baraja de cartas coleccionables basada en Yu-Gi-Oh!, enfocada en la estrategia de Kaiba.',
        detail: 'Usa forros con un diseño representativo de la baraja.'
    },
    yuji: {
        station: 'C · Del personaje al producto',
        name: 'Funko Pop Yuji Itadori #1111',
        x: 5.4,
        z: -0.72,
        y: 1.15,
        fields: [
            ['Tipo de objeto', 'Figura coleccionable'],
            ['Autor / creador', 'Funko'],
            ['Fecha o periodo', '2021 (lanzamiento de línea)'],
            ['Material(es)', 'Vinilo'],
            ['Técnica', 'Moldeado por inyección'],
            ['Dimensiones', 'Aprox. 10 cm'],
            ['Procedencia', 'Estados Unidos']
        ],
        description: 'Figura estilizada de Yuji Itadori (Jujutsu Kaisen) conservada en su caja original.',
        detail: 'Mantiene su caja original, factor clave en el coleccionismo actual.'
    },
    gon: {
        station: 'C · Del personaje al producto',
        name: 'Funko Pop Gon Freecss #651',
        x: 3,
        z: -0.72,
        y: 1.15,
        fields: [
            ['Tipo de objeto', 'Figura coleccionable'],
            ['Autor / creador', 'Funko'],
            ['Fecha o periodo', '2019 (lanzamiento de línea)'],
            ['Material(es)', 'Vinilo'],
            ['Técnica', 'Moldeado por inyección'],
            ['Dimensiones', 'Aprox. 10 cm'],
            ['Procedencia', 'Estados Unidos']
        ],
        description: 'Figura estilizada de Gon Freecss (Hunter × Hunter), ícono del shōnen clásico.',
        detail: 'Diseño estilizado “chibi” que atrae al público occidental.'
    },
    miku: {
        station: 'D · El ídolo que se vuelve objeto',
        name: 'Peluche de Hatsune Miku',
        x: -0.2,
        z: -0.72,
        y: 1.15,
        fields: [
            ['Tipo de objeto', 'Peluche / figura de tela'],
            ['Autor / creador', 'Crypton Future Media'],
            ['Fecha o periodo', '2013'],
            ['Material(es)', 'No indicado'],
            ['Técnica', 'Costura industrial'],
            ['Dimensiones', '25 cm'],
            ['Procedencia', 'Japón']
        ],
        description: 'Figura textil de la cantante virtual Hatsune Miku con capas de tela en pelo y traje.',
        detail: 'Representa la transición de lo digital a lo tangible dentro de la colección.'
    }
} satisfies Record<string, Piece>;

export const pieces: Piece[] = Object.values(piecesById);
