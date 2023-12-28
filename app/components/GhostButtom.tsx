import * as React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useTheme } from '../engine/hooks';


export function GhostButton(props: { onClick: () => void, icon?: any, text: string, loading?: boolean }) {
    const theme = useTheme();
    return (
        <TouchableOpacity onPress={props.onClick}>
            <View
                style={{
                    marginHorizontal: 16,
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: theme.divider,
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
                {/* {props.deviceEncryption === 'face' && (
                    <>
                        <Image source={require('../../../assets/face_id.png')} style={{ marginVertical: 16, marginHorizontal: 16, width: 32, height: 32 }} />
                        <Text style={{ fontSize: 18, flexGrow: 1, flexBasis: 0 }}>
                            Protect with Face ID
                        </Text>
                    </>
                )}
                {props.deviceEncryption === 'fingerprint' && (
                    <>
                        <Image source={require('../../../assets/touch_id.png')} style={{ marginVertical: 16, marginHorizontal: 16, width: 32, height: 32 }} />
                        <Text style={{ fontSize: 18, flexGrow: 1, flexBasis: 0 }}>
                            Protect with Touch ID
                        </Text>
                    </>
                )}
                {props.deviceEncryption === 'passcode' && (
                    <>
                        <View style={{ marginVertical: 16, marginHorizontal: 16 }}>
                            <Ionicons name="keypad" size={32} color="black" />
                        </View>
                        <Text style={{ fontSize: 18, flexGrow: 1, flexBasis: 0 }}>
                            Protect with Passcode
                        </Text>
                    </>
                )}
                {props.deviceEncryption === 'none' && (
                    <>
                        <View style={{ marginVertical: 16, marginHorizontal: 16 }}>
                            <Ionicons name="lock-open-outline" size={32} color="black" />
                        </View>
                        <Text style={{ fontSize: 18, flexGrow: 1, flexBasis: 0 }}>
                            Continue anyway
                        </Text>
                    </>
                )}
                <View style={{ marginRight: 16 }}>
                
                    {loading && (<ActivityIndicator color={theme.loader} />)}
                </View> */}
                <View style={{ marginRight: 16 }}>
                    {props.loading && (<ActivityIndicator color={theme.accent} />)}
                </View>
            </View>
        </TouchableOpacity>
    )
}