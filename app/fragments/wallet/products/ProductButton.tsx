import BN from 'bn.js';
import * as React from 'react';
import { Text, View } from 'react-native';
import { TouchableHighlight } from 'react-native-gesture-handler';
import { ValueComponent } from '../../../components/ValueComponent';
import { Theme } from '../../../Theme';
import { SvgProps } from 'react-native-svg';
import { t } from '../../../i18n/t';

export function ProductButton(props: {
    name: string,
    subtitle: string,
    icon: React.FC<SvgProps>,
    value: BN | null,
    onPress: () => void
}) {
    const Icon = props.icon;
    return (
        <TouchableHighlight
            onPress={props.onPress}
            underlayColor={Theme.selector}
            style={{
                alignSelf: 'stretch', borderRadius: 14,
                backgroundColor: 'white',
                marginHorizontal: 16, marginVertical: 16
            }}
        >
            <View style={{ alignSelf: 'stretch', flexDirection: 'row', height: 62 }}>
                <View style={{ width: 42, height: 42, borderRadius: 21, borderWidth: 0, marginVertical: 10, marginLeft: 10, marginRight: 10 }}>
                    <View style={{ backgroundColor: Theme.accent, borderRadius: 21, width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }}>
                        <Icon width={29} height={29} color={'white'} />
                    </View>
                </View>
                <View style={{ flexDirection: 'column', flexGrow: 1, flexBasis: 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 10, marginRight: 10 }}>
                        <Text style={{ color: Theme.textColor, fontSize: 16, flexGrow: 1, flexBasis: 0, marginRight: 16, fontWeight: '600' }} ellipsizeMode="tail" numberOfLines={1}>
                            {props.name}
                        </Text>
                        {props.value && (
                            <Text style={{ color: props.value.gte(new BN(0)) ? '#4FAE42' : '#FF0000', fontWeight: '600', fontSize: 16, marginRight: 2 }}><ValueComponent value={props.value} /></Text>
                        )}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', marginRight: 10 }}>
                        <Text style={{ color: '#8E979D', fontSize: 13, flexGrow: 1, flexBasis: 0, marginRight: 16, marginTop: 4 }} ellipsizeMode="tail" numberOfLines={1}>{props.subtitle}</Text>
                        {/* <Text style={{ color: Theme.textSecondary, fontSize: 12, marginTop: 4 }}>{t('common.balance')}</Text> */}
                    </View>
                    <View style={{ flexGrow: 1 }} />
                </View>
            </View>
        </TouchableHighlight>
    )
}