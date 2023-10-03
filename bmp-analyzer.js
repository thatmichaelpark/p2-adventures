/*
 * usage: node bmp-analyzer <file.bmp>
 * Prints out some information about the given BMP file.
 */
const fs = require('fs');

function main() {
    const filename = process.argv[2];
    const buffer = fs.readFileSync(filename);
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

    const pal = new Array(256).fill(0);
    for (let i = start; i < start + width * height; ++i) {
        const pixel = bytes[i];
        ++pal[pixel];
    }

    {
        let prevIndex = -1;
        let prevIsUsed = false;
        let result = '';

        for (let i = 0; i <= 256; ++i) {
            const isUsed = i < 256 && !!pal[i];
            if (isUsed !== prevIsUsed) {
                if (isUsed) {
                    if (result.length) {
                        result += ', ';
                    }
                    result += i;
                    prevIndex = i;
                } else {
                    if (i - 1 !== prevIndex) {
                        result += '-' + (i - 1);
                    }
                }
                prevIsUsed = isUsed;
            }
        }
        console.log('used:', result);
    }
    {
        let prevIndex = -1;
        let prevIsUsed = true;
        let result = '';

        for (let i = 0; i <= 256; ++i) {
            const isUsed = i < 256 ? !!pal[i] : true;
            if (isUsed !== prevIsUsed) {
                if (!isUsed) {
                    if (result.length) {
                        result += ', ';
                    }
                    result += i;
                    prevIndex = i;
                } else {
                    if (i - 1 !== prevIndex) {
                        result += '-' + (i - 1);
                    }
                }
                prevIsUsed = isUsed;
            }
        }
        console.log('unused:', result);
    }
}

main();