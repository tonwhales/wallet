import BN from 'bn.js';
import * as React from 'react';
import { Image, StyleProp, Text, useWindowDimensions, View, ViewStyle } from 'react-native';
import { TouchableHighlight } from 'react-native';
import { ValueComponent } from '../../../components/ValueComponent';
import { Theme } from '../../../Theme';
import { SvgProps } from 'react-native-svg';
import { PriceComponent } from '../../../components/PriceComponent';
import { WImage } from '../../../components/WImage';

export function ProductButton(props: {
    name: string,
    subtitle: string,
    icon?: React.FC<SvgProps>,
    image?: string,
    blurhash?: string,
    value: BN | null,
    symbol?: string,
    extension?: boolean,
    onPress: () => void,
    onLongPress?: () => void
    style?: StyleProp<ViewStyle>,
    iconBackgroundTint?: string
}) {
    const Icon = props.icon;
    const dimentions = useWindowDimensions();
    const fontScaleNormal = dimentions.fontScale <= 1;

    return (
        <TouchableHighlight
            onPress={props.onPress}
            onLongPress={props.onLongPress}
            underlayColor={Theme.selector}
            style={[
                {
                    alignSelf: 'stretch', borderRadius: 14,
                    backgroundColor: Theme.item,
                    marginHorizontal: 16, marginVertical: 8
                },
                props.style
            ]}
        >
            <View style={{ alignSelf: 'stretch', flexDirection: 'row', minHeight: fontScaleNormal ? undefined : 62 }}>
                <View style={{ width: 42, height: 42, borderRadius: 21, borderWidth: 0, marginVertical: 10, marginLeft: 10, marginRight: 10 }}>
                    {Icon && !props.image && (
                        <View style={{ backgroundColor: Theme.accent, borderRadius: 21, width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }}>
                            <Icon width={42} height={42} color={'white'} />
                        </View>
                    )}
                    {(props.image || !Icon) && (
                        <WImage
                            src={props.image}
                            blurhash={props.blurhash}
                            width={42}
                            heigh={42}
                            borderRadius={props.extension ? 8 : 21}
                        />
                    )}
                </View>
                <View style={{ flexDirection: 'column', flexGrow: 1, flexBasis: 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 10, marginRight: 10 }}>
                        <Text style={{ color: Theme.textColor, fontSize: 16, marginRight: 16, fontWeight: '600', flexShrink: 1 }} ellipsizeMode="tail" numberOfLines={fontScaleNormal ? 1 : 2}>
                            {props.name}
                        </Text>
                        {props.value && (
                            <Text style={{ color: props.value.gte(new BN(0)) ? '#4FAE42' : '#FF0000', fontWeight: '400', fontSize: 16, marginRight: 2, alignSelf: 'flex-start' }}>
                                <ValueComponent value={props.value} />{props.symbol ? (' ' + props.symbol) : ''}
                            </Text>
                        )}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', marginRight: 10, marginBottom: 10 }}>
                        <Text style={{ color: '#8E979D', fontSize: 13, flexGrow: 1, flexBasis: 0, marginRight: 16, marginTop: 4 }} ellipsizeMode="tail" numberOfLines={1}>{props.subtitle}</Text>
                        {!!props.value && !props.symbol &&
                            (
                                <PriceComponent
                                    amount={props.value}
                                    style={{
                                        backgroundColor: 'transparent',
                                        paddingHorizontal: 0, paddingVertical: 0,
                                        alignSelf: 'flex-end',
                                        marginTop: 2, height: 14
                                    }}
                                    textStyle={{ color: '#8E979D', fontWeight: '400', fontSize: 12 }}
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