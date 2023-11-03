import * as React from 'react';
import { Text, View } from 'react-native';
import VerifiedIcon from '../../assets/ic_verified.svg';
import ContactIcon from '../../assets/ic_contacts.svg';
import { useTheme } from '../engine/hooks';

export const ItemLarge = React.memo((props: {
    title: string,
    text?: string,
    secondary?: string,
    verified?: boolean,
    contact?: boolean,
    children?: any
}) => {
    const theme = useTheme();
    return (
        <View style={{ flexDirection: 'column', paddingHorizontal: 16, alignItems: 'flex-start' }}>
            <View style={{ height: 30, flexDirection: 'row' }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: theme.textSecondary, alignSelf: 'center', flexGrow: 1, flexBasis: 0 }}>{props.title}</Text>
                <View style={{ alignItems: 'center', height: 30, flexDirection: 'row' }}>
                    {props.verified && !props.contact && (<VerifiedIcon />)}
                    {!props.verified && props.contact && (<ContactIcon />)}
                    {props.secondary && (<Text style={{ fontSize: 14, color: theme.textSecondary }}>{props.secondary}</Text>)}
                </View>
            </View>
            <View style={{ flexDirection: 'column', paddingBottom: 4 }}>
                {props.text && (
                    <View style={{ paddingBottom: 6 }}>
                        <Text style={{ fontSize: 16 }}>{props.text}</Text>
                    </View>
                )}
                {props.children}
            </View>
        </View>
    )
});