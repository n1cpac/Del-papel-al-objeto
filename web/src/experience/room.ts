import type { AppBase, Vec3 } from 'playcanvas';
import {
    ADDRESS_CLAMP_TO_EDGE,
    Color,
    Entity,
    FILTER_LINEAR,
    PIXELFORMAT_SRGBA8,
    StandardMaterial,
    Texture
} from 'playcanvas';

import type { Piece } from './pieces';
import { pieces, piecesById } from './pieces';

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

function addWall(
    parent: Entity,
    name: string,
    x: number,
    z: number,
    width: number,
    depth: number,
    materials: MaterialSet
): void {
    addBox(parent, name, [x, 1.65, z], [width, 3.3, depth], materials.wall);
}

function addSign(
    parent: Entity,
    label: string,
    x: number,
    z: number,
    accent: StandardMaterial,
    materials: MaterialSet
): void {
    const sign = new Entity(`Estación ${label}`);
    sign.setLocalPosition(x, 0, z);
    parent.addChild(sign);
    addBox(sign, `${label}:panel`, [0, 1.55, 0], [1.15, 0.72, 0.1], accent);
    addBox(sign, `${label}:soporte`, [0, 0.64, 0], [0.14, 1.28, 0.14], materials.trim);
    addBox(sign, `${label}:base`, [0, 0.12, 0], [0.7, 0.22, 0.58], materials.trim);
}

function addWayfindingMap(app: AppBase, parent: Entity, materials: MaterialSet): void {
    // Marco mural al comienzo del pasillo de entrada, mirando hacia el recorrido.
    const frame = addBox(
        parent,
        'Marco · plano del recorrido',
        [11.82, 1.72, 8.45],
        [2.02, 1.25, 0.12],
        materials.trim
    );
    frame.setLocalEulerAngles(0, -90, 0);
    const mapMaterial = material('#fffdf8');
    const map = addBox(parent, 'Plano del recorrido · orientación', [11.74, 1.72, 8.45], [1.78, 1, 0.035], mapMaterial);
    map.setLocalEulerAngles(0, -90, 0);

    app.assets.loadFromUrl(`${import.meta.env.BASE_URL}images/plano-recorrido.png`, 'texture', (error, asset) => {
        if (error || !asset?.resource) {
            console.warn('No se pudo cargar el plano mural del recorrido.', error);
            return;
        }
        mapMaterial.diffuseMap = asset.resource;
        mapMaterial.emissive = new Color(0.16, 0.16, 0.16);
        mapMaterial.update();
    });
}

/** Textura sRGB (colores fieles) para una imagen o un video cargado a mano. */
function mediaTexture(app: AppBase, name: string, mipmaps: boolean): Texture {
    return new Texture(app.graphicsDevice, {
        name,
        format: PIXELFORMAT_SRGBA8,
        mipmaps,
        minFilter: FILTER_LINEAR,
        magFilter: FILTER_LINEAR,
        addressU: ADDRESS_CLAMP_TO_EDGE,
        addressV: ADDRESS_CLAMP_TO_EDGE
    });
}

/** Video vertical (9:16) que llena el hueco del muro de paso. No tiene colisión: se atraviesa. */
function addDoorVideo(app: AppBase, parent: Entity): void {
    const video = document.createElement('video');
    video.src = `${import.meta.env.BASE_URL}videos/puerta-carta-yugi.mp4`;
    video.loop = true;
    // Los navegadores solo reproducen solos los videos silenciados; inline evita el reproductor a pantalla completa en iPhone.
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';

    const texture = mediaTexture(app, 'Video · puerta', false);
    const surface = new StandardMaterial();
    surface.diffuse = new Color(0, 0, 0);
    surface.emissive = new Color(1, 1, 1);
    surface.emissiveMap = texture;
    // Sin iluminación: el video se ve con su brillo propio, igual desde ambos lados.
    surface.useLighting = false;
    surface.update();
    // Caja delgada: muestra el video legible por las dos caras.
    addBox(parent, 'Puerta · video Carta de Yugi', [9, 1.65, 4], [1.8, 3.3, 0.02], surface);

    video.addEventListener(
        'canplay',
        () => {
            texture.setSource(video);
            video.play().catch(() => undefined);
        },
        { once: true }
    );
    // Sube cada fotograma nuevo del video a la GPU.
    const onUpdate = (): void => {
        if (!video.paused) {
            texture.upload();
        }
    };
    app.on('update', onUpdate);
    app.on('destroy', () => {
        app.off('update', onUpdate);
        video.pause();
    });
}

