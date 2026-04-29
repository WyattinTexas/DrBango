// physics.js — Simple movement: walk and jump

function createPhysicsController(characterGroup) {
    const SPEED = 7;
    const JUMP_VEL = 12;
    const GRAVITY = -30;
    const CHAR_RADIUS = 0.35;

    const velocity = new THREE.Vector3();
    let grounded = false;

    function update(dt, camForward, camRight) {
        const dir = Input.getDirection();

        // Move in camera direction
        const moveX = dir.x * camRight.x + dir.z * camForward.x;
        const moveZ = dir.x * camRight.z + dir.z * camForward.z;
        const len = Math.sqrt(moveX * moveX + moveZ * moveZ);

        if (len > 0.01) {
            velocity.x = (moveX / len) * SPEED;
            velocity.z = (moveZ / len) * SPEED;
        } else {
            velocity.x = 0;
            velocity.z = 0;
        }

        // Jump
        if (grounded && Input.justJumped()) {
            velocity.y = JUMP_VEL;
            grounded = false;
        }

        // Gravity
        if (!grounded) {
            velocity.y += GRAVITY * dt;
        }

        // Move
        characterGroup.position.x += velocity.x * dt;
        characterGroup.position.y += velocity.y * dt;
        characterGroup.position.z += velocity.z * dt;

        // Ground
        const groundY = Collision.getGroundHeight(characterGroup.position.x, characterGroup.position.z);
        if (characterGroup.position.y <= groundY) {
            characterGroup.position.y = groundY;
            velocity.y = 0;
            grounded = true;
        } else if (grounded && velocity.y <= 0) {
            grounded = false;
        }

        // Collisions
        Collision.resolveTreeCollision(characterGroup.position, CHAR_RADIUS);
        Collision.resolveWorldBounds(characterGroup.position);
    }

    return {
        update,
        get velocity() { return velocity; },
        get grounded() { return grounded; },
    };
}
