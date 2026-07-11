export const RawParser = {
    // Magic numbers for common RAW formats
    MAGIC_NUMBERS: {
        'cr2': [0x49, 0x49, 0x2A, 0x00, 0x10, 0x00, 0x00, 0x00],
        'tiff': [0x49, 0x49, 0x2A, 0x00], // II* (Little Endian TIFF / NEF / ARW)
        'tiff_be': [0x4D, 0x4D, 0x00, 0x2A] // MM* (Big Endian TIFF)
    },

    async isRAW(file) {
        const buffer = await file.slice(0, 8).arrayBuffer();
        const arr = new Uint8Array(buffer);
        
        const isCr2 = this.MAGIC_NUMBERS.cr2.every((byte, i) => arr[i] === byte);
        const isTiffLE = this.MAGIC_NUMBERS.tiff.every((byte, i) => arr[i] === byte);
        const isTiffBE = this.MAGIC_NUMBERS.tiff_be.every((byte, i) => arr[i] === byte);

        return isCr2 || isTiffLE || isTiffBE;
    }
};