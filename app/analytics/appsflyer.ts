import appsFlyer, { InitSDKOptions } from "react-native-appsflyer"
import { handleAttribution } from "../utils/CachedLinking";

const keys = require('@assets/keys.json');

export enum AppsFlyerEvent {
  CompletedRegistration = 'af_complete_registration',
  BackupPhraseConfirmed = 'backup_phrase_confirmed',
  TransactionSent = 'transaction_sent',
  StakingDeposit = 'staking_deposit',
}

export enum RegistrationMethod {
  Create = 'create',
  Import = 'import'
}

export const appsFlyerConfig: InitSDKOptions = {
  devKey: keys.APPSFLYER_KEY,
  isDebug: false,
  appId: '1607656232',
  onInstallConversionDataListener: true, //Optional
  onDeepLinkListener: true, //Optional
  timeToWaitForATTUserAuthorization: 15 //for iOS 14.5
};

export const initAppsFlyer = () => {
  appsFlyer.onDeepLink(res => {
    if (res.data && res.data.deep_link_value) {
      handleAttribution(res.data.deep_link_value);
    }
  });
  appsFlyer.initSdk(appsFlyerConfig);
}

export const trackAppsFlyerEvent = async (
  name: AppsFlyerEvent,
  params = {},
) => {
  appsFlyer.logEvent(
    name,
    params
  )
}

export const getAppsFlyerUID = async (): Promise<string> => {
  return new Promise((resolve, reject) => {
    appsFlyer.getAppsFlyerUID((err, uid) => {
      if (err) reject(err);
      else resolve(uid);
    });
  });
};