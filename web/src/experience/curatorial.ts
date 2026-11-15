export type StationId = 'A' | 'B' | 'C' | 'D' | 'E';

export type ReadingLevel = 'basico' | 'general' | 'especializado';

export type StationScript = {
    id: StationId;
    title: string;
    axis: string;
    recommendedLevel: string;
    where: string;
    learn: string;
    find: string;
    observationPrompt: string;
    triggerQuestion: string;
};

export type ComparatorSpec = {
    originTitle: string;
    originDetail: string;
    originImage: string;
    productTitle: string;
    productDetail: string;
    productImage: string;
};

export type PieceCuratorialMeta = {
    stationId: StationId;
    levels: Record<ReadingLevel, string>;
    observationPrompt: string;
    triggerQuestion: string;
    npcSummary: string;
    npcObservation: string;
    comparator?: ComparatorSpec;
};

export const educationalPurpose =
    'Descubrir cómo personajes nacidos en papel o medios digitales japoneses se transforman en objetos coleccionables en Occidente a través de un criterio curatorial.';

export const learningOutcomes: string[] = [
    'Distinguir entre acumulación, inventario y colección.',
    'Identificar qué conserva y qué cambia un personaje al volverse producto.',
    'Formular un criterio propio para relacionar y agrupar objetos.'
];

export const collectionSequence = 'Objeto → Selección → Relación → Criterio → Colección → Adquisición';

export const glossaryTerms: Record<string, string> = {
    shōnen: 'Categoría editorial de manga y anime dirigida originalmente al público juvenil, centrada en aventura, superación y amistad.',
    tankōbon:
        'Tomo recopilatorio individual en papel donde se reúnen varios capítulos publicados previamente en revistas como Weekly Shōnen Jump.',
    TCG: 'Juego de cartas coleccionables (Trading Card Game) que combina estrategia lúdica con colección comercial de barajas y sobres.',
    chibi: 'Estilo de representación con proporciones simplificadas y cabeza grande respecto al cuerpo, muy usado en figuras como Funko Pop.',
    licencia:
        'Autorización comercial mediante la cual una franquicia japonesa cede derechos de imagen a fabricantes occidentales para producir mercancía.',
    litografía:
        'Técnica de impresión gráfica plana empleada tanto en publicaciones editoriales como en cartón plastificado para cartas.',
    'criterio curatorial':
        'Idea o eje reflexivo que conecta varios objetos bajo un discurso común y los convierte en colección.'
};

