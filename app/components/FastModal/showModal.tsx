import * as React from 'react';
import { ModalComponent, showRawModal, ModalProps } from './ModalProvider';
import { View, StyleSheet, TouchableWithoutFeedback, ScrollView, ViewStyle, KeyboardAvoidingView, LayoutChangeEvent, BackHandler, ScrollViewProps } from 'react-native';
import { SAnimatedView, SAnimated } from 'react-native-fast-animations';
import { useSafeArea } from 'react-native-safe-area-context';
import * as uuid from 'uuid';
import { animations } from './animations';

const styles = StyleSheet.create({
    fill: {
        width: '100%',
        height: '100%',
    },
    background: {
        opacity: 0,
        width: '100%',
        height: '100%',
    },
    backgroundDefault: {
        backgroundColor: 'rgba(0, 0, 0, 0.48)'
    }
});

export interface ModalConfiguration {
    backgroundStyle?: ViewStyle;
    containerStyle?: ViewStyle;
    showAnimation?: (contentHeight: number, views: { background: string, container: string }) => void;
    hideAnimation?: (contentHeight: number, views: { background: string, container: string }) => void;
    dismissOffset?: number;
    avoidKeyboard?: boolean;
    disableBottomSafeArea?: boolean;
    scrollViewProps?: ScrollViewProps;
}

const BaseModalComponent = React.memo((props: { children?: any, props: ModalProps, config: ModalConfiguration, modal: ModalComponent }) => {
    const rootName = React.useMemo(() => uuid.v4(), []);
    const containerName = React.useMemo(() => uuid.v4(), []);
    const contentHeight = React.useRef(0);
    const safeArea = useSafeArea();

    const doHide = React.useMemo(() => {
        let hidden = false;
        return () => {
            if (hidden) {
                return false;
            }
            hidden = true;

            // Hide Sequence
            SAnimated.beginTransaction();
            (props.config.hideAnimation || animations.defaultModalHideAnimation)(
                contentHeight.current + safeArea.bottom, { background: rootName, container: containerName }
            );
            SAnimated.commitTransaction(() => {
                props.props.hide();
            });
            return true;
        };
    }, []);

    const doShow = React.useMemo(() => {
        let shown = false;
        return () => {
            if (shown) {
                return false;
            }
            shown = true;
            SAnimated.beginTransaction();
            (props.config.showAnimation || animations.defaultModalShowAnimation)(
                contentHeight.current + safeArea.bottom, { background: rootName, container: containerName }
            );
            SAnimated.commitTransaction();
            return true;
        };
    }, []);

    const onLayoutCallback = React.useCallback((layout: LayoutChangeEvent) => {
        contentHeight.current = layout.nativeEvent.layout.height;
        doShow();
    }, []);

    const element = React.useMemo(() => props.modal({ hide: doHide }), []);

    React.useEffect(() => {
        let subs = BackHandler.addEventListener('hardwareBackPress', doHide);
        return () => subs.remove();
    }, []);

    return (
        <View style={styles.fill}>
            <TouchableWithoutFeedback onPress={doHide}>
                <View style={StyleSheet.absoluteFill}>
                    <SAnimatedView
                        name={rootName}
                        style={[styles.backgroundDefault, props.config.backgroundStyle, styles.background]}
                    />
                </View>
            </TouchableWithoutFeedback>
            <SAnimatedView name={containerName} style={[styles.fill, { opacity: 0 }]}>
                <KeyboardAvoidingView behavior="padding" enabled={props.config.avoidKeyboard || false}>
                    <ScrollView
                        alwaysBounceVertical={true}
                        decelerationRate={0.8}
                        style={[styles.fill, props.config.scrollViewProps?.style || {}]}
                        onScrollEndDrag={(e) => {
                            if (e.nativeEvent.contentOffset.y < -(props.config.dismissOffset !== undefined ? props.config.dismissOffset : 30)) {
                                doHide();
                            }
                            if (props.config.scrollViewProps?.onScrollEndDrag) {
                                props.config.scrollViewProps.onScrollEndDrag(e);
                            }
                        }}
                        contentContainerStyle={[{
                            flexDirection: 'column',
                            flexGrow: 1,
                            paddingBottom: props.config.disableBottomSafeArea ? 0 : safeArea.bottom,
                            paddingTop: safeArea.top,
                            paddingLeft: safeArea.left,
                            paddingRight: safeArea.right,
                        }, props.config.scrollViewProps?.contentContainerStyle || {}]}
                        {...props.config.scrollViewProps}
                    >
                        <TouchableWithoutFeedback onPress={doHide}>
                            <View style={{ flexGrow: 1 }} />
                        </TouchableWithoutFeedback>
                        <View
                            style={[
                                {
                                    backgroundColor: 'white',
                                    borderTopLeftRadius: 18,
                                    borderTopRightRadius: 18,
                                    padding: 8,
                                    paddingBottom: props.config.disableBottomSafeArea ? safeArea.bottom : 8,
                                },
                                props.config.containerStyle
                            ]}
                            onLayout={onLayoutCallback}
                        >
                            {element}
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SAnimatedView>
        </View>
    )
});

export function showModal(modal: ModalComponent, config?: ModalConfiguration) {
    showRawModal((props) => {
        return (
            <BaseModalComponent props={props} modal={modal} config={config || {}} />
        );
    });
}