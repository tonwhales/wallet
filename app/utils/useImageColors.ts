import { useEffect, useState } from 'react'
import { ImageColorsResult, getColors } from 'react-native-image-colors'

export function useImageColors(url: string | undefined, fallback?: string) {
    const [colors, setColors] = useState<ImageColorsResult | null>(null);

    useEffect(() => {
        if (!url) return;
        (async () => {
            const colorsRes = await getColors(url, {
                fallback: fallback || '#FFF',
                cache: true,
                key: url,
            });

            setColors(colorsRes);
        })();
    }, [url, fallback]);

    return colors;
}