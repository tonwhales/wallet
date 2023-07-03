import { getColorsFromBytes } from "./getColorsFromBytes";

export function getMostPrevalentColorFromBytes(bytes: Uint8Array): string {
    const colors = getColorsFromBytes(bytes);
    const counts = new Map<string, number>();
    let maxCount = 0;
    let mostPrevalentColor = 'white';
    for (const color of colors) {
      const count = (counts.get(color) ?? 0) + 1;
      counts.set(color, count);
      if (count > maxCount) {
        maxCount = count;
        mostPrevalentColor = color;
      }
    }
    return mostPrevalentColor;
  };