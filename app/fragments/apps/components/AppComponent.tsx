import * as React from 'react';
import { ActivityIndicator, View } from 'react-native';
import WebView from 'react-native-webview';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DomainSubkey } from '../../../engine/products/AppsProduct';

export const AppComponent = React.memo((props: {
    endpoint: string,
    color: string,
    foreground: string,
    title: string,
    domainKey: DomainSubkey
}) => {
    const safeArea = useSafeAreaInsets();
    let [loaded, setLoaded] = React.useState(false);
    const opacity = useSharedValue(1);
    const animatedStyles = useAnimatedStyle(() => {
        return {

            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: props.color,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: withTiming(opacity.value, { duration: 300 }),
        };
    });
    return (
        <View style={{ backgroundColor: props.color, flexGrow: 1, flexBasis: 0, alignSelf: 'stretch' }}>
            <WebView
                source={{ uri: props.endpoint }}
                startInLoadingState={true}
                style={{ backgroundColor: props.color, flexGrow: 1, flexBasis: 0, alignSelf: 'stretch' }}
                onLoadEnd={() => {
                    setLoaded(true);
                    opacity.value = 0;
                }}
                contentInset={{ bottom: safeArea.bottom }}
                autoManageStatusBarEnabled={false}
                allowFileAccessFromFileURLs={false}
                allowUniversalAccessFromFileURLs={false}
                decelerationRate="normal"
            />

            <Animated.View
                style={animatedStyles}
                pointerEvents={loaded ? 'none' : 'box-none'}
            >
                <ActivityIndicator size="large" color={props.foreground} />
            </Animated.View>

        </View>
    );
});