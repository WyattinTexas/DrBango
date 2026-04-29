// collision.js — Ground heightmap, tree collision, world bounds

const Collision = {
    heightData: null,
    gridSize: 81,       // 80 segments = 81 vertices per side
    worldSize: 70,
    trees: [],          // { x, z, radius }
    streamPath: [],     // { x, z, radius } capsules

    initHeightmap(geometry) {
        const pos = geometry.attributes.position;
        this.heightData = new Float32Array(pos.count);
        for (let i = 0; i < pos.count; i++) {
            this.heightData[i] = pos.getY(i);
        }
    },

    getGroundHeight(wx, wz) {
        const half = this.worldSize / 2;
        // Convert world coords to grid coords
        const gx = ((wx + half) / this.worldSize) * (this.gridSize - 1);
        const gz = ((wz + half) / this.worldSize) * (this.gridSize - 1);

        const ix = Math.floor(gx);
        const iz = Math.floor(gz);
        const fx = gx - ix;
        const fz = gz - iz;

        const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
        const ix0 = clamp(ix, 0, this.gridSize - 2);
        const iz0 = clamp(iz, 0, this.gridSize - 2);

        const idx = (r, c) => r * this.gridSize + c;
        const h00 = this.heightData[idx(iz0, ix0)];
        const h10 = this.heightData[idx(iz0, ix0 + 1)];
        const h01 = this.heightData[idx(iz0 + 1, ix0)];
        const h11 = this.heightData[idx(iz0 + 1, ix0 + 1)];

        // Bilinear interpolation
        const h0 = h00 + (h10 - h00) * fx;
        const h1 = h01 + (h11 - h01) * fx;
        return h0 + (h1 - h0) * fz;
    },

    addTree(x, z, radius) {
        this.trees.push({ x, z, radius });
    },

    resolveTreeCollision(pos, charRadius) {
        for (const tree of this.trees) {
            const dx = pos.x - tree.x;
            const dz = pos.z - tree.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            const minDist = tree.radius + charRadius;
            if (dist < minDist && dist > 0.001) {
                const push = (minDist - dist);
                pos.x += (dx / dist) * push;
                pos.z += (dz / dist) * push;
            }
        }
    },

    isInStream(x, z) {
        for (const seg of this.streamPath) {
            const dx = x - seg.x;
            const dz = z - seg.z;
            if (dx * dx + dz * dz < seg.radius * seg.radius) return true;
        }
        return false;
    },

    resolveWorldBounds(pos, softRadius) {
        const half = this.worldSize / 2 - 2;
        const dx = pos.x;
        const dz = pos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > half) {
            const push = (dist - half) * 0.3;
            pos.x -= (dx / dist) * push;
            pos.z -= (dz / dist) * push;
        }
    }
};
