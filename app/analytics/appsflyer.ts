import appsFlyer, { InitSDKOptions } from "react-native-appsflyer"
import { Alert, NativeModules, Platform } from "react-native";
import Clipboard from '@react-native-clipboard/clipboard';
import { handleAttribution } from "../utils/CachedLinking";
import { afLog } from "./appsFlyerDebugLog";

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
  isDebug: true,
  appId: '1607656232',
  onInstallConversionDataListener: true,
  onDeepLinkListener: true,
  timeToWaitForATTUserAuthorization: 15
};

let attributionHandled = false;

function handleAttributionOnce(value: string) {
  if (attributionHandled) {
    afLog('ATTR', 'SKIPPED (already handled)', { value });
    return;
  }
  attributionHandled = true;
  afLog('ATTR', 'handleAttributionOnce → handleAttribution', { value });
  handleAttribution(value);
}

async function checkClipboardForDeepLink() {
  try {
    const content = await Clipboard.getString();
    afLog('CLIPBOARD', 'Clipboard content', { content: content?.substring(0, 300) });

    const match = content?.match(/tonhub\.com\/holders\/i\/(\w+)/);
    if (match) {
      const path = `holders/i/${match[1]}`;
      afLog('CLIPBOARD', `Found invite in clipboard: ${path}`);
      Alert.alert('Clipboard deep link', path);
      handleAttributionOnce(path);
    } else {
      afLog('CLIPBOARD', 'No tonhub invite found in clipboard');
    }
  } catch (e) {
    afLog('CLIPBOARD', 'Failed to read clipboard', { error: String(e) });
  }
}

export const initAppsFlyer = () => {
  afLog('INIT', 'Registering onDeepLink listener');

  appsFlyer.onDeepLink(res => {
    afLog('DEEPLINK', 'onDeepLink fired', res?.data ?? res);
    Alert.alert('AF onDeepLink', JSON.stringify(res?.data ?? res, null, 2));

    if (res.data && res.data.deep_link_value) {
      afLog('DEEPLINK', `deep_link_value found: ${res.data.deep_link_value}`);
      handleAttributionOnce(res.data.deep_link_value);
    } else {
      afLog('DEEPLINK', 'No deep_link_value in payload');
    }
  });

  afLog('INIT', 'Registering onInstallConversionData listener');

  appsFlyer.onInstallConversionData(res => {
    afLog('CONV', 'onInstallConversionData fired', res?.data ?? res);
    Alert.alert('AF ConversionData', JSON.stringify(res?.data ?? res, null, 2));

    const isFirstLaunch: unknown = res?.data?.is_first_launch;
    afLog('CONV', `is_first_launch = ${JSON.stringify(isFirstLaunch)} (type: ${typeof isFirstLaunch})`);

    if (isFirstLaunch !== 'true' && isFirstLaunch !== true) {
      afLog('CONV', 'SKIPPED: not first launch');
      Alert.alert('AF SKIP', `is_first_launch = ${JSON.stringify(isFirstLaunch)} (${typeof isFirstLaunch})`);
      return;
    }

    const afStatus = res.data.af_status;
    afLog('CONV', `af_status = ${afStatus}`);

    if (afStatus === 'Non-organic') {
      afLog('CONV', 'Non-organic install detected');

      if (res.data.deep_link_value) {
        afLog('CONV', `Non-organic: deep_link_value = ${res.data.deep_link_value}`);
        handleAttributionOnce(res.data.deep_link_value);
        return;
      }

      const afDp = res.data.af_dp;
      afLog('CONV', `Non-organic: af_dp = ${JSON.stringify(afDp)}`);

      if (typeof afDp === 'string') {
        const schemeIdx = afDp.indexOf('://');
        const path = schemeIdx !== -1
          ? afDp.substring(schemeIdx + 3).replace(/^\//, '')
          : afDp;
        afLog('CONV', `Non-organic: parsed af_dp path = ${path}`);
        if (path) {
          handleAttributionOnce(path);
        }
      }
      return;
    }

    afLog('CONV', 'Organic / other — checking fallback fields');

    // Log all available keys for debugging
    const allKeys = Object.keys(res.data || {});
    afLog('CONV', `All data keys: ${allKeys.join(', ')}`, res.data);

    if (res.data.deep_link_value) {
      afLog('CONV', `Organic fallback: deep_link_value = ${res.data.deep_link_value}`);
      handleAttributionOnce(res.data.deep_link_value);
      return;
    }

    const afDpFallback = res.data.af_dp;
    afLog('CONV', `Organic fallback: af_dp = ${JSON.stringify(afDpFallback)}`);

    if (typeof afDpFallback === 'string') {
      const schemeIdx = afDpFallback.indexOf('://');
      const path = schemeIdx !== -1
        ? afDpFallback.substring(schemeIdx + 3).replace(/^\//, '')
        : afDpFallback;
      afLog('CONV', `Organic fallback: parsed af_dp path = ${path}`);
      if (path) {
        handleAttributionOnce(path);
      }
    } else {
      afLog('CONV', 'No deep_link_value or af_dp found — trying clipboard fallback');
      if (Platform.OS === 'android') {
        checkClipboardForDeepLink();
      }
    }
  });

  afLog('INIT', 'Calling appsFlyer.initSdk');
  appsFlyer.initSdk(appsFlyerConfig)
    .then((result) => {
      afLog('INIT', 'initSdk resolved', result);
    })
    .catch((err) => {
      afLog('INIT', 'initSdk rejected', { error: String(err) });
    });

  if (Platform.OS === 'android') {
    const { InstallReferrerModule } = NativeModules;
    if (InstallReferrerModule) {
      InstallReferrerModule.getReferrer()
        .then((raw: string) => {
          afLog('REFERRER', 'Raw Install Referrer from Google Play', { raw });
          Alert.alert('Raw Install Referrer', raw);
        })
        .catch((err: unknown) => {
          afLog('REFERRER', 'Failed to read referrer', { error: String(err) });
        });
    } else {
      afLog('REFERRER', 'InstallReferrerModule not available');
    }
  }
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
      afLog('UID', `getAppsFlyerUID: uid=${uid}, err=${err}`);
      resolve(uid);
    });
  });
};