/** Imagen de introducción a la colección, enmarcada en el tramo oeste del muro de paso (a la izquierda de la puerta al llegar). */
function addIntroImage(app: AppBase, parent: Entity, materials: MaterialSet): void {
    // Imagen 2:3; el muro mira al sur (z = 4,08), hacia el visitante que llega desde la entrada.
    addBox(parent, 'Marco · introducción a la colección', [7.05, 1.65, 4.1], [1.12, 1.62, 0.04], materials.trim);
    const surface = new StandardMaterial();
    surface.diffuse = new Color(1, 1, 1);
    surface.emissive = new Color(0.16, 0.16, 0.16);
    surface.gloss = 0.18;
    surface.update();
    addBox(parent, 'Imagen · introducción a la colección', [7.05, 1.65, 4.125], [1, 1.5, 0.02], surface);

    const texture = mediaTexture(app, 'Imagen · introducción', true);
    const image = new Image();
    image.addEventListener('load', () => {
        texture.setSource(image);
        surface.diffuseMap = texture;
        surface.update();
    });
    image.addEventListener('error', () => console.warn('No se pudo cargar la imagen de introducción.'));
    image.src = `${import.meta.env.BASE_URL}images/intro-coleccion.jpg`;
}

function addPedestal(
    parent: Entity,
    id: string,
    x: number,
    z: number,
    materials: MaterialSet,
    accent: StandardMaterial
): Entity {
    const pedestal = new Entity(id);
    pedestal.setLocalPosition(x, 0, z);
    parent.addChild(pedestal);
    // La etiqueta 'base' separa el pedestal de la pieza que se inspecciona.
    addBox(pedestal, `${id}:plinto`, [0, 0.38, 0], [1.12, 0.84, 1.02], materials.white).tags.add('base');
    addBox(pedestal, `${id}:acento`, [0, 0.83, 0], [1.12, 0.06, 1.02], accent).tags.add('base');
    return pedestal;
}

function addInteractionArrow(parent: Entity, piece: Piece, accent: StandardMaterial): Entity {
    const arrow = new Entity(`Señal interactiva · ${piece.name}`);
    arrow.setLocalPosition(piece.x, piece.y + 1.12, piece.z);
    parent.addChild(arrow);

    // Flecha compacta orientada al pasillo; al ser geometría 3D queda oculta detrás de los muros.
    addBox(arrow, 'Vástago', [0, -0.09, 0], [0.035, 0.2, 0.035], accent);
    const left = addBox(arrow, 'Punta izquierda', [-0.052, -0.24, 0], [0.035, 0.13, 0.035], accent);
    left.setLocalEulerAngles(0, 0, 40);
    const right = addBox(arrow, 'Punta derecha', [0.052, -0.24, 0], [0.035, 0.13, 0.035], accent);
    right.setLocalEulerAngles(0, 0, -40);
    return arrow;
}

function addBook(parent: Entity, x: number, z: number, materials: MaterialSet): Entity {
    const book = addPedestal(parent, 'Pieza: tomo de manga', x, z, materials, materials.stations.B);
    addBox(book, 'Bloque de páginas', [0, 1.18, 0], [0.48, 0.68, 0.11], materials.paper);
    addBox(book, 'Portada provisional del manga', [0, 1.19, 0.067], [0.48, 0.68, 0.035], materials.book);
    addBox(book, 'Lomo del tomo', [-0.22, 1.19, -0.03], [0.05, 0.68, 0.12], materials.red);
    return book;
}

function addDeck(parent: Entity, x: number, z: number, materials: MaterialSet): Entity {
    const deck = addPedestal(parent, 'Pieza: deck de cartas', x, z, materials, materials.stations.C);
    addBox(deck, 'Deck de Kaiba (provisional)', [0, 1.22, 0], [0.36, 0.48, 0.27], materials.card);
    addBox(deck, 'Frente de la caja', [0, 1.22, 0.143], [0.3, 0.39, 0.012], materials.red);
    return deck;
}

