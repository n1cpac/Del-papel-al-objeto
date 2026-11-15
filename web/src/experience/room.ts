import type { AppBase, ContainerResource, Material, RenderComponent, Vec3 } from 'playcanvas';
import {
    ADDRESS_CLAMP_TO_EDGE,
    Color,
    Entity,
    FILTER_LINEAR,
    Mesh,
    MeshInstance,
    PIXELFORMAT_SRGBA8,
    SEMANTIC_TANGENT,
    StandardMaterial,
    Texture
} from 'playcanvas';

import type { Piece } from './pieces';
import { pieces, piecesById } from './pieces';

type MaterialSet = {
    wall: StandardMaterial;
    floor: StandardMaterial;
    trim: StandardMaterial;
    ceilingBase: StandardMaterial;
    ceilingRecess: StandardMaterial;
    ceilingBeam: StandardMaterial;
    ceilingAccent: StandardMaterial;
    ceilingGlow: StandardMaterial;
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

function material(color: string, emissive?: string, gloss = 0.18): StandardMaterial {
    const result = new StandardMaterial();
    result.diffuse = new Color().fromString(color);
    result.emissive = new Color().fromString(emissive ?? '#000000');
    result.metalness = 0;
    result.gloss = gloss;
    result.update();
    return result;
}

function makeMaterials(): MaterialSet {
    const teal = material('#159b95');
    return {
        wall: material('#2f1f16'),
        floor: material('#f7f4ec'),
        trim: material('#43575b'),
        ceilingBase: material('#4a3325', '#100a06'),
        ceilingRecess: material('#5c402e', '#160e09'),
        ceilingBeam: material('#2f1f16', '#0a0604', 0.26),
        ceilingAccent: material('#7a563c', '#1a110b'),
        ceilingGlow: material('#fff2dc', '#f3cfa4'),
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

function loadPictureMaterial(app: AppBase, imageFile: string, errorMessage: string): StandardMaterial {
    const pictureMaterial = material('#fffdf8');
    app.assets.loadFromUrl(`${import.meta.env.BASE_URL}images/${imageFile}`, 'texture', (error, asset) => {
        if (error || !asset?.resource) {
            console.warn(errorMessage, error);
            return;
        }
        pictureMaterial.diffuseMap = asset.resource;
        pictureMaterial.emissive = new Color(0.16, 0.16, 0.16);
        pictureMaterial.update();
    });
    return pictureMaterial;
}

type StandPlacement = {
    holder: Entity;
    scale: [number, number, number];
};

function addObjectPanel(
    app: AppBase,
    parent: Entity,
    label: string,
    x: number,
    z: number,
    imageFile: string,
    accent: StandardMaterial,
    materials: MaterialSet
): void {
    const panel = new Entity(`Panel · ${label}`);
    panel.setLocalPosition(x, 0, z);
    parent.addChild(panel);

    addBox(panel, `${label}:base`, [0, 0.09, 0], [0.66, 0.18, 0.26], materials.ceilingBeam);
    addBox(panel, `${label}:soporte`, [0, 0.76, 0], [0.14, 1.36, 0.1], materials.ceilingBeam);
    addBox(panel, `${label}:marco`, [0, 2.08, 0], [1.08, 1.4, 0.07], materials.ceilingBeam);
    addBox(panel, `${label}:acento`, [0, 2.08, 0.01], [1.01, 1.33, 0.06], accent);

    const pictureMaterial = loadPictureMaterial(
        app,
        imageFile,
        `No se pudo cargar la imagen del panel (${imageFile}).`
    );
    addBox(panel, `${label}:imagen`, [0, 2.08, 0.042], [0.96, 1.28, 0.02], pictureMaterial);
}

type WallPictureSpec = {
    frameName: string;
    pictureName: string;
    framePosition: [number, number, number];
    frameScale: [number, number, number];
    picturePosition: [number, number, number];
    pictureScale: [number, number, number];
    yaw: number;
    imageFile: string;
    errorMessage: string;
};

function addWallPicture(app: AppBase, parent: Entity, materials: MaterialSet, spec: WallPictureSpec): void {
    const frame = addBox(parent, spec.frameName, spec.framePosition, spec.frameScale, materials.trim);
    frame.setLocalEulerAngles(0, spec.yaw, 0);
    const pictureMaterial = loadPictureMaterial(app, spec.imageFile, spec.errorMessage);
    const picture = addBox(parent, spec.pictureName, spec.picturePosition, spec.pictureScale, pictureMaterial);
    picture.setLocalEulerAngles(0, spec.yaw, 0);
}

function addWayfindingMap(app: AppBase, parent: Entity, materials: MaterialSet): void {
    // Marco mural al comienzo del pasillo de entrada, mirando hacia el recorrido y sobre el zócalo (1,32 m).
    addWallPicture(app, parent, materials, {
        frameName: 'Marco · plano del recorrido',
        pictureName: 'Plano del recorrido · orientación',
        framePosition: [11.84, 1.82, 8.45],
        frameScale: [2.02, 1.25, 0.12],
        picturePosition: [11.77, 1.82, 8.45],
        pictureScale: [1.78, 1, 0.035],
        yaw: -90,
        imageFile: 'plano-recorrido.png',
        errorMessage: 'No se pudo cargar el plano mural del recorrido.'
    });
}

function addExitSign(app: AppBase, parent: Entity, materials: MaterialSet): void {
    // Cuadro a la derecha de la puerta de salida (muro oeste, x = -6), con relación 3:1 (2172×724) apuntando a la puerta.
    addWallPicture(app, parent, materials, {
        frameName: 'Marco · señal de salida',
        pictureName: 'Cuadro · señal de salida',
        framePosition: [-5.92, 1.82, -0.35],
        frameScale: [2.11, 0.81, 0.12],
        picturePosition: [-5.85, 1.82, -0.35],
        pictureScale: [1.95, 0.65, 0.035],
        yaw: 90,
        imageFile: 'salida.png',
        errorMessage: 'No se pudo cargar la imagen de señal de salida.'
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

/** Crea la malla en forma de arco para que el video de la puerta siga exactamente la geometría del arco 3D. */
function createArchPortalMesh(app: AppBase): Mesh {
    const rx = 0.976;
    const yMin = 0.02;
    const ySpring = 1.694;
    const ry = 1.491;
    const yMax = ySpring + ry;
    const centerY = 1.5;
    const segments = 32;

    const perimeter: [number, number][] = [
        [-rx, yMin],
        [rx, yMin],
        [rx, ySpring]
    ];
    for (let i = 1; i < segments; i++) {
        const theta = (i / segments) * Math.PI;
        perimeter.push([rx * Math.cos(theta), ySpring + ry * Math.sin(theta)]);
    }
    perimeter.push([-rx, ySpring]);

    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    const mapV = (y: number): number => 0.05 + ((y - yMin) / (yMax - yMin)) * 0.9;
    const addFace = (z: number, normalZ: number, mirrorU: boolean): void => {
        const baseIndex = positions.length / 3;
        positions.push(0, centerY, z);
        normals.push(0, 0, normalZ);
        uvs.push(0.5, mapV(centerY));

        for (const [x, y] of perimeter) {
            positions.push(x, y, z);
            normals.push(0, 0, normalZ);
            const t = (x + rx) / (2 * rx);
            uvs.push(mirrorU ? 0.95 - t * 0.9 : 0.05 + t * 0.9, mapV(y));
        }

        const count = perimeter.length;
        for (let i = 0; i < count; i++) {
            const a = baseIndex + 1 + i;
            const b = baseIndex + 1 + ((i + 1) % count);
            if (normalZ > 0) {
                indices.push(baseIndex, a, b);
            } else {
                indices.push(baseIndex, b, a);
            }
        }
    };

    addFace(0.008, 1, false);
    addFace(-0.008, -1, true);

    const mesh = new Mesh(app.graphicsDevice);
    mesh.setPositions(positions);
    mesh.setNormals(normals);
    mesh.setUvs(0, uvs);
    mesh.setIndices(indices);
    mesh.update();
    return mesh;
}

/** Video vertical (9:16) adaptado a la geometría del arco del muro de paso. No tiene colisión: se atraviesa. */
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

    const portal = new Entity('Puerta · video Carta de Yugi');
    portal.setLocalPosition(9, 0, 4);
    portal.addComponent('render', { meshInstances: [new MeshInstance(createArchPortalMesh(app), surface)] });
    parent.addChild(portal);

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
function addIntroImage(app: AppBase, room: Entity, materials: MaterialSet): Entity {
    // Grupo propio: la inspección copia el marco y la imagen como una sola pieza.
    const parent = new Entity('Panel · introducción a la colección');
    room.addChild(parent);
    // Imagen 2:3; el muro mira al sur (z = 4,08), por encima del zócalo hacia el visitante que llega desde la entrada.
    addBox(parent, 'Marco · introducción a la colección', [7.05, 1.82, 4.14], [1.12, 1.62, 0.04], materials.trim);
    const surface = new StandardMaterial();
    surface.diffuse = new Color(1, 1, 1);
    surface.emissive = new Color(0.16, 0.16, 0.16);
    surface.gloss = 0.18;
    surface.update();
    addBox(parent, 'Imagen · introducción a la colección', [7.05, 1.82, 4.165], [1, 1.5, 0.02], surface);

    const texture = mediaTexture(app, 'Imagen · introducción', true);
    const image = new Image();
    image.addEventListener('load', () => {
        texture.setSource(image);
        surface.diffuseMap = texture;
        surface.update();
    });
    image.addEventListener('error', () => console.warn('No se pudo cargar la imagen de introducción.'));
    image.src = `${import.meta.env.BASE_URL}images/intro-coleccion.jpg`;
    return parent;
}

function addPedestal(
    parent: Entity,
    id: string,
    x: number,
    z: number,
    standTargets: StandPlacement[],
    scale: [number, number, number] = [1, 1, 1]
): Entity {
    const pedestal = new Entity(id);
    pedestal.setLocalPosition(x, 0, z);
    parent.addChild(pedestal);
    // La etiqueta 'base' separa el stand de la pieza que se inspecciona.
    const standHolder = new Entity(`${id}:mesa`);
    standHolder.tags.add('base');
    pedestal.addChild(standHolder);
    standTargets.push({ holder: standHolder, scale });
    return pedestal;
}

function addInfographicStand(
    app: AppBase,
    parent: Entity,
    x: number,
    z: number,
    materials: MaterialSet,
    standTargets: StandPlacement[]
): void {
    const stand = addPedestal(parent, 'Infografía · colección japonesa', x, z, standTargets, [1.38, 1, 0.92]);
    addBox(stand, 'Infografía · zócalo', [0, 0.9, 0], [1.48, 0.07, 0.28], materials.ceilingBeam).tags.add('base');
    addBox(stand, 'Infografía · soporte izquierdo', [-0.68, 1.04, 0], [0.08, 0.28, 0.22], materials.ceilingAccent).tags.add('base');
    addBox(stand, 'Infografía · soporte derecho', [0.68, 1.04, 0], [0.08, 0.28, 0.22], materials.ceilingAccent).tags.add('base');
    addBox(stand, 'Infografía · marco', [0, 1.96, 0], [1.42, 2.06, 0.08], materials.ceilingBeam).tags.add('base');
    addBox(stand, 'Infografía · borde', [0, 1.96, 0.01], [1.36, 2, 0.07], materials.stations.E).tags.add('base');

    const pictureMaterial = loadPictureMaterial(
        app,
        encodeURIComponent('Del papel al objeto_ colección japonesa.png'),
        'No se pudo cargar la infografía vertical de la colección.'
    );
    addBox(stand, 'Infografía · imagen', [0, 1.96, 0.045], [1.3, 1.95, 0.02], pictureMaterial).tags.add('base');
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

function addBook(
    parent: Entity,
    x: number,
    z: number,
    materials: MaterialSet,
    standTargets: StandPlacement[]
): Entity {
    const book = addPedestal(parent, 'Pieza: tomo de manga', x, z, standTargets);
    addBox(book, 'Bloque de páginas', [0, 1.21, 0], [0.48, 0.68, 0.11], materials.paper);
    addBox(book, 'Portada provisional del manga', [0, 1.22, 0.067], [0.48, 0.68, 0.035], materials.book);
    addBox(book, 'Lomo del tomo', [-0.22, 1.22, -0.03], [0.05, 0.68, 0.12], materials.red);
    return book;
}

function addDeck(
    parent: Entity,
    x: number,
    z: number,
    materials: MaterialSet,
    standTargets: StandPlacement[]
): Entity {
    const deck = addPedestal(parent, 'Pieza: deck de cartas', x, z, standTargets);
    addBox(deck, 'Deck de Kaiba (provisional)', [0, 1.11, 0], [0.36, 0.48, 0.27], materials.card);
    addBox(deck, 'Frente de la caja', [0, 1.11, 0.143], [0.3, 0.39, 0.012], materials.red);
    return deck;
}

function addFigure(
    parent: Entity,
    id: string,
    x: number,
    z: number,
    body: StandardMaterial,
    hair: StandardMaterial,
    materials: MaterialSet,
    standTargets: StandPlacement[]
): Entity {
    const figure = addPedestal(parent, id, x, z, standTargets);
    addSphere(figure, `${id}:cabeza`, [0, 1.5, 0], [0.35, 0.34, 0.32], materials.book);
    addBox(figure, `${id}:cabello`, [0, 1.66, 0], [0.34, 0.13, 0.32], hair);
    addBox(figure, `${id}:torso`, [0, 1.19, 0], [0.3, 0.34, 0.24], body);
    addBox(figure, `${id}:pierna-izquierda`, [-0.09, 0.93, 0], [0.12, 0.12, 0.18], materials.dark);
    addBox(figure, `${id}:pierna-derecha`, [0.09, 0.93, 0], [0.12, 0.12, 0.18], materials.dark);
    return figure;
}

function addPlush(
    parent: Entity,
    x: number,
    z: number,
    materials: MaterialSet,
    standTargets: StandPlacement[]
): Entity {
    const plush = addPedestal(parent, 'Pieza: peluche de Hatsune Miku', x, z, standTargets);
    addSphere(plush, 'Miku: cabeza provisional', [0, 1.44, 0], [0.39, 0.36, 0.34], materials.white);
    addBox(plush, 'Miku: flequillo', [0, 1.62, -0.015], [0.36, 0.13, 0.25], materials.teal);
    addBox(plush, 'Miku: coleta izquierda', [-0.29, 1.3, 0], [0.13, 0.62, 0.16], materials.teal);
    addBox(plush, 'Miku: coleta derecha', [0.29, 1.3, 0], [0.13, 0.62, 0.16], materials.teal);
    addBox(plush, 'Miku: cuerpo textil', [0, 1.06, 0], [0.28, 0.38, 0.22], materials.stations.D);
    return plush;
}

type WallFacing = 'E' | 'W' | 'S' | 'N';

const facingYaw: Record<WallFacing, number> = {
    E: 0,
    W: 180,
    S: -90,
    N: 90
};

type DioramaParts = {
    floorMaterial: Material;
    wallpaperMaterial: Material;
    carpetStraight: Entity;
    carpetTurnLeft: Entity;
    wallPaper: Entity;
    wallTrim: Entity;
    lamp: Entity;
    archway: Entity;
    doorFrame: Entity;
    door: Entity;
};

/** Crea la enjuta/albanega (malla plana sobre el arco hasta `yTop`, orientada hacia +Z). */
function createArchSpandrelMesh(
    app: AppBase,
    rx: number,
    ySpring: number,
    ry: number,
    yTop: number,
    uvU: (x: number) => number,
    uvV: (y: number) => number
): Mesh {
    const segments = 32;
    const positions: number[] = [];
    const normals: number[] = [];
    const tangents: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let k = 0; k <= segments; k++) {
        const theta = Math.PI * (1 - k / segments);
        const x = rx * Math.cos(theta);
        const yArch = ySpring + ry * Math.sin(theta);

        positions.push(x, yArch, 0, x, yTop, 0);
        normals.push(0, 0, 1, 0, 0, 1);
        tangents.push(1, 0, 0, 1, 1, 0, 0, 1);
        uvs.push(uvU(x), uvV(yArch), uvU(x), uvV(yTop));
    }

    for (let k = 0; k < segments; k++) {
        const b0 = k * 2;
        const t0 = b0 + 1;
        const b1 = b0 + 2;
        const t1 = b0 + 3;
        indices.push(b0, b1, t1, b0, t1, t0);
    }

    const mesh = new Mesh(app.graphicsDevice);
    mesh.setPositions(positions);
    mesh.setNormals(normals);
    mesh.setVertexStream(SEMANTIC_TANGENT, tangents, 4);
    mesh.setUvs(0, uvs);
    mesh.setIndices(indices);
    mesh.update();
    return mesh;
}

function addSpandrelFace(
    parent: Entity,
    name: string,
    mesh: Mesh,
    surface: Material,
    position: [number, number, number],
    yaw: number
): void {
    const entity = new Entity(name);
    entity.setLocalPosition(...position);
    entity.setLocalEulerAngles(0, yaw, 0);
    entity.addComponent('render', { meshInstances: [new MeshInstance(mesh, surface)] });
    parent.addChild(entity);
}

function addCofferBay(parent: Entity, cx: number, cz: number, materials: MaterialSet): void {
    addBox(parent, 'Casetón · panel', [cx, 3.41, cz], [2.66, 0.04, 2.66], materials.ceilingRecess);
    addBox(parent, 'Casetón · moldura norte', [cx, 3.38, cz - 1.31], [2.7, 0.04, 0.08], materials.ceilingAccent);
    addBox(parent, 'Casetón · moldura sur', [cx, 3.38, cz + 1.31], [2.7, 0.04, 0.08], materials.ceilingAccent);
    addBox(parent, 'Casetón · moldura oeste', [cx - 1.31, 3.38, cz], [0.08, 0.04, 2.54], materials.ceilingAccent);
    addBox(parent, 'Casetón · moldura este', [cx + 1.31, 3.38, cz], [0.08, 0.04, 2.54], materials.ceilingAccent);
}

function addCeiling(room: Entity, materials: MaterialSet): void {
    const ceiling = new Entity('Techo · artesonado café');
    room.addChild(ceiling);

    // Losa base superior sobre ambos brazos de la L.
    addBox(ceiling, 'Techo · losa horizontal', [3, 3.46, 1], [18.2, 0.08, 6.2], materials.ceilingBase);
    addBox(ceiling, 'Techo · losa entrada', [9, 3.46, 7], [6.2, 0.08, 6.2], materials.ceilingBase);

    // Casetones de nogal con marco escalonado bronce.
    for (const cx of [-4.5, -1.5, 1.5, 4.5, 7.5, 10.5]) {
        for (const cz of [-0.5, 2.5]) {
            addCofferBay(ceiling, cx, cz, materials);
        }
    }
    for (const cx of [7.5, 10.5]) {
        for (const cz of [5.5, 8.5]) {
            addCofferBay(ceiling, cx, cz, materials);
        }
    }

    // Vigas maestras oscuras entre casetones (base en y = 3,30 m para encajar con muros y arcos sin cortes).
    for (const x of [-6, -3, 0, 3, 6, 9, 12]) {
        addBox(ceiling, `Viga transversal · x=${x}`, [x, 3.35, 1], [0.28, 0.1, 6], materials.ceilingBeam);
    }
    addBox(ceiling, 'Viga central · galería', [3, 3.35, 1], [18, 0.1, 0.28], materials.ceilingBeam);

    addBox(ceiling, 'Viga transversal · entrada', [9, 3.35, 7], [6, 0.1, 0.28], materials.ceilingBeam);
    addBox(ceiling, 'Viga central · entrada', [9, 3.35, 7], [0.28, 0.1, 6], materials.ceilingBeam);
    addBox(ceiling, 'Viga · sobre muro de paso', [9, 3.35, 4], [6, 0.1, 0.28], materials.ceilingBeam);

    // Cornisa perimetral escalonada que remata la parte superior de los muros (y = 3,26…3,44 m).
    addBox(ceiling, 'Cornisa · norte', [3, 3.35, -1.96], [18.2, 0.18, 0.16], materials.ceilingBeam);
    addBox(ceiling, 'Cornisa · este', [11.96, 3.35, 4], [0.16, 0.18, 12.2], materials.ceilingBeam);
    addBox(ceiling, 'Cornisa · oeste', [-5.96, 3.35, 1], [0.16, 0.18, 6.2], materials.ceilingBeam);
    addBox(ceiling, 'Cornisa · interior horizontal', [0, 3.35, 3.96], [12.2, 0.18, 0.16], materials.ceilingBeam);
    addBox(ceiling, 'Cornisa · interior vertical', [6.04, 3.35, 7], [0.16, 0.18, 6.2], materials.ceilingBeam);
    addBox(ceiling, 'Cornisa · sur', [9, 3.35, 9.96], [6.2, 0.18, 0.16], materials.ceilingBeam);

    // Plafones escalonados cálidos en los cruces principales del recorrido.
    for (const [x, z] of [
        [-3, 1],
        [3, 1],
        [9, 1],
        [9, 7]
    ]) {
        addBox(ceiling, 'Plafón · base', [x, 3.29, z], [0.64, 0.05, 0.64], materials.ceilingBeam);
        addBox(ceiling, 'Plafón · moldura', [x, 3.265, z], [0.46, 0.03, 0.46], materials.ceilingAccent);
        addBox(ceiling, 'Plafón · difusor', [x, 3.245, z], [0.3, 0.025, 0.3], materials.ceilingGlow);
    }
}

/** Crea una malla plana horizontal con UVs continuas (0,5 unidades UV por metro) para el piso de madera. */
function addTexturedFloorRect(
    app: AppBase,
    parent: Entity,
    name: string,
    minX: number,
    maxX: number,
    minZ: number,
    maxZ: number,
    y: number,
    surface: Material
): void {
    const uvScale = 0.5;
    const mesh = new Mesh(app.graphicsDevice);
    mesh.setPositions([minX, y, minZ, minX, y, maxZ, maxX, y, maxZ, maxX, y, minZ]);
    mesh.setNormals([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0]);
    mesh.setVertexStream(SEMANTIC_TANGENT, [1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1], 4);
    mesh.setUvs(0, [
        minX * uvScale,
        minZ * uvScale,
        minX * uvScale,
        maxZ * uvScale,
        maxX * uvScale,
        maxZ * uvScale,
        maxX * uvScale,
        minZ * uvScale
    ]);
    mesh.setIndices([0, 1, 2, 0, 2, 3]);
    mesh.update();

    const entity = new Entity(name);
    entity.addComponent('render', { meshInstances: [new MeshInstance(mesh, surface)] });
    parent.addChild(entity);
}

function addWallSconce(
    parent: Entity,
    name: string,
    x: number,
    z: number,
    facing: WallFacing,
    parts: DioramaParts
): void {
    const sconce = new Entity(name);
    sconce.setLocalPosition(x, 0, z);
    sconce.setLocalEulerAngles(0, facingYaw[facing], 0);
    sconce.setLocalScale(0.01, 0.01, 0.01);
    const lamp = parts.lamp.clone();
    lamp.setLocalPosition(1.464, 241.653, 0);
    sconce.addChild(lamp);
    parent.addChild(sconce);
}

function addModularWall(
    parent: Entity,
    name: string,
    x: number,
    z: number,
    facing: WallFacing,
    length: number,
    parts: DioramaParts,
    withLamp = false
): void {
    const wall = new Entity(name);
    wall.setLocalPosition(x, 0, z);
    wall.setLocalEulerAngles(0, facingYaw[facing], 0);
    parent.addChild(wall);

    const scaleY = 0.01 * (3.3 / 3.0);
    const scaleZ = 0.01 * (length / 6.0);
    const panel = new Entity(`${name}:panel`);
    panel.setLocalPosition(1.5, 0, 0);
    panel.setLocalScale(0.01, scaleY, scaleZ);
    panel.addChild(parts.wallPaper.clone());
    panel.addChild(parts.wallTrim.clone());
    wall.addChild(panel);

    if (withLamp) {
        addWallSconce(wall, `${name}:lampara`, 0, 0, 'E', parts);
    }
}

function addArchway(
    parent: Entity,
    name: string,
    x: number,
    z: number,
    yaw: number,
    scaleX: number,
    scaleY: number,
    scaleZ: number,
    parts: DioramaParts
): void {
    const wrapper = new Entity(name);
    wrapper.setLocalPosition(x, 0, z);
    wrapper.setLocalEulerAngles(0, yaw, 0);
    parent.addChild(wrapper);

    const arch = new Entity(`${name}:arco`);
    arch.setLocalPosition(0.05 * scaleX, 0, 3.0 * scaleZ);
    arch.setLocalScale(0.01 * scaleX, 0.01 * scaleY, 0.01 * scaleZ);
    arch.addChild(parts.archway.clone());
    wrapper.addChild(arch);
}

function addDoorAssembly(
    parent: Entity,
    name: string,
    x: number,
    z: number,
    facing: WallFacing,
    parts: DioramaParts,
    backingMaterial: StandardMaterial
): void {
    const wrapper = new Entity(name);
    wrapper.setLocalPosition(x, 0, z);
    wrapper.setLocalEulerAngles(0, facingYaw[facing], 0);
    parent.addChild(wrapper);

    // Tablero oscuro detrás de la puerta para cubrir el zócalo en el vano superior (2,20…2,50 m).
    addBox(wrapper, `${name}:fondo`, [0.125, 1.25, 0], [0.03, 2.45, 1.8], backingMaterial);

    const frame = new Entity(`${name}:marco`);
    frame.setLocalPosition(0.15, 0, 0.85);
    frame.setLocalScale(0.01, 0.01, 0.01);
    frame.addChild(parts.doorFrame.clone());
    wrapper.addChild(frame);

    const leaf = new Entity(`${name}:hoja`);
    leaf.setLocalPosition(0.075, 0.0377, 0);
    leaf.setLocalScale(0.01, 0.01, 0.01);
    leaf.addChild(parts.door.clone());
    wrapper.addChild(leaf);
}

function extractDioramaParts(resource: ContainerResource): DioramaParts | null {
    const root = resource.instantiateRenderEntity();
    const byName = (name: string): Entity | null => {
        const found = root.findByName(name);
        return found instanceof Entity ? found : null;
    };

    const floorMesh = byName('Floor1_FloorMAT_0');
    const carpetStraight = byName('Floor1_FabricMAT_0');
    const carpetTurnLeft = byName('Floor3_FabricMAT_0');
    const wallPaper = byName('Floor1_WallpaperMAT_0');
    const wallTrim = byName('Floor1_TrimSheetMAT_0');
    const lamp = byName('Lamp');
    const archway = byName('Archway_TrimSheetMAT_0');
    const doorFrame = byName('DoorFrame_TrimSheetMAT_0');
    const door = byName('Door_TrimSheetMAT_0');

    const floorMaterial = (floorMesh?.findComponent('render') as RenderComponent | null)?.meshInstances[0]?.material;
    const wallpaperMaterial = (wallPaper?.findComponent('render') as RenderComponent | null)?.meshInstances[0]?.material;

    // Iluminación cálida suave en las pantallas de las lámparas murales.
    for (const matAsset of resource.materials) {
        const mat = matAsset.resource;
        if (mat instanceof StandardMaterial && mat.name === 'PlasterMAT') {
            mat.emissive = new Color(0.95, 0.82, 0.58);
            mat.emissiveIntensity = 1.35;
            mat.update();
        }
    }

    if (
        !floorMaterial ||
        !wallpaperMaterial ||
        !carpetStraight ||
        !carpetTurnLeft ||
        !wallPaper ||
        !wallTrim ||
        !lamp ||
        !archway ||
        !doorFrame ||
        !door
    ) {
        root.destroy();
        return null;
    }

    return {
        floorMaterial,
        wallpaperMaterial,
        carpetStraight,
        carpetTurnLeft,
        wallPaper,
        wallTrim,
        lamp,
        archway,
        doorFrame,
        door
    };
}

function populateDioramaArchitecture(
    app: AppBase,
    room: Entity,
    materials: MaterialSet,
    parts: DioramaParts
): void {
    const architecture = new Entity('Arquitectura · pasillo diorama');
    room.addChild(architecture);

    // Piso continuo de madera en ambos brazos de la L (y = 0,002 para evitar solapamiento con el respaldo).
    addTexturedFloorRect(app, architecture, 'Piso madera · brazo horizontal', -6, 12, -2, 4, 0.002, parts.floorMaterial);
    addTexturedFloorRect(app, architecture, 'Piso madera · brazo entrada', 6, 12, 4, 10, 0.002, parts.floorMaterial);

    // Alfombra 3D continua guiando el recorrido desde entrada/salida hasta el giro a la izquierda.
    const carpetVertical = new Entity('Alfombra · pasillo vertical');
    carpetVertical.setLocalPosition(9, 0, 6.6);
    carpetVertical.setLocalScale(0.01, 0.01, 0.01 * (5.8 / 6.0));
    carpetVertical.addChild(parts.carpetStraight.clone());
    architecture.addChild(carpetVertical);

    const carpetCorner = new Entity('Alfombra · giro izquierda');
    carpetCorner.setLocalPosition(9, 0, 2.2);
    carpetCorner.setLocalScale(0.01, 0.01, 0.01);
    carpetCorner.addChild(parts.carpetTurnLeft.clone());
    architecture.addChild(carpetCorner);

    for (const [index, centerX] of [4.25, -2.25].entries()) {
        const segment = new Entity(`Alfombra · brazo izquierdo ${index + 1}`);
        segment.setLocalPosition(centerX, 0, 2.2);
        segment.setLocalEulerAngles(0, 90, 0);
        segment.setLocalScale(0.01, 0.01, 0.01 * (6.5 / 6.0));
        segment.addChild(parts.carpetStraight.clone());
        architecture.addChild(segment);
    }

    // Muros modulares con zócalo, papel tapiz y lámparas murales en los espacios libres entre paneles.
    for (const [index, x] of [-3, 3, 9].entries()) {
        addModularWall(architecture, `Muro norte ${index + 1}`, x, -2, 'S', 6, parts, false);
    }
    for (const [index, x] of [-1.75, 3.7, 9].entries()) {
        addWallSconce(architecture, `Lámpara · muro norte ${index + 1}`, x, -2, 'S', parts);
    }
    addModularWall(architecture, 'Muro este · galería', 12, 1, 'W', 6, parts, true);
    addModularWall(architecture, 'Muro este · entrada', 12, 7, 'W', 6, parts, false);
    addModularWall(architecture, 'Muro oeste', -6, 1, 'E', 6, parts, false);

    for (const [index, x] of [-3, 3].entries()) {
        addModularWall(architecture, `Muro interior horizontal ${index + 1}`, x, 4, 'N', 6, parts, true);
    }
    addModularWall(architecture, 'Muro interior vertical', 6, 7, 'E', 6, parts, true);
    addModularWall(architecture, 'Muro sur', 9, 10, 'N', 6, parts, false);

    // Ambos lados del muro de paso (z = 4, x = 6…12): llegan hasta las pilastras del arco central.
    for (const [side, x] of [
        ['oeste', 7.012],
        ['este', 10.988]
    ] as const) {
        addModularWall(architecture, `Muro de paso ${side} · cara sur`, x, 4.085, 'S', 2.024, parts);
        addModularWall(architecture, `Muro de paso ${side} · cara norte`, x, 3.915, 'N', 2.024, parts);
    }

    // Enjutas con papel tapiz sobre el arco del muro de paso para rellenar el espacio hasta el techo.
    const passageSpandrel = createArchSpandrelMesh(
        app,
        0.976,
        1.694,
        1.491,
        3.3,
        (x) => x * 0.474,
        (y) => 0.028 + ((y - 1.32) / (3.3 - 1.32)) * (0.978 - 0.028)
    );
    addSpandrelFace(architecture, 'Enjuta paso · sur', passageSpandrel, parts.wallpaperMaterial, [9, 0, 4.085], 0);
    addSpandrelFace(architecture, 'Enjuta paso · norte', passageSpandrel, parts.wallpaperMaterial, [9, 0, 3.915], 180);

    // Puertas del modelo colocadas en la entrada y en la salida sobre el muro sur (z = 10) y al final del pasillo (x = -6).
    addDoorAssembly(architecture, 'Puerta · entrada', 8.05, 10, 'N', parts, materials.dark);
    addDoorAssembly(architecture, 'Puerta · salida', 10.525, 10, 'N', parts, materials.dark);
    addDoorAssembly(architecture, 'Puerta · salida final', -6, 2.2, 'E', parts, materials.dark);

    // Arco en el paso de la carta de Yugi y arcos transversales en la galería horizontal.
    addArchway(architecture, 'Arco · paso central', 9, 4, 0, 0.72, 1.1, 1, parts);
    const corridorSpandrel = createArchSpandrelMesh(
        app,
        2.791,
        1.694,
        1.491,
        3.3,
        (x) => (x + 2.791) * 0.25,
        (y) => (y - 1.694) * 0.5
    );
    for (const [label, x] of [
        ['este', 6],
        ['oeste', 1.4]
    ] as const) {
        addArchway(architecture, `Arco · galería ${label}`, x, 1, 90, 2.06, 1.1, 1, parts);
        addSpandrelFace(architecture, `Enjuta galería ${label} · este`, corridorSpandrel, materials.ceilingBeam, [x + 0.12, 0, 1], 90);
        addSpandrelFace(architecture, `Enjuta galería ${label} · oeste`, corridorSpandrel, materials.ceilingBeam, [x - 0.12, 0, 1], -90);
    }
}

/** Construye la sala y devuelve el pedestal de cada pieza. */
export function buildRoom(app: AppBase): Map<Piece, Entity> {
    const materials = makeMaterials();
    const room = new Entity('Sala · L · 144 m²');
    app.root.addChild(room);

    // Respaldo estructural opaco detrás de los paneles del diorama (desplazado 0,09 m hacia el exterior).
    addBox(room, 'Piso · brazo horizontal', [3, -0.1, 1], [18, 0.2, 6], materials.floor);
    addBox(room, 'Piso · brazo de entrada', [9, -0.1, 7], [6, 0.2, 6], materials.floor);

    addWall(room, 'Muro norte · respaldo', 3, -2.09, 18.2, 0.16, materials);
    addWall(room, 'Muro este · respaldo', 12.09, 4, 0.16, 12.2, materials);
    addWall(room, 'Muro oeste · respaldo', -6.09, 1, 0.16, 6.2, materials);
    addWall(room, 'Muro interior horizontal · respaldo', -0.08, 4.09, 12, 0.16, materials);
    addWall(room, 'Muro interior vertical · respaldo', 5.91, 7.08, 0.16, 6, materials);
    addWall(room, 'Muro sur · respaldo', 9, 10.09, 6.2, 0.16, materials);
    addBox(room, 'Pilastra · esquina interior', [6, 1.65, 4], [0.22, 3.3, 0.22], materials.ceilingBeam);
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
    const backingSpandrel = createArchSpandrelMesh(
        app,
        0.976,
        1.694,
        1.491,
        3.3,
        (x) => (x + 1) * 0.5,
        (y) => y * 0.3
    );
    addSpandrelFace(room, 'Enjuta respaldo · sur', backingSpandrel, materials.dark, [9, 0, 4.08], 0);
    addSpandrelFace(room, 'Enjuta respaldo · norte', backingSpandrel, materials.dark, [9, 0, 3.92], 180);

    addCeiling(room, materials);
    addWayfindingMap(app, room, materials);
    addExitSign(app, room, materials);
    addDoorVideo(app, room);

    // Umbrales cromáticos en el piso frente a las puertas de entrada y salida.
    addBox(room, 'Umbral · entrada', [8.05, 0.008, 9.48], [1.4, 0.016, 0.24], materials.stations.A);
    addBox(room, 'Umbral · salida', [10.525, 0.008, 9.48], [1.4, 0.016, 0.24], materials.stations.E);
    addBox(room, 'Umbral · salida final', [-5.48, 0.008, 2.2], [0.24, 0.016, 1.4], materials.stations.E);

    // Carga del estilo modular 3D desde hallway_diorama.glb adaptado a la sala en L.
    app.assets.loadFromUrl(`${import.meta.env.BASE_URL}models/hallway_diorama.glb`, 'container', (error, asset) => {
        if (error || !asset?.resource) {
            console.warn('No se pudo cargar el modelo del pasillo (hallway_diorama.glb).', error);
            return;
        }
        const parts = extractDioramaParts(asset.resource as ContainerResource);
        if (!parts) {
            console.warn('No se encontraron los módulos esperados dentro de hallway_diorama.glb.');
            return;
        }
        populateDioramaArchitecture(app, room, materials, parts);
    });

    // Paneles individuales detrás de cada objeto e infografía vertical en el extremo oeste.
    const { intro, manga, deck, yuji, gon, miku } = piecesById;
    const panelSpecs: [string, number, string, StandardMaterial][] = [
        ['manga', manga.x, 'tomo.png', materials.stations.B],
        ['deck', deck.x, 'carta.png', materials.stations.C],
        ['yuji', yuji.x, 'itadori.png', materials.stations.C],
        ['gon', gon.x, 'gon.png', materials.stations.C],
        ['miku', miku.x, 'miku.png', materials.stations.D]
    ];
    for (const [label, x, imageFile, accent] of panelSpecs) {
        addObjectPanel(app, room, label, x, signZ, imageFile, accent, materials);
    }

    const standTargets: StandPlacement[] = [];
    addInfographicStand(app, room, -3.45, -0.72, materials, standTargets);

    // Piezas del brazo horizontal sobre stands del modelo psx_tv_stand.glb.
    const pedestals = new Map<Piece, Entity>([
        [intro, addIntroImage(app, room, materials)],
        [manga, addBook(room, manga.x, manga.z, materials, standTargets)],
        [deck, addDeck(room, deck.x, deck.z, materials, standTargets)],
        [yuji, addFigure(room, 'Pieza: Funko Yuji', yuji.x, yuji.z, materials.red, materials.dark, materials, standTargets)],
        [gon, addFigure(room, 'Pieza: Funko Gon', gon.x, gon.z, materials.green, materials.teal, materials, standTargets)],
        [miku, addPlush(room, miku.x, miku.z, materials, standTargets)]
    ]);

    app.assets.loadFromUrl(`${import.meta.env.BASE_URL}models/psx_tv_stand.glb`, 'container', (error, asset) => {
        if (error || !asset?.resource) {
            console.warn('No se pudo cargar el modelo del stand (psx_tv_stand.glb).', error);
            return;
        }
        const resource = asset.resource as ContainerResource;
        for (const { holder, scale } of standTargets) {
            const stand = resource.instantiateRenderEntity();
            stand.setLocalScale(...scale);
            holder.addChild(stand);
        }
    });

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

    return pedestals;
}

const signZ = -1.76;
// Muro que divide el brazo de entrada de la sala (z = 4, de pared a pared: x 6…12); entre ambos tramos queda un hueco de 1,8 m centrado en x = 9.
const passageWalls = [
    { x: 7, z: 4, halfX: 1, halfZ: 0.08 },
    { x: 11, z: 4, halfX: 1, halfZ: 0.08 }
];

export function isInsideGallery(position: Vec3): boolean {
    const withinOuterBounds = position.x >= -5.58 && position.x <= 11.58 && position.z >= -1.58 && position.z <= 9.35;
    const insideLFootprint = position.z <= 3.55 || position.x >= 6.45;
    return withinOuterBounds && insideLFootprint;
}

const displayKeepOuts = [
    ...pieces.filter((piece) => !piece.onWall).map(({ x, z }) => ({ x, z, halfX: 0.72, halfZ: 0.64 })),
    { x: -3.45, z: -0.72, halfX: 0.9, halfZ: 0.64 },
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
