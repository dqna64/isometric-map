const cells = [];

for (let x = -40; x < 40; x++) {
    for (let y = -40; y < 40; y++) {
        cells.push({
            coordinates: {
                x,
                y,
            },
            owner: null,
            object: null,
        });
    }
}

console.dir(cells, { depth: null });
