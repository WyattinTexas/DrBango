// room-multiplayer.js — Firebase position sync for the 3D room

const RoomMP = {
    db: null,
    playersRef: null,
    uid: null,
    displayName: 'Wanderer',
    players: {},        // uid -> { group, targetPos, targetRot, lastUpdate }
    scene: null,
    enabled: false,
    _lastSend: 0,
    SEND_INTERVAL: 80,  // ms between position broadcasts

    init(scene) {
        this.scene = scene;

        // Only enable if ?mp param is present
        if (!new URLSearchParams(window.location.search).has('mp')) return;
        this.enabled = true;

        // Firebase init
        const firebaseConfig = {
            apiKey: 'AIzaSyDzYoQqXoOu4uj2wzTwSn6d_gAlo6e8WSI',
            authDomain: 'testroom-75200.firebaseapp.com',
            databaseURL: 'https://testroom-75200-default-rtdb.firebaseio.com',
            projectId: 'testroom-75200',
        };

        if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
        this.db = firebase.database();

        // Get name from URL or generate one
        const params = new URLSearchParams(window.location.search);
        this.displayName = params.get('name') || 'Wanderer-' + Math.floor(Math.random() * 999);

        // Generate a random client ID (no auth needed)
        this.uid = 'r_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
        this.playersRef = this.db.ref('mp/room/players');

        // Clean up on disconnect
        this.playersRef.child(this.uid).onDisconnect().remove();

        // Write initial presence
        this.playersRef.child(this.uid).set({
            name: this.displayName,
            x: 0, y: 0, z: 0, rot: 0,
            color: Math.random() * 0xffffff | 0,
            t: firebase.database.ServerValue.TIMESTAMP,
        });

        // Listen for other players
        this.playersRef.on('child_added', (snap) => this._onPlayerJoin(snap));
        this.playersRef.on('child_changed', (snap) => this._onPlayerMove(snap));
        this.playersRef.on('child_removed', (snap) => this._onPlayerLeave(snap));

        // Update player count display
        this._updateCount();

        console.log('[Room MP] Connected as', this.displayName);

        // Clean up on page unload
        window.addEventListener('beforeunload', () => {
            if (this.uid && this.playersRef) {
                this.playersRef.child(this.uid).remove();
            }
        });
    },

    // Send our position to Firebase (throttled)
    sendPosition(pos, rot) {
        if (!this.enabled || !this.uid) return;

        const now = Date.now();
        if (now - this._lastSend < this.SEND_INTERVAL) return;
        this._lastSend = now;

        this.playersRef.child(this.uid).update({
            x: Math.round(pos.x * 100) / 100,
            y: Math.round(pos.y * 100) / 100,
            z: Math.round(pos.z * 100) / 100,
            rot: Math.round(rot * 100) / 100,
            t: firebase.database.ServerValue.TIMESTAMP,
        });
    },

    // Interpolate other players toward their target positions
    update(dt) {
        if (!this.enabled) return;

        for (const uid in this.players) {
            const p = this.players[uid];
            if (!p.group) continue;

            // Lerp position
            p.group.position.lerp(p.targetPos, Math.min(1, 8 * dt));

            // Lerp rotation
            let diff = p.targetRot - p.group.children[0].rotation.y;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            p.group.children[0].rotation.y += diff * Math.min(1, 8 * dt);

            // Snap to ground
            const gy = Collision.getGroundHeight(p.group.position.x, p.group.position.z);
            if (p.group.position.y < gy) p.group.position.y = gy;

            // Simple walk animation
            const dx = p.targetPos.x - p.group.position.x;
            const dz = p.targetPos.z - p.group.position.z;
            const moving = Math.sqrt(dx * dx + dz * dz) > 0.05;
            if (moving) {
                p.walkPhase += dt * 8;
                const swing = Math.sin(p.walkPhase) * 0.3;
                p.leftLeg.position.z = swing;
                p.rightLeg.position.z = -swing;
                p.leftArm.position.z = -swing * 0.6;
                p.rightArm.position.z = swing * 0.6;
            } else {
                p.leftLeg.position.z = 0;
                p.rightLeg.position.z = 0;
                p.leftArm.position.z = 0;
                p.rightArm.position.z = 0;
            }
        }

        // Prune stale players (no update in 10s)
        const now = Date.now();
        for (const uid in this.players) {
            if (now - this.players[uid].lastUpdate > 10000) {
                this._removePlayer(uid);
            }
        }
    },

    _onPlayerJoin(snap) {
        const uid = snap.key;
        if (uid === this.uid) return;
        const data = snap.val();

        // Create other player's character
        const { group, leftLeg, rightLeg, leftArm, rightArm } = this._createOtherPlayer(data.color, data.name);
        group.position.set(data.x, data.y, data.z);
        this.scene.add(group);

        this.players[uid] = {
            group,
            leftLeg, rightLeg, leftArm, rightArm,
            targetPos: new THREE.Vector3(data.x, data.y, data.z),
            targetRot: data.rot || 0,
            lastUpdate: Date.now(),
            walkPhase: 0,
        };

        this._updateCount();
    },

    _onPlayerMove(snap) {
        const uid = snap.key;
        if (uid === this.uid) return;
        const data = snap.val();

        if (!this.players[uid]) {
            this._onPlayerJoin(snap);
            return;
        }

        this.players[uid].targetPos.set(data.x, data.y, data.z);
        this.players[uid].targetRot = data.rot || 0;
        this.players[uid].lastUpdate = Date.now();
    },

    _onPlayerLeave(snap) {
        this._removePlayer(snap.key);
        this._updateCount();
    },

    _removePlayer(uid) {
        if (this.players[uid]) {
            this.scene.remove(this.players[uid].group);
            delete this.players[uid];
        }
    },

    _updateCount() {
        const el = document.getElementById('player-count');
        if (el) {
            const count = Object.keys(this.players).length + 1;
            el.textContent = count + (count === 1 ? ' player' : ' players');
        }
    },

    _createOtherPlayer(colorInt, name) {
        const group = new THREE.Group();
        const body = new THREE.Group();
        group.add(body);

        const color = new THREE.Color(colorInt);
        const mat = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8 });
        const bodyMat = mat(color);

        // Torso
        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.55, 0.3), bodyMat);
        torso.position.y = 0.95;
        torso.castShadow = true;
        body.add(torso);

        // Head
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 6), mat(0xffcc99));
        head.position.y = 1.45;
        head.castShadow = true;
        body.add(head);

        // Hat (matches body color)
        const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.06, 8), bodyMat);
        hatBrim.position.y = 1.55;
        body.add(hatBrim);
        const hatTop = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 0.18, 8), bodyMat);
        hatTop.position.y = 1.65;
        body.add(hatTop);

        // Eyes
        const eyeGeo = new THREE.SphereGeometry(0.04, 4, 4);
        const eyeMat = mat(0x222222);
        body.add(Object.assign(new THREE.Mesh(eyeGeo, eyeMat), {})).position.set(-0.08, 1.48, 0.22);
        body.add(Object.assign(new THREE.Mesh(eyeGeo, eyeMat), {})).position.set(0.08, 1.48, 0.22);

        // Arms
        const armGeo = new THREE.BoxGeometry(0.14, 0.45, 0.14);
        const leftArm = new THREE.Mesh(armGeo, bodyMat);
        leftArm.position.set(-0.37, 0.95, 0);
        body.add(leftArm);
        const rightArm = new THREE.Mesh(armGeo, bodyMat);
        rightArm.position.set(0.37, 0.95, 0);
        body.add(rightArm);

        // Legs
        const legGeo = new THREE.BoxGeometry(0.16, 0.4, 0.16);
        const legMat = mat(0x3355aa);
        const leftLeg = new THREE.Mesh(legGeo, legMat);
        leftLeg.position.set(-0.12, 0.45, 0);
        body.add(leftLeg);
        const rightLeg = new THREE.Mesh(legGeo, legMat);
        rightLeg.position.set(0.12, 0.45, 0);
        body.add(rightLeg);

        // Shoes
        body.add(new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 0.24), mat(0x664422))).position.set(-0.12, 0.22, 0.03);
        body.add(new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 0.24), mat(0x664422))).position.set(0.12, 0.22, 0.03);

        // Name label above head
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 48;
        const ctx = canvas.getContext('2d');
        ctx.font = 'bold 24px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeText(name || 'Player', 128, 32);
        ctx.fillText(name || 'Player', 128, 32);

        const labelTex = new THREE.CanvasTexture(canvas);
        const label = new THREE.Mesh(
            new THREE.PlaneGeometry(1.5, 0.28),
            new THREE.MeshBasicMaterial({ map: labelTex, transparent: true, depthWrite: false, side: THREE.DoubleSide })
        );
        label.position.y = 2.1;
        // Billboard: always face camera (handled in update would be better, but this is simple)
        label.onBeforeRender = function(renderer, scene, camera) {
            label.quaternion.copy(camera.quaternion);
        };
        group.add(label);

        // Shadow
        const shadowGeo = new THREE.CircleGeometry(0.35, 8);
        shadowGeo.rotateX(-Math.PI / 2);
        group.add(new THREE.Mesh(shadowGeo, new THREE.MeshBasicMaterial({
            color: 0x000000, transparent: true, opacity: 0.2, depthWrite: false,
        }))).position.y = 0.02;

        return { group, leftLeg, rightLeg, leftArm, rightArm };
    },
};