export const stationsById: Record<StationId, StationScript> = {
    A: {
        id: 'A',
        title: 'A · Bienvenida',
        axis: 'Eje articulador y museológico',
        recommendedLevel: 'Básico',
        where: 'Bienvenido a Del papel al objeto, una exposición virtual de la Universidad Militar Nueva Granada. Aquí cinco objetos cuentan cómo la cultura popular japonesa viajó a Occidente y se volvió coleccionable. Puedes recorrer la sala en cualquier orden.',
        learn: 'Descubrirás cómo un personaje que nace en tinta y papel termina como carta, figura de vinilo o peluche, y qué hace que un grupo de objetos sea una colección y no solo un montón de cosas.',
        find: 'Un tomo de manga, un deck de Yu-Gi-Oh!, dos figuras Funko Pop y un peluche de Hatsune Miku, además de una actividad final para armar tu propio criterio de colección.',
        observationPrompt:
            'Antes de avanzar por el pasillo, piensa qué criterio conecta piezas tan distintas entre sí.',
        triggerQuestion: '¿Cómo adapta y comercializa el mercado occidental las narrativas y personajes japoneses?'
    },
    B: {
        id: 'B',
        title: 'B · El papel, el origen',
        axis: 'Eje editorial',
        recommendedLevel: 'General',
        where: 'Antes de ser carta, figura o peluche, cada personaje fue un dibujo en una página. Estás frente al tomo impreso en Japón hacia 1996, la fuente bidimensional de la que parte esta colección.',
        learn: 'El manga es un soporte con sus propias reglas: se lee de derecha a izquierda, se imprime en blanco y negro sobre papel prensa y se publica por capítulos. De allí salen los personajes que luego el mercado transforma.',
        find: 'Una pieza propuesta para adquisición curatorial que cubre el vacío de origen del catálogo y permite contrastar la fuente gráfica con sus derivados 3D.',
        observationPrompt:
            'Fíjate en la diferencia entre leer una historia en blanco y negro en papel y poseer después un objeto físico derivado.',
        triggerQuestion:
            '¿Por qué un tomo de manga resulta indispensable para completar una colección sobre cultura pop japonesa?'
    },
    C: {
        id: 'C',
        title: 'C · Del personaje al producto',
        axis: 'Eje comercial-estético',
        recommendedLevel: 'General y especializado',
        where: 'Aquí el personaje sale de la página y entra al mercado. Tres objetos de consumo masivo (el Deck de Kaiba, Funko Yuji y Funko Gon) lo reinterpretan con técnicas industriales para un público que colecciona más allá de la historia.',
        learn: 'Cómo una franquicia japonesa cambia al pasar por licencias y marcas occidentales: el rostro se simplifica en estética chibi, la caja original adquiere valor coleccionable y la carta convierte al personaje en estrategia de juego.',
        find: 'Tres visores 3D interactivos que puedes girar y acercar, cédulas técnicas y un comparador papel ↔ producto.',
        observationPrompt:
            'Compara el trazo original del personaje con su adaptación industrial en cartón litografiado o vinilo moldeado.',
        triggerQuestion:
            '¿Qué conservó la figura o la carta del dibujo original y qué cambió para el mercado occidental?'
    },
    D: {
        id: 'D',
        title: 'D · El ídolo que se vuelve objeto',
        axis: 'Eje digital-tangible',
        recommendedLevel: 'General',
        where: 'Hatsune Miku nunca existió en papel: nació como voz sintetizada y personaje digital. Este peluche la lleva al mundo físico y completa el recorrido desde el papel hasta lo tangible.',
        learn: 'No todos los objetos coleccionables vienen de un manga. Algunos nacen en pantalla dentro de la cibercultura y el mercado los materializa en formatos textiles mediante costura industrial y capas de tela.',
        find: 'Un visor 3D del peluche donde puedes apreciar el manejo de capas en el cabello turquesa y el traje textil.',
        observationPrompt:
            'Observa las capas textiles del cabello y el atuendo: aunque no vino de un manga, comparte el mismo circuito de consumo.',
        triggerQuestion:
            '¿Qué cambia en la experiencia de un fan cuando un ídolo puramente virtual se transforma en objeto textil?'
    },
    E: {
        id: 'E',
        title: 'E · ¿Qué hace una colección?',
        axis: 'Eje museológico',
        recommendedLevel: 'General',
        where: 'Has recorrido las cinco piezas. ¿Qué las une: estar guardadas juntas, aparecer en un catálogo o que alguien las relacione bajo un criterio?',
        learn: 'La colección nace del criterio curatorial. Guardar es simple depósito (acumulación), catalogar es registro (inventario), y relacionar con sentido es lo que convierte un grupo de objetos en discurso.',
        find: 'La infografía resumen y la actividad interactiva final para formular tu propio criterio y compararlo con la secuencia curatorial.',
        observationPrompt: 'Revisa los cuatro pilares en la infografía antes de responder el reto final de criterio.',
        triggerQuestion: '¿Con qué criterio propio agruparías estas cinco piezas para formar una exposición coherente?'
    }
};

