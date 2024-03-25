import * as React from 'react';
import { ImageRequireSource, StyleProp, Text, useWindowDimensions, View, ViewStyle } from 'react-native';
import { TouchableHighlight } from 'react-native';
import { ValueComponent } from '../../../components/ValueComponent';
import { SvgProps } from 'react-native-svg';
import { PriceComponent } from '../../../components/PriceComponent';
import { WImage } from '../../../components/WImage';
import Verified from '../../../../assets/ic_verified.svg';
import { useTheme } from '../../../engine/hooks';

export type ProductButtonProps = {
    name: string,
    subtitle?: string | null,
    icon?: React.FC<SvgProps>,
    iconComponent?: React.ReactNode,
    image?: string | null,
    requireSource?: ImageRequireSource,
    blurhash?: string,
    value?: bigint | string | null,
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
    const Icon = props.icon;
    const dimentions = useWindowDimensions();
    const fontScaleNormal = dimentions.fontScale <= 1;

    let icon = null;
    if (Icon && !props.image) {
        icon = (
            <View style={[
                { backgroundColor: theme.accent, borderRadius: 23, width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
                props.iconViewStyle
            ]}>
                <Icon width={props.iconProps?.width ?? 46} height={props.iconProps?.height ?? 46} color={props.iconProps?.color ?? 'white'} />
            </View>
        )
    } else if (props.image || !Icon || props.requireSource) {
        icon = (
            <WImage
                src={props.image}
                requireSource={props.requireSource}
                blurhash={props.blurhash}
                width={46}
                heigh={46}
                borderRadius={props.extension ? 8 : 23}
            />
        )
    }

    if (props.iconComponent) {
        icon = props.iconComponent;
    }

    return (
        <TouchableHighlight
            onPress={props.onPress}
            onLongPress={props.onLongPress}
            style={[
                {
                    alignSelf: 'stretch', borderRadius: 14,
                    backgroundColor: theme.surfaceOnBg,
                    marginHorizontal: 16, marginVertical: 8
                },
                props.style
            ]}
            underlayColor={theme.surfaceOnBg}
        >
            <View style={{ alignSelf: 'stretch', flexDirection: 'row', minHeight: fontScaleNormal ? undefined : 62 }}>
                <View style={{ width: 46, height: 46, borderRadius: 23, borderWidth: 0, marginVertical: 10, marginLeft: 10, marginRight: 10 }}>
                    {icon}
                    {!!props.known && (
                        <Verified
                            style={{
                                position: 'absolute', top: -1, right: -4
                            }}
                            height={Math.floor(46 * 0.35)}
                            width={Math.floor(46 * 0.35)}
                        />
                    )}
                </View>
                <View style={{
                    flexDirection: 'column',
                    flexGrow: 1, flexBasis: 0,
                    justifyContent: 'center'
                }}>
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        marginTop: 10,
                        marginRight: 10
                    }}>
                        <Text
                            style={{
                                color: theme.textPrimary,
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
                            <Text style={{ color: props.value >= BigInt(0) ? theme.accentGreen : theme.accentRed, fontWeight: '400', fontSize: 16, marginRight: 2, alignSelf: 'flex-start' }}>
                                <ValueComponent
                                    value={props.value}
                                    decimals={props.decimals}
                                    centFontStyle={{ opacity: 0.5 }}
                                />
                                <Text style={{ opacity: 0.5 }}>
                                    {props.symbol ? (' ' + props.symbol) : ''}
                                </Text>
                            </Text>
                        )}
                        {(!!props.value && typeof props.value === 'string') && (
                            <Text style={{ color: theme.textPrimary, fontWeight: '400', fontSize: 16, marginRight: 2, alignSelf: 'flex-start' }}>
                                {props.value}
                            </Text>
                        )}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginRight: 10, marginBottom: 10, }}>
                        {!!props.subtitle && (
                            <Text
                                style={{ color: theme.textSecondary, fontSize: 13, flexShrink: 1, paddingRight: 16, marginTop: 4 }}
                                ellipsizeMode={'tail'}
                                numberOfLines={1}
                            >
                                <Text style={{ flexShrink: 1 }}>
                                    {props.subtitle}
                                </Text>
                            </Text>
                        )}
                        {(!!props.value && typeof props.value !== 'string' && !props.symbol) && (
                            <PriceComponent
                                amount={props.value}
                                style={{
                                    backgroundColor: theme.transparent,
                                    paddingHorizontal: 0, paddingVertical: 0,
                                    alignSelf: 'flex-end',
                                    marginTop: 2, height: 14
                                }}
                                theme={theme}
                                textStyle={{ color: theme.textSecondary, fontWeight: '400', fontSize: 12 }}
                            />
                        )}
                    </View>
                </View>
            </View>
        </TouchableHighlight>
    );
}