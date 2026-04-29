// camera.js — Third-person orbit camera with smooth follow

function createCamera(renderer) {
    const CAM = {
        DISTANCE:     7.0,
        HEIGHT:       3.5,
        LOOK_OFFSET:  1.2,
        SMOOTH:       5.0,
        MOUSE_SENS:   0.002,
        MIN_PITCH:   -0.2,
        MAX_PITCH:    1.1,
    };

    const camera = new THREE.PerspectiveCamera(
        65, window.innerWidth / window.innerHeight, 0.1, 200
    );

    let yaw = 0;
    let pitch = 0.4;

    // Ideal position storage
    const idealPos = new THREE.Vector3();
    const currentPos = new THREE.Vector3(0, 5, 10);
    const lookTarget = new THREE.Vector3();

    // Reusable vectors
    const _forward = new THREE.Vector3();
    const _right = new THREE.Vector3();
    const _raycaster = new THREE.Raycaster();

    function update(dt, targetPosition) {
        // Mouse orbit
        if (Input.mouse.locked) {
            yaw -= Input.mouse.dx * CAM.MOUSE_SENS;
            pitch += Input.mouse.dy * CAM.MOUSE_SENS;
            pitch = Math.max(CAM.MIN_PITCH, Math.min(CAM.MAX_PITCH, pitch));
        }

        // Calculate ideal camera position (spherical coords around target)
        const offsetX = Math.sin(yaw) * Math.cos(pitch) * CAM.DISTANCE;
        const offsetY = Math.sin(pitch) * CAM.DISTANCE + CAM.HEIGHT;
        const offsetZ = Math.cos(yaw) * Math.cos(pitch) * CAM.DISTANCE;

        idealPos.set(
            targetPosition.x + offsetX,
            targetPosition.y + offsetY,
            targetPosition.z + offsetZ
        );

        // Smooth follow
        const lerpFactor = 1 - Math.exp(-CAM.SMOOTH * dt);
        currentPos.lerp(idealPos, lerpFactor);

        // Don't let camera go below terrain
        const camGroundY = Collision.getGroundHeight(currentPos.x, currentPos.z) + 1.0;
        if (currentPos.y < camGroundY) {
            currentPos.y = camGroundY;
        }

        camera.position.copy(currentPos);

        // Look at character (slightly above center)
        lookTarget.set(
            targetPosition.x,
            targetPosition.y + CAM.LOOK_OFFSET,
            targetPosition.z
        );
        camera.lookAt(lookTarget);
    }

    function getForward() {
        // XZ-plane forward vector based on camera yaw
        _forward.set(-Math.sin(yaw), 0, -Math.cos(yaw)).normalize();
        return _forward;
    }

    function getRight() {
        _right.set(Math.cos(yaw), 0, -Math.sin(yaw)).normalize();
        return _right;
    }

    function resize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    }

    return { camera, update, getForward, getRight, resize };
}