export const pieceCuratorialMeta: Record<string, PieceCuratorialMeta> = {
    intro: {
        stationId: 'A',
        levels: {
            basico: 'Cinco objetos muestran cómo personajes japoneses llegan a Occidente convertidos en piezas coleccionables.',
            general:
                'Un tomo de manga, un deck de cartas, dos Funko Pop y un peluche explican cómo la cultura pop japonesa pasa del papel o la pantalla al coleccionismo.',
            especializado:
                'Desde la museología relacional, la muestra articula cuatro ejes para explicar cómo los personajes japoneses circulan en Occidente como productos culturales.'
        },
        observationPrompt: stationsById.A.observationPrompt,
        triggerQuestion: stationsById.A.triggerQuestion,
        npcSummary:
            'Cinco objetos cuentan cómo personajes japoneses pasan del papel o lo digital al coleccionismo en Occidente.',
        npcObservation: 'Fíjate qué criterio conecta piezas tan distintas.'
    },
    manga: {
        stationId: 'B',
        levels: {
            basico: 'El manga es un cómic japonés en blanco y negro que se lee de derecha a izquierda. De aquí parten muchas series.',
            general:
                'Este tankōbon de Yu-Gi-Oh! (c. 1996, Shueisha) representa el soporte en papel del género shōnen y cubre el origen gráfico de la colección.',
            especializado:
                'Impreso por litografía en papel prensa, este tomo funciona como pieza fundacional para contrastar el trazo original con su posterior producción bajo licencia.'
        },
        observationPrompt: stationsById.B.observationPrompt,
        triggerQuestion: stationsById.B.triggerQuestion,
        npcSummary:
            'Empezamos por el origen: el tomo de manga de Yu-Gi-Oh! (c. 1996), dibujo en blanco y negro sobre papel prensa.',
        npcObservation: 'Su inclusión como "adquisición propuesta" cierra el vacío de origen frente a los objetos 3D.'
    },
    deck: {
        stationId: 'C',
        levels: {
            basico: 'La historia de Yu-Gi-Oh! salta del cómic a una baraja real para jugar duelos con cartas impresas en cartón.',
            general:
                'El Deck estructurado de Kaiba (Konami, 2011) traduce un duelo del manga a un juego comercial de cartas coleccionables (TCG).',
            especializado:
                'Impreso en cartón plastificado (59 × 86 mm), el TCG lleva la narrativa shōnen a mecánicas de juego y mercado coleccionable bajo licencia.'
        },
        observationPrompt: 'Nota las fundas protectoras y cómo el duelo narrado se convierte en objeto jugable.',
        triggerQuestion: '¿Qué cambia entre leer un personaje en papel y tenerlo en una carta para jugar?',
        npcSummary:
            'Nuestro segundo objeto es el Deck estructurado de Kaiba (2011), donde Yu-Gi-Oh! pasa del papel a carta coleccionable (TCG).',
        npcObservation: 'Observa su formato estándar y sus fundas para el juego.',
        comparator: {
            originTitle: 'Origen en papel (Manga)',
            originDetail: 'Viñeta dibujada en tinta y papel (c. 1996): el duelo solo ocurre como historia.',
            originImage: 'images/tomo.png',
            productTitle: 'Producto TCG (Deck)',
            productDetail: 'Cartón litografiado (2011): reglas de juego, rareza y fundas coleccionables.',
            productImage: 'images/carta.png'
        }
    },
    yuji: {
        stationId: 'C',
        levels: {
            basico: 'Figura de vinilo que convierte a Yuji Itadori en un diseño cabezón pensado para exhibirse en su caja.',
            general:
                'El Funko Pop de Yuji Itadori (#1111, 2021) es la pieza ancla: una franquicia japonesa contemporánea adaptada al molde estándar occidental.',
            especializado:
                'Moldeado por inyección en vinilo bajo licencia, aplica la estética chibi de Funko y traslada valor de colección al empaque original.'
        },
        observationPrompt: 'Fíjate en la simplificación del rostro y el protagonismo de conservar la caja original.',
        triggerQuestion: '¿Qué conserva Yuji Itadori del anime original y qué adapta Funko para su catálogo?',
        npcSummary: 'Llegamos a la pieza ancla: el Funko Pop de Yuji Itadori #1111 (Jujutsu Kaisen).',
        npcObservation:
            'Un molde estándar estadounidense en vinilo chibi donde hasta la caja suma valor coleccionable.',
        comparator: {
            originTitle: 'Trazo shōnen japonés',
            originDetail: 'Proporciones dinámicas y rasgos expresivos propios del manga y anime.',
            originImage: 'images/itadori.png',
            productTitle: 'Estética Funko Pop',
            productDetail: 'Cabeza grande, ojos negros uniformes, vinilo moldeado y caja #1111.',
            productImage: 'images/itadori.png'
        }
    },
    gon: {
        stationId: 'C',
        levels: {
            basico: 'Gon Freecss adopta la misma forma cuadrada de vinilo que otros personajes de series diferentes.',
            general:
                'El Funko Pop de Gon Freecss (#651, 2019) muestra cómo franquicias de distintas épocas comparten un lenguaje visual unificado.',
            especializado:
                'La adaptación de Hunter × Hunter al canon Funko demuestra cómo las licencias homogenizan trazos autorales en una línea única.'
        },
        observationPrompt: 'Compara a Gon con Yuji: épocas distintas reunidas bajo una misma plantilla estética.',
        triggerQuestion: '¿Qué gana o pierde un personaje cuando comparte exactamente el mismo molde que otro?',
        npcSummary: 'Al lado está el Funko Pop de Gon Freecss #651 (Hunter × Hunter), de 2019.',
        npcObservation: 'Aunque su serie es de otra década, repite la misma silueta industrial que Yuji.',
        comparator: {
            originTitle: 'Estilo autoral clásico',
            originDetail: 'Diseño original de Hunter × Hunter con expresión propia de los años noventa.',
            originImage: 'images/gon.png',
            productTitle: 'Molde unificado',
            productDetail: 'Vinilo estandarizado (#651) que unifica series distintas en una repisa.',
            productImage: 'images/gon.png'
        }
    },
    miku: {
        stationId: 'D',
        levels: {
            basico: 'Hatsune Miku nació como cantante digital de computadora y aquí se volvió un peluche de tela.',
            general:
                'El peluche de Hatsune Miku (Crypton, 2013, 25 cm) lleva un ídolo puramente virtual al mundo físico mediante costura por capas.',
            especializado:
                'Originada en un banco de voz Vocaloid, su materialización textil adapta una figura de la cibercultura al volumen tangible.'
        },
        observationPrompt:
            'Observa las capas de tela del cabello y del traje que traducen un avatar digital a textura física.',
        triggerQuestion: '¿Cómo cambia la relación con un ídolo virtual al poder sostenerlo como objeto físico?',
        npcSummary:
            'Cerramos los objetos con Hatsune Miku (2013): no nació en papel, sino como voz y estrella digital.',
        npcObservation: 'Sus capas textiles llevan lo virtual al coleccionismo tangible.'
    }
};

export const reflectionOptions = [
    {
        id: 'criterio',
        label: 'Un criterio curatorial que explica cómo la cultura pop japonesa se adapta al coleccionismo occidental',
        correct: true,
        feedback:
            'Exacto. El criterio curatorial relaciona estas cinco piezas como evidencia de una transformación cultural y comercial, no como objetos sueltos.'
    },
    {
        id: 'acumulacion',
        label: 'Simplemente están guardadas juntas en una misma habitación digital',
        correct: false,
        feedback:
            'Guardar objetos en un mismo lugar es solo acumulación o depósito físico; sin una relación argumentada todavía no hay colección.'
    },
    {
        id: 'inventario',
        label: 'Aparecen listadas con autor, fecha y dimensiones en un catálogo técnico',
        correct: false,
        feedback:
            'Un listado con datos de registro constituye un inventario: ordena y describe cada objeto por separado, pero aún no construye un discurso común.'
    }
] as const;

export const entryInterestChoices = [
    'Cartas o juegos coleccionables',
    'Figuras, peluches o recuerdos visuales',
    'Libros, cómics o manga',
    'Aún no colecciono, pero me da curiosidad'
] as const;
