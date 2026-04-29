// main.js — Init, game loop, wire everything together

(function() {
    const canvas = document.getElementById('viewport');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;

    const scene = new THREE.Scene();
    const clock = new THREE.Clock();

    Input.init(canvas);

    const world = createForestScene(scene);
    const portals = createPortals(scene);
    const char = createCharacter();
    scene.add(char.group);
    char.group.position.set(0, Collision.getGroundHeight(0, 0), 0);

    const phys = createPhysicsController(char.group);
    const cam = createCamera(renderer);

    // Multiplayer (only activates if ?mp is in URL)
    RoomMP.init(scene);
    if (RoomMP.enabled) {
        document.getElementById('player-count').style.display = 'block';
    }

    // Hide loading overlay
    const overlay = document.getElementById('loading');
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 800);
    }

    let elapsed = 0;

    function tick() {
        requestAnimationFrame(tick);
        const dt = Math.min(clock.getDelta(), 0.05);
        elapsed += dt;

        phys.update(dt, cam.getForward(), cam.getRight());

        const groundY = Collision.getGroundHeight(char.group.position.x, char.group.position.z);
        char.update(phys.velocity, phys.grounded, dt, groundY);
        cam.update(dt, char.group.position);
        world.update(dt, elapsed);
        portals.update(elapsed);

        // Multiplayer sync
        RoomMP.sendPosition(char.group.position, char.group.children[0].rotation.y);
        RoomMP.update(dt);

        // Check portal entry
        const url = portals.checkEntry(char.group.position.x, char.group.position.z);
        if (url) window.location.href = url;

        renderer.render(scene, cam.camera);
        Input.update();
    }
    tick();

    window.addEventListener('resize', () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        cam.resize();
    });
})();
