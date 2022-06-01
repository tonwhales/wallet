import * as React from 'react';
import { ActivityIndicator, View } from 'react-native';
import WebView from 'react-native-webview';
import Animated, { FadeOut } from 'react-native-reanimated';

export const AppComponent = React.memo((props: { endpoint: string, color: string, foreground: string }) => {
    let [loaded, setLoaded] = React.useState(false);
    return (
        <View style={{ backgroundColor: props.color, flexGrow: 1, flexBasis: 0, alignSelf: 'stretch' }}>
            <WebView
                source={{ uri: props.endpoint }}
                startInLoadingState={true}
                style={{ backgroundColor: props.color, flexGrow: 1, flexBasis: 0, alignSelf: 'stretch' }}
                onLoadEnd={() => setLoaded(true)}
            />
            {!loaded && (
                <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: props.color, alignItems: 'center', justifyContent: 'center' }} exiting={FadeOut.duration(1000)}>
                    <ActivityIndicator size="large" color={props.foreground} />
                </Animated.View>
            )}
        </View>
    );
});