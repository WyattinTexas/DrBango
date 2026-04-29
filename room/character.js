// character.js — Simple blocky character

function createCharacter() {
    const group = new THREE.Group();
    const body = new THREE.Group();
    group.add(body);

    const mat = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.8 });

    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.55, 0.3), mat(0xdd3333));
    torso.position.y = 0.95;
    torso.castShadow = true;
    body.add(torso);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 6), mat(0xffcc99));
    head.position.y = 1.45;
    head.castShadow = true;
    body.add(head);

    // Hat
    const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.06, 8), mat(0x3355bb));
    hatBrim.position.y = 1.55;
    body.add(hatBrim);
    const hatTop = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 0.18, 8), mat(0x3355bb));
    hatTop.position.y = 1.65;
    hatTop.castShadow = true;
    body.add(hatTop);

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.04, 4, 4);
    const eyeMat = mat(0x222222);
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.08, 1.48, 0.22);
    body.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.08, 1.48, 0.22);
    body.add(rightEye);

    // Arms
    const armGeo = new THREE.BoxGeometry(0.14, 0.45, 0.14);
    const leftArm = new THREE.Mesh(armGeo, mat(0xdd3333));
    leftArm.position.set(-0.37, 0.95, 0);
    leftArm.castShadow = true;
    body.add(leftArm);
    const rightArm = new THREE.Mesh(armGeo, mat(0xdd3333));
    rightArm.position.set(0.37, 0.95, 0);
    rightArm.castShadow = true;
    body.add(rightArm);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.16, 0.4, 0.16);
    const leftLeg = new THREE.Mesh(legGeo, mat(0x3355aa));
    leftLeg.position.set(-0.12, 0.45, 0);
    leftLeg.castShadow = true;
    body.add(leftLeg);
    const rightLeg = new THREE.Mesh(legGeo, mat(0x3355aa));
    rightLeg.position.set(0.12, 0.45, 0);
    rightLeg.castShadow = true;
    body.add(rightLeg);

    // Shoes
    const leftShoe = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 0.24), mat(0x664422));
    leftShoe.position.set(-0.12, 0.22, 0.03);
    body.add(leftShoe);
    const rightShoe = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 0.24), mat(0x664422));
    rightShoe.position.set(0.12, 0.22, 0.03);
    body.add(rightShoe);

    // Ground shadow
    const shadowGeo = new THREE.CircleGeometry(0.35, 8);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadow = new THREE.Mesh(shadowGeo, new THREE.MeshBasicMaterial({
        color: 0x000000, transparent: true, opacity: 0.25, depthWrite: false,
    }));
    shadow.position.y = 0.02;
    group.add(shadow);

    let walkPhase = 0;
    let facingAngle = 0;

    function update(velocity, grounded, dt, groundY) {
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);

        // Face movement direction
        if (speed > 0.3) {
            const target = Math.atan2(velocity.x, velocity.z);
            let diff = target - facingAngle;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            facingAngle += diff * Math.min(1, 12 * dt);
        }
        body.rotation.y = facingAngle;

        if (grounded && speed > 0.3) {
            // Simple walk: legs swing back and forth
            walkPhase += dt * 8;
            const swing = Math.sin(walkPhase) * 0.3;
            leftLeg.position.z = swing;
            rightLeg.position.z = -swing;
            leftShoe.position.z = 0.03 + swing;
            rightShoe.position.z = 0.03 - swing;
            leftArm.position.z = -swing * 0.6;
            rightArm.position.z = swing * 0.6;
        } else {
            // Reset limbs
            leftLeg.position.z = 0;
            rightLeg.position.z = 0;
            leftShoe.position.z = 0.03;
            rightShoe.position.z = 0.03;
            leftArm.position.z = 0;
            rightArm.position.z = 0;
        }

        // Shadow on ground
        if (groundY !== undefined) {
            shadow.position.y = groundY - group.position.y + 0.02;
            const h = group.position.y - groundY;
            shadow.material.opacity = Math.max(0, 0.25 - h * 0.02);
        }
    }

    return { group, update };
}
