import BN from 'bn.js';
import * as React from 'react';
import { ImageRequireSource, StyleProp, Text, useWindowDimensions, View, ViewStyle } from 'react-native';
import { TouchableHighlight } from 'react-native';
import { ValueComponent } from '../../../components/ValueComponent';
import { SvgProps } from 'react-native-svg';
import { PriceComponent } from '../../../components/PriceComponent';
import { WImage } from '../../../components/WImage';
import Verified from '../../../../assets/ic_verified.svg';
import { useNetwork } from '../../../engine/hooks/network/useNetwork';
import { useTheme } from '../../../engine/hooks/theme/useTheme';

export type ProductButtonProps = {
    name: string,
    subtitle: string,
    icon?: React.FC<SvgProps>,
    image?: string,
    requireSource?: ImageRequireSource,
    blurhash?: string,
    value: bigint | string | null,
    decimals?: number | null,
    symbol?: string,
    extension?: boolean,
    onPress: () => void,
    onLongPress?: () => void
    style?: StyleProp<ViewStyle>,
    iconViewStyle?: StyleProp<ViewStyle>,
    iconProps?: SvgProps,
    known?: boolean
}

export function ProductButton(props: ProductButtonProps) {
    const theme = useTheme();
    const { isTestnet } = useNetwork();
    const Icon = props.icon;
    const dimentions = useWindowDimensions();
    const fontScaleNormal = dimentions.fontScale <= 1;

    return (
        <TouchableHighlight
            onPress={props.onPress}
            onLongPress={props.onLongPress}
            underlayColor={theme.selector}
            style={[
                {
                    alignSelf: 'stretch', borderRadius: 14,
                    backgroundColor: theme.item,
                    marginHorizontal: 16, marginVertical: 8
                },
                props.style
            ]}
        >
            <View style={{ alignSelf: 'stretch', flexDirection: 'row', minHeight: fontScaleNormal ? undefined : 62 }}>
                <View style={{ width: 42, height: 42, borderRadius: 21, borderWidth: 0, marginVertical: 10, marginLeft: 10, marginRight: 10 }}>
                    {Icon && !props.image && (
                        <View style={[
                            { backgroundColor: theme.accent, borderRadius: 21, width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
                            props.iconViewStyle
                        ]}>
                            <Icon width={props.iconProps?.width ?? 42} height={props.iconProps?.height ?? 42} color={props.iconProps?.color ?? 'white'} />
                        </View>
                    )}
                    {(props.image || !Icon || props.requireSource) && (
                        <WImage
                            src={props.image}
                            requireSource={props.requireSource}
                            blurhash={props.blurhash}
                            width={42}
                            heigh={42}
                            borderRadius={props.extension ? 8 : 21}
                        />
                    )}
                    {!!props.known && (
                        <Verified
                            style={{
                                position: 'absolute', top: -1, right: -4
                            }}
                            height={Math.floor(42 * 0.35)}
                            width={Math.floor(42 * 0.35)}
                        />
                    )}
                </View>
                <View style={{ flexDirection: 'column', flexGrow: 1, flexBasis: 0 }}>
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        marginTop: 10,
                        marginRight: 10
                    }}>
                        <Text
                            style={{
                                color: theme.textColor,
                                fontSize: 16,
                                marginRight: 16,
                                fontWeight: '600',
                                flexShrink: 1
                            }}
                            ellipsizeMode={'tail'}
                            numberOfLines={1}
                        >
                            {props.name}
                        </Text>
                        {(!!props.value && typeof props.value !== 'string') && (
                            <Text style={{ color: props.value >= BigInt(0) ? theme.pricePositive : theme.priceNegative, fontWeight: '400', fontSize: 16, marginRight: 2, alignSelf: 'flex-start' }}>
                                <ValueComponent value={props.value} decimals={props.decimals} />{props.symbol ? (' ' + props.symbol) : ''}
                            </Text>
                        )}
                        {(!!props.value && typeof props.value === 'string') && (
                            <Text style={{ color: theme.textColor, fontWeight: '400', fontSize: 16, marginRight: 2, alignSelf: 'flex-start' }}>
                                {props.value}
                            </Text>
                        )}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginRight: 10, marginBottom: 10, }}>
                        <Text
                            style={{ color: theme.textSubtitle, fontSize: 13, flexShrink: 1, paddingRight: 16, marginTop: 4 }}
                            ellipsizeMode={'tail'}
                            numberOfLines={1}
                        >
                            <Text style={{ flexShrink: 1 }}>
                                {props.subtitle}
                            </Text>
                        </Text>
                        {(!!props.value && typeof props.value !== 'string' && !props.symbol) &&
                            (
                                <PriceComponent
                                    amount={props.value}
                                    style={{
                                        backgroundColor: theme.transparent,
                                        paddingHorizontal: 0, paddingVertical: 0,
                                        alignSelf: 'flex-end',
                                        marginTop: 2, height: 14
                                    }}
                                    textStyle={{ color: theme.textSubtitle, fontWeight: '400', fontSize: 12 }}
                                />
                            )
                        }
                    </View>
                    <View style={{ flexGrow: 1 }} />
                </View>
            </View>
        </TouchableHighlight>
    )
}