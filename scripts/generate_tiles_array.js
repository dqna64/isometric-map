const tiles = [];

const MINX = -20;
const MAXX = 19;
const MINY = -20;
const MAXY = 19;

for (let i = MINX; i <= MAXX; i++) {
    for (let j = MINY; j <= MAXY; j++) {
        tiles.push([i, j]);
    }
}

console.log(tiles);
