/*
 * usage: node bmp-converter <file.bmp> <palette> <output.bmp>
 * Converts 8-bpp BMP file to use specified palette, writes output BMP
 * (still 8-bpp).
 */
const fs = require('fs');

function main() {
    const inFilename = process.argv[2];
    const paletteFilename = process.argv[3];
    const outFilename = process.argv[4];
    const buffer = fs.readFileSync(inFilename);
    const bytes = Uint8Array.from(Buffer.from(buffer));
    const filesize = (((((bytes[5] << 8) + bytes[4]) << 8) + bytes[3]) << 8) + bytes[2];
    const start = (((((bytes[13] << 8) + bytes[12]) << 8) + bytes[11]) << 8) + bytes[10];
    const headersize = (((((bytes[14 + 3] << 8) + bytes[14 + 2]) << 8) + bytes[14 + 1]) << 8) + bytes[14 + 0];
    const width = (((((bytes[18 + 3] << 8) + bytes[18 + 2]) << 8) + bytes[18 + 1]) << 8) + bytes[18 + 0];
    const height = (((((bytes[22 + 3] << 8) + bytes[22 + 2]) << 8) + bytes[22 + 1]) << 8) + bytes[22 + 0];
    const bpp = ((bytes[28 + 1]) << 8) + bytes[28 + 0];
    const compression = (((((bytes[30 + 3] << 8) + bytes[30 + 2]) << 8) + bytes[30 + 1]) << 8) + bytes[30 + 0];
    const ncolors = (((((bytes[46 + 3] << 8) + bytes[46 + 2]) << 8) + bytes[46 + 1]) << 8) + bytes[46 + 0];
    const nimportantcolors = (((((bytes[50 + 3] << 8) + bytes[50 + 2]) << 8) + bytes[50 + 1]) << 8) + bytes[50 + 0];

    console.log('filesize', filesize);
    console.log('start', start);
    console.log('headersize', headersize);
    console.log('width', width);
    console.log('height', height);
    console.log('bpp', bpp);
    console.log('compression', compression);
    console.log('ncolors', ncolors);
    console.log('nimportantcolors', nimportantcolors);

    if (bpp !== 8 || compression !== 0) {
        console.log('Not an uncompressed 8bpp BMP; exiting.');
        return;
    }

    const paletteStart = 54;
    if (paletteStart + 1024 !== start) {
        console.log('palette or pixels not where expected; exiting.');
        return;
    }

    const palBuffer = fs.readFileSync(paletteFilename);
    const hexs = (JSON.parse(palBuffer));
    const rgbs = [];
    hexs.forEach(hex => {
        const r = Number.parseInt(hex.slice(0, 2), 16);
        const g = Number.parseInt(hex.slice(2, 4), 16);
        const b = Number.parseInt(hex.slice(4, 6), 16);
        rgbs.push({ r, g, b });
    });

    const paletteMap = [];
    for (let i = 0; i < 256; ++i) {
        const p = paletteStart + i * 4;
        const b = bytes[p + 0];
        const g = bytes[p + 1];
        const r = bytes[p + 2];
        const closestIndex = findClosest(r, g, b, rgbs);
        paletteMap.push(closestIndex);
    }

    for (let i = start; i < start + width * height; ++i) {
        bytes[i] = paletteMap[bytes[i]];
    }

    rgbs.forEach((rgb, i) => {
        bytes[paletteStart + i * 4 + 0] = rgb.b;
        bytes[paletteStart + i * 4 + 1] = rgb.g;
        bytes[paletteStart + i * 4 + 2] = rgb.r;
    })

    fs.appendFileSync(outFilename, Buffer.from(bytes));
}

function findClosest(r, g, b, rgbs) {
    let closestDistance = Infinity;
    let closestIndex;
    rgbs.forEach((rgb, i) => {
        const distance = Math.abs(rgb.r - r) + Math.abs(rgb.g - g) + Math.abs(rgb.b - b);
        if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = i;
        }
    });
    return closestIndex;
}
main();