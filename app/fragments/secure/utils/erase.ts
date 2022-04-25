export function erase(src: Buffer) {
    // Zero
    for (let i = 0; i < src.length; i++) {
        src[i] = 0;
    }
    // Random
    for (let k = 0; k < 3; k++) {
        for (let i = 0; i < src.length; i++) {
            src[i] = Math.floor(Math.random() * 255);
        }
    }
}