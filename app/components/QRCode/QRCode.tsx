import { Canvas, RoundedRect, DiffRect, rrect, rect, Path } from '@shopify/react-native-skia';
import * as React from 'react';
import { View } from 'react-native';
import { createQRMatrix } from './QRMatrix';
import TonIcon from '../../../assets/ic-ton-qr.svg';
import { ImagePreview } from '../../engine/api/fetchAppData';
import { WImage } from '../WImage';

function addCornerFinderPatterns(items: JSX.Element[], dotSize: number, matrixSize: number, color?: string) {
    // Top left
    const topLeftOuter0 = rrect(rect(0, 0, dotSize * 7, dotSize * 7), 10, 10);
    const topLeftInner0 = rrect(rect(dotSize, dotSize, dotSize * 5, dotSize * 5), 5, 5);
    items.push(<DiffRect key={'dr-top-left'} inner={topLeftInner0} outer={topLeftOuter0} color={color ?? "black"} />)
    items.push(<RoundedRect key={'rr-top-left'} x={dotSize * 2} y={dotSize * 2} width={dotSize * 3} height={dotSize * 3} r={5} color={color ?? "black"} />)

    // Top right
    const outer2 = rrect(rect((matrixSize - 7) * dotSize, 0, dotSize * 7, dotSize * 7), 10, 10);
    const inner2 = rrect(rect((matrixSize - 6) * dotSize, dotSize, dotSize * 5, dotSize * 5), 5, 5);
    items.push(<DiffRect key={'dr-top-right'} inner={inner2} outer={outer2} color={color ?? "black"} />);
    items.push(<RoundedRect key={'rr-top-right'} x={(matrixSize - 5) * dotSize} y={dotSize * 2} width={dotSize * 3} height={dotSize * 3} r={5} color={color ?? "black"} />)

    // Bottom left
    const outer3 = rrect(rect(0, (matrixSize - 7) * dotSize, dotSize * 7, dotSize * 7), 10, 10);
    const inner3 = rrect(rect(dotSize, (matrixSize - 6) * dotSize, dotSize * 5, dotSize * 5), 5, 5);
    items.push(<DiffRect key={'dr-bottom-left'} inner={inner3} outer={outer3} color={color ?? "black"} />);
    items.push(<RoundedRect key={'rr-bottom-left'} x={dotSize * 2} y={(matrixSize - 5) * dotSize} width={dotSize * 3} height={dotSize * 3} r={5} color={color ?? "black"} />)
}

function isCornerSquare(point: { x: number, y: number }, matrixSize: number): boolean {
    const { x, y } = point;

    const finderPatternTopLeft = { x: 0, y: 0 };
    const finderPatternTopRight = { x: matrixSize - 7, y: 0 };
    const finderPatternBottomLeft = { x: 0, y: matrixSize - 7 };

    const isTopLeft = x >= finderPatternTopLeft.x && x <= (finderPatternTopLeft.x + 7)
        && y >= finderPatternTopLeft.y && y <= (finderPatternTopLeft.y + 7);

    const isTopRight = x >= finderPatternTopRight.x && x <= (finderPatternTopRight.x + 7)
        && y >= finderPatternTopRight.y && y <= (finderPatternTopRight.y + 7);

    const isBottomLeft = x >= finderPatternBottomLeft.x && x <= (finderPatternBottomLeft.x + 7)
        && y >= finderPatternBottomLeft.y && y <= (finderPatternBottomLeft.y + 7);

    return isTopLeft || isTopRight || isBottomLeft;
};

function isPointInCircle(x: number, y: number, cx: number, cy: number, r: number) {
    return Math.sqrt(Math.pow(x - cx, 2) + Math.pow(y - cy, 2)) <= r;
}

function getRectPath(x: number, y: number, w: number, h: number, tlr: number, trr: number, brr: number, blr: number) {
    return 'M ' + x + ' ' + (y + tlr)
        + ' A ' + tlr + ' ' + tlr + ' 0 0 1 ' + (x + tlr) + ' ' + y
        + ' L ' + (x + w - trr) + ' ' + y
        + ' A ' + trr + ' ' + trr + ' 0 0 1 ' + (x + w) + ' ' + (y + trr)
        + ' L ' + (x + w) + ' ' + (y + h - brr)
        + ' A ' + brr + ' ' + brr + ' 0 0 1 ' + (x + w - brr) + ' ' + (y + h)
        + ' L ' + (x + blr) + ' ' + (y + h)
        + ' A ' + blr + ' ' + blr + ' 0 0 1 ' + x + ' ' + (y + h - blr)
        + ' Z';
};

export const QRCode = React.memo((props: {
    data: string,
    size: number,
    color?: string,
    icon?: ImagePreview | null
}) => {
    const matrix = createQRMatrix(props.data, 'quartile');
    const dotSize = Math.floor((props.size) / matrix.size);
    const padding = Math.floor((props.size - dotSize * matrix.size) / 2);

    const items: JSX.Element[] = [];
    for (let x = 0; x < matrix.size; x++) {
        for (let y = 0; y < matrix.size; y++) {
            let dot = matrix.getNeighbors(x, y);

            // Process if dot is colored
            if (dot.current) {
                let borderTopLeftRadius = 0;
                let borderTopRightRadius = 0;
                let borderBottomLeftRadius = 0;
                let borderBottomRightRadius = 0;

                if (!dot.top && !dot.left) {
                    borderTopLeftRadius = dotSize / 2;
                }
                if (!dot.top && !dot.right) {
                    borderBottomLeftRadius = dotSize / 2;
                }
                if (!dot.bottom && !dot.left) {
                    borderTopRightRadius = dotSize / 2;
                }
                if (!dot.right && !dot.bottom) {
                    borderBottomRightRadius = dotSize / 2;
                }

                const matrixCenter = Math.floor(matrix.size / 2);
                const circleRadius = Math.floor(30 / (dotSize));

                if (isPointInCircle(x, y, matrixCenter, matrixCenter, circleRadius)) {
                    continue;
                }

                if (isCornerSquare({ x, y }, matrix.size)) {
                    continue;
                }

                const height = dotSize;
                const width = dotSize;

                const path = getRectPath(
                    x * dotSize,
                    y * dotSize,
                    width, height,
                    borderTopLeftRadius, borderTopRightRadius,
                    borderBottomRightRadius, borderBottomLeftRadius
                )

                items.push(
                    <Path
                        key={`${x}-${y}`}
                        path={path}
                        color={props.color ?? 'black'}
                    />
                );
            }
        }
    }

    addCornerFinderPatterns(items, dotSize, matrix.size, props.color);

    return (
        <View style={{
            width: props.size,
            height: props.size,
            backgroundColor: 'white',
            padding: padding,
            flexWrap: 'wrap',
            borderRadius: 20,
        }}>
            <Canvas style={{ width: props.size, height: props.size }}>
                {items}
            </Canvas>
            <View style={{
                position: 'absolute',
                top: 0, left: 0, bottom: 0, right: 0,
                justifyContent: 'center', alignItems: 'center'
            }}>
                {!props.icon && <TonIcon height={46} width={46} style={{ height: 46, width: 46 }} />}
                {props.icon && <WImage
                    src={props.icon?.preview256}
                    blurhash={props.icon?.blurhash}
                    width={46}
                    heigh={46}
                    borderRadius={23}
                    borderWidth={0}
                    lockLoading
                />}
            </View>
        </View >
    );
});