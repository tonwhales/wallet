import * as React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useAppConfig } from '../utils/AppConfigContext';


export function GhostButton(props: { onClick: () => void, icon?: any, text: string, loading?: boolean }) {
    const { Theme } = useAppConfig();
    return (
        <TouchableOpacity onPress={props.onClick}>
            <View
                style={{
                    marginHorizontal: 16,
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: Theme.divider,
                    alignSelf: 'stretch',
                    flexDirection: 'row',
                    alignItems: 'center'
                }}
            >
                <View style={{ flexGrow: 1, flexDirection: 'row', alignSelf: 'stretch', alignItems: 'center', height: 64 }}>
                    {props.icon && (<View>{props.icon}</View>)}
                    <Text style={{ fontSize: 18, flexGrow: 1, flexBasis: 0, marginLeft: 16 }}>
                        {props.text}
                    </Text>
                </View>
                <View style={{ marginRight: 16 }}>
                    {props.loading && (<ActivityIndicator color={Theme.accent} />)}
                </View>
            </View>
        </TouchableOpacity>
    )
}