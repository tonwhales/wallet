import { Linking, Alert } from 'react-native'
import { InAppBrowser } from 'react-native-inappbrowser-reborn'

export async function openLink(link: string) {
    try {
        if (await InAppBrowser.isAvailable()) {
            const result = await InAppBrowser.open(link, {
                // iOS Properties
                dismissButtonStyle: 'cancel',
                // preferredBarTintColor: '#453AA4',
                // preferredControlTintColor: 'white',
                readerMode: false,
                animated: true,
                modalPresentationStyle: 'pageSheet',
                modalTransitionStyle: 'coverVertical',
                modalEnabled: true,
                enableBarCollapsing: false,
                // Android Properties
                showTitle: true,
                secondaryToolbarColor: 'black',
                navigationBarColor: 'black',
                navigationBarDividerColor: 'white',
                enableUrlBarHiding: true,
                enableDefaultShare: true,
                forceCloseOnRedirection: false,
                // Specify full animation resource identifier(package:anim/name)
                // or only resource name(in case of animation bundled with app).
                animations: {
                    startEnter: 'slide_in_right',
                    startExit: 'slide_out_left',
                    endEnter: 'slide_in_left',
                    endExit: 'slide_out_right'
                },
            })
            // Alert.alert(JSON.stringify(result))
        }
        else Linking.openURL(link)
    } catch (error: any) {
        Alert.alert(error.message)
    }
}