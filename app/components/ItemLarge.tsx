import * as React from 'react';
import { Text, View } from 'react-native';
import { Theme } from '../Theme';
import VerifiedIcon from '../../assets/ic_verified.svg';

export const ItemLarge = React.memo((props: { title: string, text?: string, secondary?: string, verified?: boolean, children?: any }) => {
    return (
        <View style={{ flexDirection: 'column', paddingHorizontal: 16, alignItems: 'flex-start' }}>
            <View style={{ height: 30, flexDirection: 'row' }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: Theme.textSecondary, alignSelf: 'center', flexGrow: 1, flexBasis: 0 }}>{props.title}</Text>
                <View style={{ alignItems: 'center', height: 30, flexDirection: 'row' }}>
                    {props.verified && (<VerifiedIcon />)}
                    {props.secondary && (<Text style={{ fontSize: 14, color: Theme.textSecondary }}>{props.secondary}</Text>)}
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
        // <Pressable style={({ pressed }) => ({ height: 44, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, backgroundColor: pressed ? Theme.background : 'white', justifyContent: 'center' })} disabled={!props.onPress} onPress={props.onPress}>
        //     <Text style={{ fontSize: 18, color: props.onPress ? Theme.accentDark : Theme.textColor, flexGrow: 1, flexBasis: 0 }}>{props.title}</Text>
        //     {props.hint && (
        //         <View style={{ flexGrow: 0, flexShrink: 0, paddingLeft: 8 }}>
        //             <Text style={{ height: 24, fontSize: 17, textAlignVertical: 'center', color: Theme.textSecondary }}>{props.hint}</Text>
        //         </View>
        //     )}
        // </Pressable>
    )
});