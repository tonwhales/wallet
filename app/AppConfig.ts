import * as Application from 'expo-application';

export const AppConfig = {
    version: Application.nativeApplicationVersion,
    isTestnet: (
        Application.applicationId === 'com.tonhub.app.testnet' ||
        Application.applicationId === 'com.tonhub.app.debug.testnet' ||
        Application.applicationId === 'com.tonhub.wallet.testnet' ||
        Application.applicationId === 'com.tonhub.wallet.testnet.debug'
    )
};