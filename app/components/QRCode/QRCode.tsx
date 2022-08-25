import * as React from 'react';
import { View, Image } from 'react-native';
import { createQRMatrix } from './QRMatrix';

export const QRCode = React.memo((props: { data: string, size: number }) => {
    const matrix = createQRMatrix(props.data, 'quartile');
    const dotSize = Math.floor((props.size - 8 * 2) / matrix.size);
    const padding = Math.floor((props.size - dotSize * matrix.size) / 2);
    const items: JSX.Element[] = [];
    for (let x = 0; x < matrix.size; x++) {
        let row: JSX.Element[] = [];
        for (let y = 0; y < matrix.size; y++) {
            let dot = matrix.getNeighbors(x, y);

            // Process if dot is black
            if (dot.current) {
                let borderTopLeftRadius = 0;
                let borderTopRightRadius = 0;
                let borderBottomLeftRadius = 0;
                let borderBottomRightRadius = 0;

                if (!dot.top && !dot.left) {
                    borderTopLeftRadius = dotSize / 2;
                }
                if (!dot.left && !dot.bottom) {
                    borderBottomLeftRadius = dotSize / 2;
                }
                if (!dot.right && !dot.bottom) {
                    borderBottomRightRadius = dotSize / 2;
                }
                if (!dot.right && !dot.top) {
                    borderTopRightRadius = dotSize / 2;
                }

                row.push(<View key={`${x}-${y}`} style={{
                    width: dotSize, height: dotSize, backgroundColor: 'black',
                    borderTopLeftRadius,
                    borderTopRightRadius,
                    borderBottomLeftRadius,
                    borderBottomRightRadius
                }} />);
            } else {
                row.push(<View key={`${x}-${y}`} style={{ width: dotSize, height: dotSize, backgroundColor: 'white', borderRadius: dotSize / 2 }} />);
            }
        }
        items.push(<View key={x} style={{ flexDirection: 'row' }}>{row}</View>);
    }
    return (
        <View style={{ width: props.size, height: props.size, backgroundColor: 'white', padding: padding, flexWrap: 'wrap', borderRadius: 8 }}>
            {items}
        </View>
    );
});