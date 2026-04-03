import appsFlyer, { InitSDKOptions } from "react-native-appsflyer"
import { handleAttribution } from "../utils/CachedLinking";

const keys = require('@assets/keys.json');

export enum AppsFlyerEvent {
  CompletedRegistration = 'af_registration_complete',
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

let attributionHandled = false;

function handleAttributionOnce(value: string) {
  if (attributionHandled) {
    return;
  }
  attributionHandled = true;
  handleAttribution(value);
}

export const initAppsFlyer = () => {
  appsFlyer.onDeepLink(res => {
    if (res.data && res.data.deep_link_value) {
      handleAttributionOnce(res.data.deep_link_value);
    }
  });

  appsFlyer.onInstallConversionData(res => {
    if (res?.data?.is_first_launch !== 'true') {
      return;
    }

    if (res.data.af_status === 'Non-organic') {
      if (res.data.deep_link_value) {
        handleAttributionOnce(res.data.deep_link_value);
        return;
      }

      const afDp = res.data.af_dp;
      if (typeof afDp === 'string') {
        const schemeIdx = afDp.indexOf('://');
        const path = schemeIdx !== -1
          ? afDp.substring(schemeIdx + 3).replace(/^\//, '')
          : afDp;
        if (path) {
          handleAttributionOnce(path);
        }
      }
      return;
    }

    // Fallback for installs from tonhub.com landing page:
    // These may be classified as Organic if AppsFlyer fingerprint matching missed,
    // but the Play Store referrer still carries deep_link_value.
    if (res.data.deep_link_value) {
      handleAttributionOnce(res.data.deep_link_value);
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

export const getAppsFlyerUID = (): Promise<string | undefined> => {
  return new Promise((resolve) => {
    appsFlyer.getAppsFlyerUID((err, uid) => {
      resolve(uid);
    });
  });
};