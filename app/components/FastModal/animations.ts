import { SAnimated } from 'react-native-fast-animations';
import { Platform } from 'react-native';
export const animations = {
    defaultModalShowAnimation: (contentHeight: number, views: { background: string, container: string }) => {
        SAnimated.timing(views.background, { property: 'opacity', from: 0, to: 1, duration: 0.4 });
        SAnimated.setValue(views.container, 'opacity', 1);
        if (Platform.OS === 'ios') {
            SAnimated.spring(views.container, { property: 'translateY', from: contentHeight, to: 0, duration: 0.5 });
        } else {
            SAnimated.timing(views.container, { property: 'translateY', easing: 'material', from: contentHeight, to: 0, duration: 0.5 });
        }
    },
    defaultModalHideAnimation: (contentHeight: number, views: { background: string, container: string }) => {
        SAnimated.timing(views.background, { property: 'opacity', from: 1, to: 0, duration: 0.05 });
        SAnimated.timing(views.container, { property: 'translateY', easing: { bezier: [0.23, 1, 0.32, 1] }, from: 0, to: contentHeight, duration: 0.35 });
    }
};