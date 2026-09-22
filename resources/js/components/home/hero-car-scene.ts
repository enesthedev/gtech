import {
    AdditiveBlending,
    Box3,
    BufferGeometry,
    CanvasTexture,
    Color,
    DirectionalLight,
    DoubleSide,
    Fog,
    Group,
    LoadingManager,
    Matrix4,
    Mesh,
    MeshBasicMaterial,
    MeshStandardMaterial,
    NeutralToneMapping,
    PerspectiveCamera,
    PlaneGeometry,
    PMREMGenerator,
    RepeatWrapping,
    Scene,
    SkinnedMesh,
    SpotLight,
    SRGBColorSpace,
    Vector3,
    WebGLRenderer,
} from 'three';
import type { Material, MeshPhysicalMaterial, Object3D, Texture } from 'three';
import {
    DRACO_GLTF_CONFIG,
    DRACOLoader,
} from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Page tokens: the scene dissolves into the page around it.
const ASPHALT = '#0f0e0d';
const CHALK = '#f2efe9';
const RED = '#de2125';

// Metres.
const LANE = 3.6;
// Wheel track: where launches lay the rubber down.
const TRACK = 1.56;

// Front three-quarter, low: the nose points at the text on wide screens.
const AZIMUTH = 0.62;
const EYE_HEIGHT = 1.1;
const TARGET = new Vector3(0, 0.55, 0);

// The heading's ease-out: the car lands with it.
const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';
// LED white for the lit lamps and the light they throw.
const BEAM = '#eef3ff';

// What the scene needs to know of a glTF (Draco allowed, +Y up).
export type CarModel = {
    src: string;
    // Metres, bumper to bumper: the model is scaled to it.
    length: number;
    // Turns the nose to +X.
    yaw: number;
    // The headlamp emitters, lit: matches a mesh's parent name, as three.js
    // cleans it (no `: . / [ ]`, `_` for spaces), or its material's name.
    lamps: RegExp;
    // The paint's material, and a colour to respray it.
    paint: string;
    color?: string;
    // A door modelled open, closed like its twin.
    door?: { open: string; shut: string };
};