function addFigure(
    parent: Entity,
    id: string,
    x: number,
    z: number,
    body: StandardMaterial,
    hair: StandardMaterial,
    materials: MaterialSet
): Entity {
    const figure = addPedestal(parent, id, x, z, materials, materials.stations.C);
    addSphere(figure, `${id}:cabeza`, [0, 1.27, 0], [0.35, 0.34, 0.32], materials.book);
    addBox(figure, `${id}:cabello`, [0, 1.43, 0], [0.34, 0.13, 0.32], hair);
    addBox(figure, `${id}:torso`, [0, 0.96, 0], [0.3, 0.34, 0.24], body);
    addBox(figure, `${id}:pierna-izquierda`, [-0.09, 0.7, 0], [0.12, 0.12, 0.18], materials.dark);
    addBox(figure, `${id}:pierna-derecha`, [0.09, 0.7, 0], [0.12, 0.12, 0.18], materials.dark);
    return figure;
}

function addPlush(parent: Entity, x: number, z: number, materials: MaterialSet): Entity {
    const plush = addPedestal(parent, 'Pieza: peluche de Hatsune Miku', x, z, materials, materials.stations.D);
    addSphere(plush, 'Miku: cabeza provisional', [0, 1.28, 0], [0.39, 0.36, 0.34], materials.white);
    addBox(plush, 'Miku: flequillo', [0, 1.46, -0.015], [0.36, 0.13, 0.25], materials.teal);
    addBox(plush, 'Miku: coleta izquierda', [-0.29, 1.14, 0], [0.13, 0.62, 0.16], materials.teal);
    addBox(plush, 'Miku: coleta derecha', [0.29, 1.14, 0], [0.13, 0.62, 0.16], materials.teal);
    addBox(plush, 'Miku: cuerpo textil', [0, 0.9, 0], [0.28, 0.38, 0.22], materials.stations.D);
    return plush;
}

