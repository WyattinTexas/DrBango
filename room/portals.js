// portals.js — Glowing portal doors to DrBango sites

const PORTAL_DESTINATIONS = [
    { label: 'TESTROOM',    url: 'https://drbango.com/testroom/' },
    { label: 'ADVENTURE',   url: 'https://drbango.com/adventure/' },
    { label: 'TIER LIST',   url: 'https://drbango.com/tierlist/' },
    { label: 'BOARD GAME',  url: 'https://drbango.com/boardgame/' },
    { label: 'BOO BATTLES', url: 'https://drbango.com/boobattles/' },
    { label: 'SPIRIT WAR',  url: 'https://drbango.com/spiritwar/' },
    { label: 'CARD DASH',   url: 'https://drbango.com/carddashboard/' },
    { label: 'PICKLE',      url: 'https://drbango.com/pickle/' },
];

function createPortals(scene) {
    const portals = [];
    const count = PORTAL_DESTINATIONS.length;
    const radius = 14; // distance from center

    for (let i = 0; i < count; i++) {
        const dest = PORTAL_DESTINATIONS[i];
        const angle = (i / count) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const groundY = Collision.getGroundHeight(x, z);

        const group = new THREE.Group();
        group.position.set(x, groundY, z);
        group.rotation.y = -angle + Math.PI; // face center

        // Portal ring (torus)
        const ringGeo = new THREE.TorusGeometry(1.2, 0.12, 8, 24);
        const hue = i / count;
        const ringColor = new THREE.Color().setHSL(hue, 0.8, 0.5);
        const ringMat = new THREE.MeshStandardMaterial({
            color: ringColor,
            emissive: ringColor,
            emissiveIntensity: 0.6,
            roughness: 0.3,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.y = 1.5;
        ring.castShadow = true;
        group.add(ring);

        // Inner glow (flat disc inside the ring)
        const discGeo = new THREE.CircleGeometry(1.1, 16);
        const discMat = new THREE.MeshBasicMaterial({
            color: ringColor,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide,
            depthWrite: false,
        });
        const disc = new THREE.Mesh(discGeo, discMat);
        disc.position.y = 1.5;
        group.add(disc);

        // Point light for glow effect
        const light = new THREE.PointLight(ringColor, 0.5, 5);
        light.position.y = 1.5;
        group.add(light);

        // Text label using canvas texture
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 256, 64);
        ctx.font = 'bold 28px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = `hsl(${hue * 360}, 80%, 70%)`;
        ctx.fillText(dest.label, 128, 42);

        const labelTex = new THREE.CanvasTexture(canvas);
        const labelGeo = new THREE.PlaneGeometry(2, 0.5);
        const labelMat = new THREE.MeshBasicMaterial({
            map: labelTex,
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
        });
        const label = new THREE.Mesh(labelGeo, labelMat);
        label.position.y = 3.0;
        group.add(label);

        // Small base platform
        const baseGeo = new THREE.CylinderGeometry(1.4, 1.5, 0.15, 12);
        const baseMat = new THREE.MeshStandardMaterial({
            color: 0x444444,
            roughness: 0.9,
        });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0.07;
        base.receiveShadow = true;
        group.add(base);

        scene.add(group);

        portals.push({
            x, z,
            radius: 1.3,
            url: dest.url,
            ring, disc, light,
            group,
        });
    }

    // Animate portals
    function update(elapsed) {
        for (let i = 0; i < portals.length; i++) {
            const p = portals[i];
            // Slow rotation
            p.ring.rotation.z = elapsed * 0.5 + i;
            // Pulse glow
            const pulse = 0.15 + Math.sin(elapsed * 2 + i * 0.8) * 0.08;
            p.disc.material.opacity = pulse;
            p.light.intensity = 0.4 + Math.sin(elapsed * 2 + i * 0.8) * 0.2;
        }
    }

    // Check if character is inside any portal
    function checkEntry(charX, charZ) {
        for (const p of portals) {
            const dx = charX - p.x;
            const dz = charZ - p.z;
            if (dx * dx + dz * dz < p.radius * p.radius) {
                return p.url;
            }
        }
        return null;
    }

    return { update, checkEntry, portals };
}
