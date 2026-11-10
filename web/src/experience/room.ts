import {
    AppBase,
    Color,
    Entity,
    StandardMaterial,
    Vec3
} from 'playcanvas';

type MaterialSet = {
    wall: StandardMaterial;
    floor: StandardMaterial;
    trim: StandardMaterial;
    book: StandardMaterial;
    paper: StandardMaterial;
    card: StandardMaterial;
    red: StandardMaterial;
    green: StandardMaterial;
    teal: StandardMaterial;
    dark: StandardMaterial;
    white: StandardMaterial;
    stations: Record<string, StandardMaterial>;
};

function material(color: string, emissive?: string): StandardMaterial {
    const result = new StandardMaterial();
    result.diffuse = new Color().fromString(color);
    result.emissive = new Color().fromString(emissive ?? '#000000');
    result.metalness = 0;
    result.gloss = 0.18;
    result.update();
    return result;
}

function makeMaterials(): MaterialSet {
    const teal = material('#159b95');
    return {
        wall: material('#e7e2d8'),
        floor: material('#f7f4ec'),
        trim: material('#43575b'),
        book: material('#d7b77a'),
        paper: material('#fffdf8'),
        card: material('#263a4a'),
        red: material('#b74f48'),
        green: material('#4f7951'),
        teal,
        dark: material('#27343a'),
        white: material('#fffdf9'),
        stations: {
            A: teal,
            B: material('#c78a24'),
            C: material('#d65e49'),
            D: material('#4d78b4'),
            E: material('#795aa5')
        }
    };
}

function addBox(
    parent: Entity,
    name: string,
    position: [number, number, number],
    scale: [number, number, number],
    surface: StandardMaterial
): Entity {
    const entity = new Entity(name);
    entity.addComponent('render', { type: 'box', material: surface });
    entity.setLocalPosition(...position);
    entity.setLocalScale(...scale);
    parent.addChild(entity);
    return entity;
}

function addSphere(
    parent: Entity,
    name: string,
    position: [number, number, number],
    scale: [number, number, number],
    surface: StandardMaterial
): Entity {
    const entity = new Entity(name);
    entity.addComponent('render', { type: 'sphere', material: surface });
    entity.setLocalPosition(...position);
    entity.setLocalScale(...scale);
    parent.addChild(entity);
    return entity;
}

function addWall(parent: Entity, name: string, x: number, z: number, width: number, depth: number, materials: MaterialSet): void {
    addBox(parent, name, [x, 1.65, z], [width, 3.3, depth], materials.wall);
}

function addSign(parent: Entity, label: string, x: number, z: number, accent: StandardMaterial, materials: MaterialSet): void {
    const sign = new Entity(`Estación ${label}`);
    sign.setLocalPosition(x, 0, z);
    parent.addChild(sign);
    addBox(sign, `${label}:panel`, [0, 1.55, 0], [1.15, 0.72, 0.1], accent);
    addBox(sign, `${label}:soporte`, [0, 0.64, 0], [0.14, 1.28, 0.14], materials.trim);
    addBox(sign, `${label}:base`, [0, 0.12, 0], [0.7, 0.22, 0.58], materials.trim);
}

function addPedestal(parent: Entity, id: string, x: number, z: number, materials: MaterialSet, accent: StandardMaterial): Entity {
    const pedestal = new Entity(id);
    pedestal.setLocalPosition(x, 0, z);
    parent.addChild(pedestal);
    addBox(pedestal, `${id}:plinto`, [0, 0.38, 0], [1.12, 0.84, 1.02], materials.white);
    addBox(pedestal, `${id}:acento`, [0, 0.83, 0], [1.12, 0.06, 1.02], accent);
    return pedestal;
}

function addBook(parent: Entity, x: number, z: number, materials: MaterialSet): void {
    const book = addPedestal(parent, 'Pieza: tomo de manga', x, z, materials, materials.stations.B);
    addBox(book, 'Bloque de páginas', [0, 1.18, 0], [0.48, 0.68, 0.11], materials.paper);
    addBox(book, 'Portada provisional del manga', [0, 1.19, 0.067], [0.48, 0.68, 0.035], materials.book);
    addBox(book, 'Lomo del tomo', [-0.22, 1.19, -0.03], [0.05, 0.68, 0.12], materials.red);
}

function addDeck(parent: Entity, x: number, z: number, materials: MaterialSet): void {
    const deck = addPedestal(parent, 'Pieza: deck de cartas', x, z, materials, materials.stations.C);
    addBox(deck, 'Deck de Kaiba (provisional)', [0, 1.22, 0], [0.36, 0.48, 0.27], materials.card);
    addBox(deck, 'Frente de la caja', [0, 1.22, 0.143], [0.3, 0.39, 0.012], materials.red);
}

function addFigure(parent: Entity, id: string, x: number, z: number, body: StandardMaterial, hair: StandardMaterial, materials: MaterialSet): void {
    const figure = addPedestal(parent, id, x, z, materials, materials.stations.C);
    addSphere(figure, `${id}:cabeza`, [0, 1.27, 0], [0.35, 0.34, 0.32], materials.book);
    addBox(figure, `${id}:cabello`, [0, 1.43, 0], [0.34, 0.13, 0.32], hair);
    addBox(figure, `${id}:torso`, [0, 0.96, 0], [0.3, 0.34, 0.24], body);
    addBox(figure, `${id}:pierna-izquierda`, [-0.09, 0.7, 0], [0.12, 0.12, 0.18], materials.dark);
    addBox(figure, `${id}:pierna-derecha`, [0.09, 0.7, 0], [0.12, 0.12, 0.18], materials.dark);
}