/** Construye la sala y devuelve el pedestal de cada pieza. */
export function buildRoom(app: AppBase): Map<Piece, Entity> {
    const materials = makeMaterials();
    const room = new Entity('Sala · L · 144 m²');
    app.root.addChild(room);

    // Huella: brazo de exposición de 18 x 6 m (x -6…12, z -2…4) y brazo de entrada de 6 x 6 m.
    addBox(room, 'Piso · brazo horizontal', [3, -0.1, 1], [18, 0.2, 6], materials.floor);
    addBox(room, 'Piso · brazo de entrada', [9, -0.1, 7], [6, 0.2, 6], materials.floor);

    addWall(room, 'Muro norte', 3, -2, 18, 0.16, materials);
    addWall(room, 'Muro este', 12, 4, 0.16, 12, materials);
    addWall(room, 'Muro oeste', -6, 1, 0.16, 6, materials);
    addWall(room, 'Muro interior horizontal', 0, 4, 12, 0.16, materials);
    addWall(room, 'Muro interior vertical', 6, 7, 0.16, 6, materials);
    passageWalls.forEach(({ x, z, halfX, halfZ }, index) =>
        addWall(
            room,
            `Muro de paso · segmento ${index === 0 ? 'oeste' : 'este'}`,
            x,
            z,
            halfX * 2,
            halfZ * 2,
            materials
        )
    );

    addWayfindingMap(app, room, materials);
    addDoorVideo(app, room);
    addIntroImage(app, room, materials);

    // Muro sur con dos umbrales diferenciados para entrada y salida.
    addWall(room, 'Muro sur · segmento oeste', 6.68, 10, 1.36, 0.16, materials);
    addWall(room, 'Muro sur · separación de puertas', 9.28, 10, 0.96, 0.16, materials);
    addWall(room, 'Muro sur · segmento este', 11.65, 10, 0.7, 0.16, materials);
    addBox(room, 'Umbral · entrada', [8.05, 0.015, 10], [1.4, 0.03, 0.42], materials.stations.A);
    addBox(room, 'Umbral · salida', [10.525, 0.015, 10], [1.45, 0.03, 0.42], materials.stations.E);

    // Guía central del recorrido; las piezas quedan cerca del muro norte.
    addBox(room, 'Guía de recorrido · pasillo vertical', [8.9, 0.012, 6.2], [0.08, 0.025, 7.6], materials.stations.A);
    addBox(room, 'Guía de recorrido · brazo horizontal', [2.2, 0.012, 2.4], [13.4, 0.025, 0.08], materials.stations.C);

    // Paneles y pedestales se pegan al perímetro para liberar el espacio central.
    const { manga, deck, yuji, gon, miku } = piecesById;
    addSign(room, 'A', 7.15, 8.05, materials.stations.A, materials);
    addSign(room, 'B', manga.x, signZ, materials.stations.B, materials);
    addSign(room, 'C', yuji.x, signZ, materials.stations.C, materials);
    addSign(room, 'D', miku.x, signZ, materials.stations.D, materials);
    addSign(room, 'E', closure.x, signZ, materials.stations.E, materials);

    // Piezas del brazo horizontal, orientadas hacia el corredor central.
    const pedestals = new Map<Piece, Entity>([
        [manga, addBook(room, manga.x, manga.z, materials)],
        [deck, addDeck(room, deck.x, deck.z, materials)],
        [yuji, addFigure(room, 'Pieza: Funko Yuji', yuji.x, yuji.z, materials.red, materials.dark, materials)],
        [gon, addFigure(room, 'Pieza: Funko Gon', gon.x, gon.z, materials.green, materials.teal, materials)],
        [miku, addPlush(room, miku.x, miku.z, materials)]
    ]);

    const arrowMaterial = material('#159b95', '#159b95');
    const arrows = pieces.map((piece) => addInteractionArrow(room, piece, arrowMaterial));
    let elapsed = 0;
    const animateArrows = (dt: number): void => {
        elapsed += dt;
        arrows.forEach((arrow, index) => {
            const piece = pieces[index];
            arrow.setLocalPosition(piece.x, piece.y + 1.12 + Math.sin(elapsed * 2.2 + index * 0.42) * 0.075, piece.z);
        });
    };
    app.on('update', animateArrows);
    app.once('destroy', () => app.off('update', animateArrows));

    // Paneles sin contenido curatorial final.
    addBox(room, 'Soporte de bienvenida', [7.15, 0.47, 7.62], [1.3, 0.94, 0.12], materials.white);
    addBox(room, 'Acento de bienvenida', [7.15, 0.94, 7.54], [1.3, 0.08, 0.04], materials.stations.A);
    addBox(room, 'Soporte de cierre', [closure.x, 0.47, closure.z], [1.4, 0.94, 0.12], materials.white);
    addBox(room, 'Acento de cierre', [closure.x, 0.94, closure.z - 0.08], [1.4, 0.08, 0.04], materials.stations.E);

    return pedestals;
}

const signZ = -1.58;
const closure = { x: -3.6, z: -0.5 };
// Muro que divide el brazo de entrada de la sala (z = 4, de pared a pared: x 6…12); entre ambos tramos queda un hueco de 1,8 m centrado en x = 9.
const passageWalls = [
    { x: 7.05, z: 4, halfX: 1.05, halfZ: 0.08 },
    { x: 10.95, z: 4, halfX: 1.05, halfZ: 0.08 }
];

export function isInsideGallery(position: Vec3): boolean {
    const withinOuterBounds = position.x >= -5.58 && position.x <= 11.58 && position.z >= -1.58 && position.z <= 10.35;
    const insideLFootprint = position.z <= 3.55 || position.x >= 6.45;
    const insideEntrance = position.z <= 10.35 && position.x >= 7.32 && position.x <= 8.78;
    const insideExit = position.z <= 10.35 && position.x >= 9.77 && position.x <= 11.27;
    return withinOuterBounds && (insideLFootprint || insideEntrance || insideExit);
}

const displayKeepOuts = [
    ...pieces.map(({ x, z }) => ({ x, z, halfX: 0.72, halfZ: 0.64 })),
    { ...closure, halfX: 0.88, halfZ: 0.62 },
    { x: 7.15, z: 7.83, halfX: 0.82, halfZ: 0.74 },
    ...passageWalls
];

export function canWalkTo(position: Vec3): boolean {
    if (!isInsideGallery(position)) {
        return false;
    }

    const visitorRadius = 0.32;
    return !displayKeepOuts.some(
        (display) =>
            Math.abs(position.x - display.x) < display.halfX + visitorRadius &&
            Math.abs(position.z - display.z) < display.halfZ + visitorRadius
    );
}
