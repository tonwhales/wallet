export function compareVersions(a: string, b: string) {
    const partsA = a.split('.').map((v) => parseInt(v));
    const partsB = b.split('.').map((v) => parseInt(v));

    if (partsA.some(isNaN) || partsB.some(isNaN)) {
        throw new Error('Invalid version');
    }

    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
        const partA = partsA[i] || 0;
        const partB = partsB[i] || 0;

        if (partA > partB) {
            return 1;
        }

        if (partA < partB) {
            return -1;
        }
    }

    return 0;
}