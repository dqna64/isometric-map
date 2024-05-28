let generateKey = ({ x, y }) => `${x},${y}`;
let cells = {};

for (let x = -25; x < 25; x++) {
    for (let y = -25; y < 25; y++) {
        cells[generateKey({ x, y })] = {
            owner: null,
            object: null,
        };
    }
}

console.log(cells);