// The cars on the drag strip, at night, one at a time: `go` fades the one on
// the line out and the chosen one in. `first` loads first; the rest follow
// one by one, off screen, and one asked for early loads at once.
// `onLoading` follows the download of the car being waited for, 0–1, and is
// null once it stands on the line or has failed. Reduced motion: a plain cut.
export function mountScene(
    canvas: HTMLCanvasElement,
    models: CarModel[],
    first: number,
    onLoading: (fraction: number | null) => void,
): { go: (index: number, step: number) => void; unmount: () => void } {
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const renderer = new WebGLRenderer({ canvas, antialias: true });
    // Past 1.5 the extra pixels cost more than they show, behind the text.
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    // Neutral keeps the logo red and leaves the asphalt dark as the page.
    renderer.toneMapping = NeutralToneMapping;

    const scene = new Scene();
    const fog = new Fog(ASPHALT, 10, 34);
    scene.background = new Color(ASPHALT);
    scene.fog = fog;
    const pmrem = new PMREMGenerator(renderer);
    const sky = floodlitSky();
    const environment = pmrem.fromScene(sky, 0.04);
    scene.environment = environment.texture;
    // Used once: only the map it made stays.
    pmrem.dispose();
    sky.traverse(dispose);

    // Framed for the longest car, so the frame holds as they change.
    const longest = Math.max(...models.map((model) => model.length));

    const strip = stripTexture(renderer.capabilities.getMaxAnisotropy());
    const ground = new Mesh(
        new PlaneGeometry(40, 80),
        new MeshStandardMaterial({ map: strip, roughness: 0.9 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.z = -10;
    scene.add(ground);

    const startLine = new Mesh(
        new PlaneGeometry(LANE, 0.14),
        new MeshStandardMaterial({ color: CHALK, roughness: 0.8 }),
    );
    startLine.rotation.x = -Math.PI / 2;
    startLine.position.set(0, 0.002, longest / 2 + 0.35);
    scene.add(startLine);

    // No shadow: the contact shadow under each car grounds it.
    const key = new DirectionalLight('#ffffff', 2.4);
    key.position.set(4, 7, 5);
    scene.add(key);

    // The one red light: from behind, it rims the car and pools on the strip.
    const rim = new SpotLight(RED, 90, 20, 0.6, 0.8, 2);
    rim.position.set(-3, 3, -6);
    rim.target.position.copy(TARGET);
    scene.add(rim, rim.target);

    const camera = new PerspectiveCamera(26, 1, 0.1, 100);
    // The strip's shaders and texture, ready while the first car downloads.
    renderer.initTexture(strip);
    void renderer.compileAsync(scene, camera).catch(() => {});

    const frame = () => {
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        if (!width || !height) {
            return;
        }

        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        // Beside the text from lg up, as the page lays it out.
        const wide = matchMedia('(min-width: 64rem)').matches;
        const tanHalf = Math.tan((camera.fov * Math.PI) / 360);
        // Seen three-quarter, the car spans under 1.1 × its length and ~1.3 m
        // in height: two thirds of the frame beside the text, all of it on phones.
        const distance = Math.max(
            (longest * 1.1) / (wide ? 0.68 : 1) / (2 * tanHalf * camera.aspect),
            1.3 / 0.45 / (2 * tanHalf),
        );
        fog.near = distance;
        fog.far = distance + 24;
        // On the start line, front three-quarter.
        camera.position.set(
            Math.sin(AZIMUTH) * distance,
            EYE_HEIGHT,
            Math.cos(AZIMUTH) * distance,
        );
        camera.lookAt(TARGET);

        if (wide) {
            camera.setViewOffset(
                width,
                height,
                -width * 0.22,
                // Lifted clear of the run at the bottom: see HeroCar's loader.
                height * 0.12,
                width,
                height,
            );
        } else {
            camera.clearViewOffset();
        }

        camera.updateProjectionMatrix();
    };

    // Each model loaded once, when first asked for, and kept.
    const loads: Promise<Group | undefined>[] = [];
    const cars: (Group | undefined)[] = [];
    // Each model's download so far, for the loader.
    const got = models.map(() => 0);
    let wanted = first;
    // The car on the line.
    let shown: Group | undefined;
    let disposed = false;

    const render = () => {
        if (shown) {
            renderer.render(scene, camera);
        }
    };

    const resize = new ResizeObserver(() => {
        frame();
        render();
    });
    resize.observe(canvas);

    // Decodes in workers; the glTF-only decoder is the smaller one.
    // Fetched now, alongside the first model rather than after it.
    const draco = new DRACOLoader().setDecoderPath(DRACO_GLTF_CONFIG);
    draco.preload();
    // Aborted on unmount: a page left mid-download stops downloading.
    const manager = new LoadingManager();
    const loader = new GLTFLoader(manager).setDRACOLoader(draco);

    const load = async (index: number) => {
        const { scene: gltf } = await loader.loadAsync(
            models[index].src,
            (event) => {
                if (event.total) {
                    // Whole percents, as the loader shows: React skips repeats.
                    got[index] =
                        Math.floor((event.loaded / event.total) * 100) / 100;

                    if (index === wanted) {
                        onLoading(got[index]);
                    }
                }
            },
        );

        if (disposed) {
            return;
        }

        const car = prepare(models[index], gltf);
        // Shaders compile off the main thread where the GPU allows it while
        // the textures upload, not in the frame that swaps the car in. Its
        // geometry still goes up in that frame: three.js has no call for it.
        const compiled = renderer.compileAsync(car, camera, scene);
        car.traverse((node) => {
            if (node instanceof Mesh) {
                for (const material of [node.material].flat() as Material[]) {
                    texturesOf(material).forEach((texture) =>
                        renderer.initTexture(texture),
                    );
                }
            }
        });
        await compiled.catch(() => {});

        if (disposed) {
            return;
        }

        cars[index] = car;

        return car;
    };

    const ready = (index: number) => (loads[index] ??= load(index));

    // Fades the car on the line out away from `step`'s side, swaps the chosen
    // one in while the canvas is dark and fades it in from that side: one
    // frame drawn a change.
    const show = async (index: number, step: number) => {
        wanted = index;
        const next = ready(index).catch(() => undefined);

        if (shown && !still) {
            // From wherever it stands: a click can land mid-fade.
            await canvas.animate(
                { opacity: 0, translate: `${-8 * step}px 0` },
                { duration: 250, easing: 'ease-in', fill: 'forwards' },
            ).finished;
        }

        if (index !== wanted) {
            return;
        }

        if (!cars[index]) {
            onLoading(got[index]);
        }

        const car = await next;

        if (disposed || index !== wanted) {
            return;
        }

        onLoading(null);

        if (!car) {
            return;
        }

        // The first in place and slower, out of the dark page.
        canvas.animate(
            [
                { opacity: 0, translate: `${shown ? 8 * step : 0}px 0` },
                { opacity: 1, translate: '0 0' },
            ],
            {
                duration: still ? 0 : shown ? 500 : 1000,
                easing: EASE,
                fill: 'forwards',
            },
        );

        if (shown) {
            scene.remove(shown);
        }

        scene.add(car);
        shown = car;
        render();
    };

    void show(first, 1).then(async () => {
        // All of them in the background, one at a time, next in line first.
        for (let step = 0; step < models.length && !disposed; step++) {
            await ready((first + step) % models.length).catch(() => {});
        }

        // Every car in: the decoder's workers go.
        draco.dispose();
    });

    return {
        go: show,
        unmount: () => {
            disposed = true;
            manager.abort();
            resize.disconnect();
            draco.dispose();
            // The shown car twice over: disposing again is harmless.
            [scene, ...cars].forEach((each) => each?.traverse(dispose));
            environment.dispose();
            renderer.dispose();
        },
    };
}

// Readies a loaded model for the strip: standing on the line, over its
// contact shadow and the pool its lamps throw.
function prepare(spec: CarModel, gltf: Group) {
    const open = spec.door && gltf.getObjectByName(spec.door.open);
    const shut = spec.door && gltf.getObjectByName(spec.door.shut);

    if (open && shut) {
        // Hinged like its twin on the other side, it closes flush.
        open.position.copy(shut.position);
        open.quaternion.copy(shut.quaternion);
    }

    gltf.rotation.y = spec.yaw;
    const model = new Group();
    model.add(gltf);
    // One lit copy of each lamp material, so the lamps merge like the rest.
    const lit = new Map<Material, MeshPhysicalMaterial>();

    model.traverse((node) => {
        if (!(node instanceof Mesh)) {
            return;
        }

        const material = node.material as MeshPhysicalMaterial;
        // Transmission renders the scene a second time for the headlight
        // lenses: plain transparency reads the same here.
        material.transmission = 0;

        if (material.name === spec.paint) {
            if (spec.color) {
                material.color.set(spec.color);
            }

            // Thinner and softer than a showroom lacquer.
            material.clearcoat = 0.3;
            material.clearcoatRoughness = 0.25;
        }

        if (
            spec.lamps.test(node.parent?.name ?? '') ||
            spec.lamps.test(material.name)
        ) {
            let copy = lit.get(material);

            if (!copy) {
                copy = material.clone();
                copy.emissive.set(BEAM);
                copy.emissiveIntensity = 3;
                copy.opacity = 1;
                lit.set(material, copy);
            }

            node.material = copy;
        }
    });

    mergeByMaterial(model);

    // Nose towards +Z, down the strip. Sized and placed by the solid body
    // only: glass, decals and a baked shadow plane would reach past the
    // bumpers. Baked and turned a right angle, every box is already tight.
    model.rotation.y = -Math.PI / 2;
    model.updateWorldMatrix(true, true);
    const box = new Box3();
    model.traverse((node) => {
        if (node instanceof Mesh && !(node.material as Material).transparent) {
            box.expandByObject(node);
        }
    });
    const size = box.getSize(new Vector3());
    const scale = spec.length / Math.max(size.x, size.z);
    const centre = box.getCenter(new Vector3()).multiplyScalar(scale);
    model.scale.setScalar(scale);
    // Centred on the lane, wheels on the asphalt.
    model.position.set(-centre.x, -box.min.y * scale, -centre.z);
    const shadow = contactShadow(size.x * scale, size.z * scale);
    shadow.add(lightPool(size.z * scale));
    const car = new Group();
    car.add(model, shadow);

    return car;
}

// The strip, painted once: asphalt grain, the two rubbered grooves of each
// lane and the chalk lane lines. 40 m across, repeating every 10 m.
function stripTexture(anisotropy: number) {
    const width = 2048;
    const height = 512;
    const perMetre = width / 40;
    const x = (metres: number) => width / 2 + metres * perMetre;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const paint = canvas.getContext('2d');

    if (paint) {
        // Aggregate: one pixel in six a speck, lighter or darker than the binder.
        const grain = paint.createImageData(width, height);

        for (let i = 0; i < grain.data.length; i += 4) {
            const speck =
                Math.random() < 0.17
                    ? (Math.random() < 0.5 ? 30 : -6) * Math.random()
                    : 0;
            grain.data[i] = 42 + speck;
            grain.data[i + 1] = 40 + speck;
            grain.data[i + 2] = 38 + speck;
            grain.data[i + 3] = 255;
        }

        paint.putImageData(grain, 0, 0);

        for (const lane of [-1, 0, 1]) {
            for (const side of [-1, 1]) {
                const groove = x(lane * LANE + (side * TRACK) / 2);
                const half = 0.3 * perMetre;
                const rubber = paint.createLinearGradient(
                    groove - half,
                    0,
                    groove + half,
                    0,
                );
                rubber.addColorStop(0, 'rgb(0 0 0 / 0)');
                rubber.addColorStop(0.5, 'rgb(0 0 0 / 0.5)');
                rubber.addColorStop(1, 'rgb(0 0 0 / 0)');
                paint.fillStyle = rubber;
                paint.fillRect(groove - half, 0, half * 2, height);
            }
        }

        paint.fillStyle = 'rgb(242 239 233 / 0.85)';

        for (const line of [-1.5, -0.5, 0.5, 1.5]) {
            paint.fillRect(
                x(line * LANE) - 0.05 * perMetre,
                0,
                0.1 * perMetre,
                height,
            );
        }
    }

    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(1, 8);
    texture.anisotropy = anisotropy;

    return texture;
}

// What the paint and glass mirror: a black sky, floodlight rows down both
// sides of the strip and the rim light's red behind. No ceiling lights, so
// no glare across the roof.
function floodlitSky() {
    const sky = new Scene();
    sky.background = new Color(ASPHALT);
    const panel = new PlaneGeometry();
    const lamp = (
        color: string,
        intensity: number,
        width: number,
        height: number,
    ) => {
        const mesh = new Mesh(
            panel,
            new MeshBasicMaterial({
                color: new Color(color).multiplyScalar(intensity),
                side: DoubleSide,
            }),
        );
        mesh.scale.set(width, height, 1);

        return mesh;
    };

    for (const side of [-1, 1]) {
        const row = lamp(CHALK, 6, 60, 0.8);
        row.rotation.y = Math.PI / 2;
        row.position.set(side * 14, 3, 0);
        sky.add(row);
    }

    // Overcast: enough to shape the roof, too faint to glare on it.
    const overcast = lamp(CHALK, 0.3, 30, 30);
    overcast.rotation.x = Math.PI / 2;
    overcast.position.y = 15;

    const glow = lamp(RED, 4, 10, 2);
    glow.position.set(0, 1.5, -16);
    sky.add(overcast, glow);

    return sky;
}

// Dark under the sills and soft past them: the car's only shadow. Only the
// rectangle's blurred shadow is drawn, so every edge fades; its half-dark
// line is 0.9 × the footprint.
function contactShadow(width: number, length: number) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 256;
    const paint = canvas.getContext('2d');

    if (paint) {
        paint.shadowColor = 'black';
        paint.shadowBlur = 24;
        paint.shadowOffsetX = canvas.width;
        paint.fillRect(28 - canvas.width, 28, 72, 200);
    }

    const shadow = new Mesh(
        new PlaneGeometry(width * 1.6, length * 1.25),
        new MeshBasicMaterial({
            map: new CanvasTexture(canvas),
            transparent: true,
            opacity: 0.75,
            depthWrite: false,
        }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.003;

    return shadow;
}

// The low beams where they reach the asphalt, ahead of a car this long: a
// soft pool, painted rather than lit. Laid in the plane of the car's contact
// shadow, whose −y runs down the strip.
function lightPool(length: number) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const paint = canvas.getContext('2d');

    if (paint) {
        const glow = paint.createRadialGradient(32, 32, 0, 32, 32, 32);
        glow.addColorStop(0, BEAM);
        glow.addColorStop(1, 'transparent');
        paint.fillStyle = glow;
        paint.fillRect(0, 0, 64, 64);
    }

    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    // Brightest three metres past the bumper, gone by six.
    const pool = new Mesh(
        new PlaneGeometry(3.2, 6),
        new MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 0.1,
            blending: AdditiveBlending,
            depthWrite: false,
        }),
    );
    pool.position.y = -(length / 2 + 3);

    return pool;
}

// The model as one mesh a material: tens of draw calls a car rather than
// hundreds. Every part is baked into the model's space; a rigged part where
// its bone holds it.
function mergeByMaterial(model: Group) {
    model.updateWorldMatrix(true, true);
    const groups = new Map<
        string,
        { material: Material; parts: BufferGeometry[] }
    >();
    const place = new Matrix4();
    const uses = new Map<BufferGeometry, number>();
    model.traverse((node) => {
        if (node instanceof Mesh) {
            uses.set(node.geometry, (uses.get(node.geometry) ?? 0) + 1);
        }
    });

    model.traverse((node) => {
        if (!(node instanceof Mesh)) {
            return;
        }

        // Baked in place, as the model lets it go; copied where shared.
        const geometry: BufferGeometry =
            (uses.get(node.geometry) ?? 0) > 1
                ? node.geometry.clone()
                : node.geometry;
        place.copy(node.matrixWorld);

        if (node instanceof SkinnedMesh) {
            // ponytail: a rigid rig at rest, one bone a part, as game cars
            // come; a posed or blended rig needs per-vertex skinning.
            const bone = geometry.attributes.skinIndex.getX(0);
            place
                .multiplyMatrices(
                    node.skeleton.bones[bone].matrixWorld,
                    node.skeleton.boneInverses[bone],
                )
                .multiply(node.bindMatrix);
            geometry.deleteAttribute('skinIndex');
            geometry.deleteAttribute('skinWeight');
        }

        geometry.applyMatrix4(place);
        const material = node.material as Material;
        // Only alike geometry merges: the same attributes, laid out alike.
        const key =
            material.uuid +
            (geometry.index ? 'indexed' : '') +
            Object.entries(geometry.attributes)
                .map(
                    ([name, { itemSize, normalized }]) =>
                        `${name}${itemSize}${normalized}`,
                )
                .sort()
                .join();
        const group = groups.get(key) ?? { material, parts: [] };
        group.parts.push(geometry);
        groups.set(key, group);
    });

    model.clear();

    for (const { material, parts } of groups.values()) {
        const merged = mergeGeometries(parts);

        if (merged) {
            model.add(new Mesh(merged, material));
        }
    }
}

function dispose(node: Object3D) {
    if (!(node instanceof Mesh)) {
        return;
    }

    node.geometry.dispose();

    for (const material of [node.material].flat() as Material[]) {
        texturesOf(material).forEach((texture) => {
            texture.dispose();
            // glTF images decode to bitmaps, which only closing frees.
            (texture.image as Partial<ImageBitmap> | null)?.close?.();
        });
        material.dispose();
    }
}

function texturesOf(material: Material) {
    return Object.values(material).filter(
        (value): value is Texture =>
            (value as Texture | null)?.isTexture === true,
    );
}
