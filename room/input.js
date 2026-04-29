// input.js — Keyboard state + pointer lock mouse

const Input = {
    keys: {},
    mouse: { dx: 0, dy: 0, locked: false },
    _justPressed: {},

    init(canvas) {
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') e.preventDefault();
            if (!this.keys[e.code]) this._justPressed[e.code] = true;
            this.keys[e.code] = true;
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        canvas.addEventListener('click', () => {
            if (!this.mouse.locked) canvas.requestPointerLock();
        });
        document.addEventListener('pointerlockchange', () => {
            this.mouse.locked = document.pointerLockElement === canvas;
        });
        document.addEventListener('mousemove', (e) => {
            if (this.mouse.locked) {
                this.mouse.dx += e.movementX;
                this.mouse.dy += e.movementY;
            }
        });
    },

    update() {
        this.mouse.dx = 0;
        this.mouse.dy = 0;
        this._justPressed = {};
    },

    isForward()  { return this.keys['KeyW'] || this.keys['ArrowUp']; },
    isBack()     { return this.keys['KeyS'] || this.keys['ArrowDown']; },
    isLeft()     { return this.keys['KeyA'] || this.keys['ArrowLeft']; },
    isRight()    { return this.keys['KeyD'] || this.keys['ArrowRight']; },
    isJump()     { return this.keys['Space']; },
    justJumped() { return this._justPressed['Space']; },

    getDirection() {
        let x = 0, z = 0;
        if (this.isForward()) z -= 1;
        if (this.isBack())    z += 1;
        if (this.isLeft())    x -= 1;
        if (this.isRight())   x += 1;
        const len = Math.sqrt(x * x + z * z);
        if (len > 0) { x /= len; z /= len; }
        return { x, z };
    }
};
