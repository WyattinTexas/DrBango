// scene.js — Guild Wars-inspired forest: warm golden light, lush deciduous trees, painterly feel

function _hash(x, y) {
    let n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return n - Math.floor(n);
}
function _smoothstep(t) { return t * t * (3 - 2 * t); }

function noise2D(x, y) {
    const ix = Math.floor(x), iy = Math.floor(y);
    const fx = _smoothstep(x - ix), fy = _smoothstep(y - iy);
    const a = _hash(ix, iy), b = _hash(ix + 1, iy);
    const c = _hash(ix, iy + 1), d = _hash(ix + 1, iy + 1);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}

function fbm(x, y, octaves) {
    let val = 0, amp = 1, freq = 1, max = 0;
    for (let i = 0; i < octaves; i++) {
        val += noise2D(x * freq, y * freq) * amp;
        max += amp;
        amp *= 0.5;
        freq *= 2;
    }
    return val / max;
}

function createForestScene(scene) {

    // === LIGHTING — warm golden hour ===
    const hemi = new THREE.HemisphereLight(0xc9b88a, 0x5a6b3a, 0.55);
    scene.add(hemi);

    // Main sun — warm gold, angled like late afternoon
    const sun = new THREE.DirectionalLight(0xffe4a8, 1.6);
    sun.position.set(20, 18, 12);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -35;
    sun.shadow.camera.right = 35;
    sun.shadow.camera.top = 35;
    sun.shadow.camera.bottom = -35;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 60;
    sun.shadow.bias = -0.0008;
    scene.add(sun);

    // Cool fill light from opposite side (ambient bounce)
    const fill = new THREE.DirectionalLight(0x8899bb, 0.25);
    fill.position.set(-15, 10, -15);
    scene.add(fill);

    // Warm ambient to lift shadows
    const ambient = new THREE.AmbientLight(0x8b7b5a, 0.3);
    scene.add(ambient);

    // Fog — warm golden haze, GW signature look
    scene.fog = new THREE.FogExp2(0xb8a87a, 0.012);
    scene.background = new THREE.Color(0xa89868);

    // === TERRAIN — golden-green meadow ===
    const SIZE = 70;
    const SEG = 80;
    const terrainGeo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
    terrainGeo.rotateX(-Math.PI / 2);

    const pos = terrainGeo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const distFromCenter = Math.sqrt(x * x + z * z) / (SIZE / 2);

        // Gentle rolling hills, not a bowl
        const hill1 = fbm(x * 0.04 + 3, z * 0.04 + 7, 4) * 3.0;
        const hill2 = fbm(x * 0.08, z * 0.08, 3) * 1.2;
        const edge = distFromCenter * distFromCenter * 2.5;
        let y = hill1 + hill2 + edge - 2.0;

        // Flatten center path area
        const flatR = 6;
        const dist = Math.sqrt(x * x + z * z);
        if (dist < flatR) {
            y *= _smoothstep(dist / flatR);
        }
        pos.setY(i, y);

        // Vertex colors: GW-style golden-green grass, earthy patches
        const grassNoise = fbm(x * 0.12 + 50, z * 0.12 + 50, 3);
        const patchNoise = fbm(x * 0.07, z * 0.07 + 30, 2);

        // Base: warm olive-green
        let r = 0.38 + grassNoise * 0.12;
        let g = 0.45 + grassNoise * 0.15;
        let b = 0.18 + grassNoise * 0.05;

        // Golden patches (like dried grass in sunlight)
        if (patchNoise > 0.55) {
            const t = (patchNoise - 0.55) * 4;
            r += t * 0.2;
            g += t * 0.12;
            b -= t * 0.03;
        }

        // Earthy brown near edges and slopes
        const edgeFade = Math.max(0, distFromCenter - 0.4) * 1.5;
        r += edgeFade * 0.08;
        g -= edgeFade * 0.05;
        b += edgeFade * 0.01;

        // Darken under trees (will be near edges)
        if (distFromCenter > 0.5) {
            const shade = (distFromCenter - 0.5) * 0.4;
            r -= shade * 0.1;
            g -= shade * 0.06;
        }

        colors[i * 3] = Math.max(0, Math.min(1, r));
        colors[i * 3 + 1] = Math.max(0, Math.min(1, g));
        colors[i * 3 + 2] = Math.max(0, Math.min(1, b));
    }

    terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    terrainGeo.computeVertexNormals();

    const terrain = new THREE.Mesh(terrainGeo, new THREE.MeshStandardMaterial({
        vertexColors: true, roughness: 0.88, metalness: 0.0,
    }));
    terrain.receiveShadow = true;
    scene.add(terrain);
    Collision.initHeightmap(terrainGeo);

    // === TREES — big leafy deciduous, GW style ===
    const treesGroup = new THREE.Group();
    scene.add(treesGroup);

    function createTree(x, z, scale, seed) {
        const group = new THREE.Group();
        group.position.set(x, Collision.getGroundHeight(x, z), z);

        // Thick trunk
        const trunkH = (4 + seed * 3) * scale;
        const trunkR = (0.25 + seed * 0.2) * scale;
        const trunkGeo = new THREE.CylinderGeometry(trunkR * 0.6, trunkR * 1.1, trunkH, 7);
        const trunkMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(0.32 + seed * 0.08, 0.22 + seed * 0.05, 0.10),
            roughness: 0.95
        });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = trunkH / 2;
        trunk.castShadow = true;
        group.add(trunk);

        // Branches (2-3 angled cylinders near top)
        for (let b = 0; b < 2 + Math.floor(seed * 2); b++) {
            const bAngle = (b / 3) * Math.PI * 2 + seed * 4;
            const bLen = (1.5 + seed) * scale;
            const bGeo = new THREE.CylinderGeometry(trunkR * 0.2, trunkR * 0.35, bLen, 5);
            const branch = new THREE.Mesh(bGeo, trunkMat);
            branch.position.set(
                Math.cos(bAngle) * trunkR * 1.5,
                trunkH * (0.6 + b * 0.12),
                Math.sin(bAngle) * trunkR * 1.5
            );
            branch.rotation.z = Math.cos(bAngle) * 0.6;
            branch.rotation.x = Math.sin(bAngle) * 0.6;
            branch.castShadow = true;
            group.add(branch);
        }

        // Canopy — big lush spheres (deciduous, not cones)
        const canopyLayers = 2 + Math.floor(seed * 2);
        for (let c = 0; c < canopyLayers; c++) {
            const cR = (2.5 + seed * 2.0) * scale * (1 - c * 0.15);
            // Use icosahedron for organic blobby look
            const cGeo = new THREE.IcosahedronGeometry(cR, 2);

            // Displace vertices for organic shape
            const cPos = cGeo.attributes.position;
            for (let v = 0; v < cPos.count; v++) {
                const vx = cPos.getX(v), vy = cPos.getY(v), vz = cPos.getZ(v);
                const d = 1 + (_hash(vx * 5 + c + seed * 10, vz * 5 + vy) - 0.5) * 0.35;
                cPos.setXYZ(v, vx * d, vy * d * 0.75, vz * d);
            }
            cGeo.computeVertexNormals();

            // Warm green → golden-green → amber hues
            const hue = 0.22 + seed * 0.1 + c * 0.03;
            const sat = 0.45 + seed * 0.15;
            const lit = 0.28 + c * 0.06 + seed * 0.08;
            const cMat = new THREE.MeshStandardMaterial({
                color: new THREE.Color().setHSL(hue, sat, lit),
                roughness: 0.8,
            });
            const canopy = new THREE.Mesh(cGeo, cMat);
            const offsetAngle = c * 2.1 + seed * 5;
            canopy.position.set(
                Math.cos(offsetAngle) * cR * 0.3,
                trunkH + c * cR * 0.4 + cR * 0.2,
                Math.sin(offsetAngle) * cR * 0.3
            );
            canopy.castShadow = true;
            canopy.receiveShadow = true;
            group.add(canopy);
        }

        group.rotation.x = (seed - 0.5) * 0.05;
        group.rotation.z = (_hash(x, z) - 0.5) * 0.05;

        Collision.addTree(x, z, trunkR + 0.4);
        return group;
    }

    // Dense tree ring
    for (let i = 0; i < 28; i++) {
        const angle = (i / 28) * Math.PI * 2 + (_hash(i, 7) - 0.5) * 0.3;
        const radius = 18 + _hash(i, 13) * 10;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const scale = 0.9 + _hash(i, 3) * 0.7;
        treesGroup.add(createTree(x, z, scale, _hash(i, 17)));
    }
    // Mid-distance trees
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + 0.4;
        const radius = 12 + _hash(i + 40, 5) * 5;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const scale = 0.7 + _hash(i + 40, 9) * 0.5;
        treesGroup.add(createTree(x, z, scale, _hash(i + 40, 11)));
    }

    // === ROCKS — mossy boulders ===
    for (let i = 0; i < 10; i++) {
        const angle = _hash(i, 99) * Math.PI * 2;
        const r = 4 + _hash(i, 77) * 18;
        const x = Math.cos(angle) * r;
        const z = Math.sin(angle) * r;
        const size = 0.3 + _hash(i, 55) * 0.8;
        const rockGeo = new THREE.IcosahedronGeometry(size, 1);
        const rPos = rockGeo.attributes.position;
        for (let j = 0; j < rPos.count; j++) {
            const rx = rPos.getX(j), ry = rPos.getY(j), rz = rPos.getZ(j);
            const d = 1 + (_hash(rx * 10 + i, ry * 10) - 0.5) * 0.4;
            rPos.setXYZ(j, rx * d, ry * d * 0.55, rz * d);
        }
        rockGeo.computeVertexNormals();
        const rock = new THREE.Mesh(rockGeo, new THREE.MeshStandardMaterial({
            color: new THREE.Color(0.4 + _hash(i, 44) * 0.1, 0.38, 0.3),
            roughness: 0.95
        }));
        rock.position.set(x, Collision.getGroundHeight(x, z) - 0.05, z);
        rock.rotation.set(_hash(i, 22), _hash(i, 33), _hash(i, 44));
        rock.castShadow = true;
        rock.receiveShadow = true;
        scene.add(rock);
    }

    // === STREAM — clear water with warm reflections ===
    const streamPoints = [];
    const streamSegs = 30;
    for (let i = 0; i <= streamSegs; i++) {
        const t = i / streamSegs;
        const x = -28 + t * 56;
        const z = Math.sin(t * Math.PI * 1.5) * 7 + Math.sin(t * Math.PI * 3) * 2.5;
        streamPoints.push(new THREE.Vector3(x, 0, z));
        Collision.streamPath.push({ x, z, radius: 1.8 });
    }
    const streamCurve = new THREE.CatmullRomCurve3(streamPoints);
    const streamGeo = new THREE.TubeGeometry(streamCurve, 60, 1.3, 8, false);

    const sPos = streamGeo.attributes.position;
    for (let i = 0; i < sPos.count; i++) {
        const sx = sPos.getX(i), sz = sPos.getZ(i);
        sPos.setY(i, Collision.getGroundHeight(sx, sz) - 0.2);
    }
    streamGeo.computeVertexNormals();

    const stream = new THREE.Mesh(streamGeo, new THREE.MeshStandardMaterial({
        color: 0x5599aa,
        transparent: true,
        opacity: 0.45,
        roughness: 0.02,
        metalness: 0.15,
        depthWrite: false,
    }));
    stream.receiveShadow = true;
    scene.add(stream);

    // Stream rocks
    for (let i = 0; i < 14; i++) {
        const t = (i + 0.5) / 14;
        const pt = streamCurve.getPoint(t);
        const off = (_hash(i, 88) - 0.5) * 2.5;
        const rx = pt.x + off;
        const rz = pt.z + off * 0.5;
        const rock = new THREE.Mesh(
            new THREE.IcosahedronGeometry(0.15 + _hash(i, 66) * 0.3, 1),
            new THREE.MeshStandardMaterial({ color: 0x667766, roughness: 0.9 })
        );
        rock.position.set(rx, Collision.getGroundHeight(rx, rz) + 0.05, rz);
        rock.castShadow = true;
        scene.add(rock);
    }

    // === GOD RAYS — warm golden shafts ===
    const rayGroup = new THREE.Group();
    scene.add(rayGroup);

    const rayShader = {
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
            uTime: { value: 0 },
            uColor: { value: new THREE.Color(0xffd88a) },
            uOpacity: { value: 0.06 }
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float uTime;
            uniform vec3 uColor;
            uniform float uOpacity;
            varying vec2 vUv;
            void main() {
                float fade = smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.4, vUv.y);
                float edge = smoothstep(0.0, 0.35, vUv.x) * smoothstep(1.0, 0.65, vUv.x);
                float shimmer = sin(vUv.y * 6.0 + uTime * 0.3) * 0.2 + 0.8;
                float dust = sin(vUv.y * 20.0 + uTime * 1.5) * 0.05 + 0.95;
                float alpha = fade * edge * shimmer * dust * uOpacity;
                gl_FragColor = vec4(uColor, alpha);
            }
        `
    };

    for (let i = 0; i < 7; i++) {
        const angle = (i / 7) * Math.PI * 2 + 0.15;
        const geo = new THREE.PlaneGeometry(2.5 + _hash(i, 50) * 3, 22);
        const mat = new THREE.ShaderMaterial(JSON.parse(JSON.stringify(rayShader)));
        // Re-create uniforms (can't deep clone Color)
        mat.uniforms = {
            uTime: { value: 0 },
            uColor: { value: new THREE.Color(0xffd88a) },
            uOpacity: { value: 0.03 + _hash(i, 60) * 0.05 }
        };
        mat.transparent = true;
        mat.depthWrite = false;
        mat.blending = THREE.AdditiveBlending;
        const ray = new THREE.Mesh(geo, mat);
        ray.position.set(
            Math.cos(angle) * (8 + _hash(i, 70) * 6),
            12,
            Math.sin(angle) * (8 + _hash(i, 80) * 6)
        );
        ray.rotation.y = angle + Math.PI / 2;
        ray.rotation.x = -0.15;
        rayGroup.add(ray);
    }

    // === DUST MOTES — golden pollen floating in light ===
    const dustCount = 300;
    const dustGeo = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);
    const dustSpeeds = new Float32Array(dustCount);
    for (let i = 0; i < dustCount; i++) {
        dustPositions[i * 3]     = (Math.random() - 0.5) * 35;
        dustPositions[i * 3 + 1] = 0.5 + Math.random() * 10;
        dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 35;
        dustSpeeds[i] = 0.15 + Math.random() * 0.4;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));

    const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
        color: 0xffeeaa,
        size: 0.06,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    }));
    scene.add(dust);

    // === GRASS TUFTS — scattered clumps on the ground ===
    const grassMat = new THREE.MeshStandardMaterial({
        color: 0x6b8a3e,
        roughness: 0.85,
        side: THREE.DoubleSide,
    });
    const grassDarkMat = new THREE.MeshStandardMaterial({
        color: 0x4a6b2a,
        roughness: 0.85,
        side: THREE.DoubleSide,
    });
    const grassGoldMat = new THREE.MeshStandardMaterial({
        color: 0x9a8a4a,
        roughness: 0.85,
        side: THREE.DoubleSide,
    });

    for (let i = 0; i < 200; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = 1 + Math.random() * 22;
        const gx = Math.cos(angle) * r;
        const gz = Math.sin(angle) * r;
        const gy = Collision.getGroundHeight(gx, gz);

        // Each tuft is 2-3 crossed planes
        const tuftGroup = new THREE.Group();
        const blades = 2 + Math.floor(Math.random() * 2);
        const h = 0.2 + Math.random() * 0.35;
        const mats = [grassMat, grassDarkMat, grassGoldMat];
        const m = mats[Math.floor(Math.random() * 3)];

        for (let b = 0; b < blades; b++) {
            const bladeGeo = new THREE.PlaneGeometry(0.12 + Math.random() * 0.08, h);
            // Shift vertices up so blade grows from base
            const bPos = bladeGeo.attributes.position;
            for (let v = 0; v < bPos.count; v++) {
                bPos.setY(v, bPos.getY(v) + h / 2);
            }
            const blade = new THREE.Mesh(bladeGeo, m);
            blade.rotation.y = (b / blades) * Math.PI + Math.random() * 0.5;
            blade.rotation.x = (Math.random() - 0.5) * 0.2;
            tuftGroup.add(blade);
        }
        tuftGroup.position.set(gx, gy, gz);
        scene.add(tuftGroup);
    }

    // === WILDFLOWERS ===
    for (let i = 0; i < 30; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = 3 + Math.random() * 14;
        const fx = Math.cos(angle) * r;
        const fz = Math.sin(angle) * r;
        const gy = Collision.getGroundHeight(fx, fz);

        const stemH = 0.2 + Math.random() * 0.15;
        const stem = new THREE.Mesh(
            new THREE.CylinderGeometry(0.01, 0.015, stemH, 3),
            new THREE.MeshStandardMaterial({ color: 0x5a7a3a, roughness: 0.9 })
        );
        stem.position.set(fx, gy + stemH / 2, fz);
        scene.add(stem);

        const petalColor = [0xeedd55, 0xddaa44, 0xcc8855, 0xbbbbee, 0xdddddd][Math.floor(Math.random() * 5)];
        const petal = new THREE.Mesh(
            new THREE.SphereGeometry(0.05 + Math.random() * 0.04, 5, 4),
            new THREE.MeshStandardMaterial({ color: petalColor, roughness: 0.7 })
        );
        petal.position.set(fx, gy + stemH + 0.03, fz);
        scene.add(petal);
    }

    // === UPDATE ===
    function update(dt, elapsed) {
        // Stream flow
        if (streamGeo.attributes.uv) {
            const uv = streamGeo.attributes.uv;
            for (let i = 0; i < uv.count; i++) {
                uv.setX(i, uv.getX(i) + dt * 0.25);
            }
            uv.needsUpdate = true;
        }

        // God ray shimmer
        rayGroup.children.forEach(ray => {
            ray.material.uniforms.uTime.value = elapsed;
        });

        // Dust motes drift
        const dPos = dustGeo.attributes.position;
        for (let i = 0; i < dustCount; i++) {
            let y = dPos.getY(i) + dustSpeeds[i] * dt * 0.25;
            let x = dPos.getX(i) + Math.sin(elapsed * 0.7 + i) * dt * 0.12;
            if (y > 12) y = 0.5;
            dPos.setXYZ(i, x, y, dPos.getZ(i));
        }
        dPos.needsUpdate = true;
    }

    return {
        getGroundHeight: (x, z) => Collision.getGroundHeight(x, z),
        update
    };
}
