export function getColorsFromBytes(bytes: Uint8Array): string[] {
    const colors: string[] = [];
    const pixelCount = bytes.length / 4;
    for (let i = 0; i < pixelCount; i++) {
        const offset = i * 4;
        const r = bytes[offset];
        const g = bytes[offset + 1];
        const b = bytes[offset + 2];
        colors.push(`rgb(${r}, ${g}, ${b})`);
    }
    return colors;
};