function addPlush(parent: Entity, x: number, z: number, materials: MaterialSet): void {
    const plush = addPedestal(parent, 'Pieza: peluche de Hatsune Miku', x, z, materials, materials.stations.D);
    addSphere(plush, 'Miku: cabeza provisional', [0, 1.28, 0], [0.39, 0.36, 0.34], materials.white);
    addBox(plush, 'Miku: flequillo', [0, 1.46, -0.015], [0.36, 0.13, 0.25], materials.teal);
    addBox(plush, 'Miku: coleta izquierda', [-0.29, 1.14, 0], [0.13, 0.62, 0.16], materials.teal);
    addBox(plush, 'Miku: coleta derecha', [0.29, 1.14, 0], [0.13, 0.62, 0.16], materials.teal);
    addBox(plush, 'Miku: cuerpo textil', [0, 0.9, 0], [0.28, 0.38, 0.22], materials.stations.D);
}

export function buildRoom(app: AppBase): void {
    const materials = makeMaterials();
    const room = new Entity('Sala · L · 84 m²');
    app.root.addChild(room);

    // Huella ampliada: brazo superior de 12 x 4 m y brazo derecho de 6 x 6 m.
    addBox(room, 'Piso · brazo horizontal', [6, -0.1, 2], [12, 0.2, 4], materials.floor);
    addBox(room, 'Piso · brazo de entrada', [9, -0.1, 7], [6, 0.2, 6], materials.floor);

    addWall(room, 'Muro norte', 6, 0, 12, 0.16, materials);
    addWall(room, 'Muro este', 12, 5, 0.16, 10, materials);
    addWall(room, 'Muro oeste', 0, 2, 0.16, 4, materials);
    addWall(room, 'Muro interior horizontal', 3, 4, 6, 0.16, materials);
    addWall(room, 'Muro interior vertical', 6, 7, 0.16, 6, materials);

    // Muro sur con dos umbrales diferenciados para entrada y salida.
    addWall(room, 'Muro sur · segmento oeste', 6.68, 10, 1.36, 0.16, materials);
    addWall(room, 'Muro sur · separación de puertas', 9.28, 10, 0.96, 0.16, materials);
    addWall(room, 'Muro sur · segmento este', 11.65, 10, 0.7, 0.16, materials);
    addBox(room, 'Umbral · entrada', [8.05, 0.015, 10], [1.4, 0.03, 0.42], materials.stations.A);
    addBox(room, 'Umbral · salida', [10.525, 0.015, 10], [1.45, 0.03, 0.42], materials.stations.E);

    // Guía central del recorrido; las piezas quedan cerca del muro norte.
    addBox(room, 'Guía de recorrido · pasillo vertical', [8.9, 0.012, 6.7], [0.08, 0.025, 6.6], materials.stations.A);
    addBox(room, 'Guía de recorrido · brazo horizontal', [6.45, 0.012, 3.05], [8.7, 0.025, 0.08], materials.stations.C);

    // Paneles y pedestales se pegan al perímetro para liberar el espacio central.
    addSign(room, 'A', 7.15, 8.05, materials.stations.A, materials);
    addSign(room, 'B', 10.65, 0.42, materials.stations.B, materials);
    addSign(room, 'C', 7.1, 0.42, materials.stations.C, materials);
    addSign(room, 'D', 3.25, 0.42, materials.stations.D, materials);
    addSign(room, 'E', 0.9, 0.42, materials.stations.E, materials);

    // Piezas del brazo horizontal, orientadas hacia el corredor central.
    addBook(room, 10.65, 1.28, materials);
    addDeck(room, 9.05, 1.28, materials);
    addFigure(room, 'Pieza: Funko Yuji', 7.4, 1.28, materials.red, materials.dark, materials);
    addFigure(room, 'Pieza: Funko Gon', 5.75, 1.28, materials.green, materials.teal, materials);
    addPlush(room, 3.25, 1.28, materials);

    // Paneles sin contenido curatorial final.
    addBox(room, 'Soporte de bienvenida', [7.15, 0.47, 7.62], [1.3, 0.94, 0.12], materials.white);
    addBox(room, 'Acento de bienvenida', [7.15, 0.94, 7.54], [1.3, 0.08, 0.04], materials.stations.A);
    addBox(room, 'Soporte de cierre', [0.9, 0.47, 1.5], [1.4, 0.94, 0.12], materials.white);
    addBox(room, 'Acento de cierre', [0.9, 0.94, 1.42], [1.4, 0.08, 0.04], materials.stations.E);
}

export function isInsideGallery(position: Vec3): boolean {
    const withinOuterBounds = position.x >= 0.42 && position.x <= 11.58 && position.z >= 0.42 && position.z <= 10.35;
    const insideLFootprint = position.z <= 3.55 || position.x >= 6.45;
    const insideEntrance = position.z <= 10.35 && position.x >= 7.32 && position.x <= 8.78;
    const insideExit = position.z <= 10.35 && position.x >= 9.77 && position.x <= 11.27;
    return withinOuterBounds && (insideLFootprint || insideEntrance || insideExit);
}
