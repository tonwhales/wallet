import { warn } from "../../utils/log";
import { BackPolicy, ZenPayQueryParams } from "./types";
import * as FileSystem from 'expo-file-system';
import * as t from 'io-ts';

// {
// "name":"holders-dapp",
// "resources":[
// "assets/ic-document-32-283cdedf.svg",
// "assets/ic-key-32-883945e8.svg",
// "assets/ic-block-32-5bf50a48.svg",
// "assets/ic-check-16-54e2649c.svg",
// "assets/ic-copy-16-a6a2c32c.svg",
// "assets/ic-freeze-32-abeef3be.svg",
// "assets/ic-unfreeze-32-c309be98.svg",
// "assets/ic-info-24-9a20d8e8.svg",
// "assets/ic-swap-32-642c4b9b.svg",
// "assets/ic-delivery_box-32-155eee8e.svg",
// "assets/ic-pin-32-15cecafa.svg",
// "assets/ic-track-number-32-aaa9e30d.svg",
// "assets/ic-user-32-67553834.svg",
// "assets/ic-more-32-ba7e5ad2.svg",
// "assets/ic-top-up-32-f32d0d32.svg",
// "assets/ic-transfer-32-4643c3c3.svg",
// "assets/ic-arrow-right-16-eedbb4fc.svg",
// "assets/ic-delivery_box-24-baa6c8a6.svg",
// "assets/ic-card-24-a5521286.svg",
// "assets/ic-lock-32-5db37ee4.svg",
// "assets/ic-percent-32-9bc25ab7.svg",
// "assets/ic-shield-32-30e27ac7.svg",
// "assets/ic-wallet-32-08ba6071.svg",
// "assets/ic-watch-32-25bc81d8.svg",
// "assets/ic-back-24-9f4f20ad.svg",
// "assets/ic-close-24-e9799a23.svg",
// "assets/ic-block-18-894b6abb.svg",
// "assets/ic-infinity-18-73625c28.svg",
// "assets/ic-radio-off-24-8d8964f9.svg",
// "assets/ic-radio-on-24-52e62a1a.svg",
// "assets/ic-mastercard-reversed-37ec69cb.svg",
// "assets/ic-block-24-2f74bbea.svg",
// "assets/ic-freeze-24-7d22b900.svg",
// "assets/ic-cheap-small-ba16efad.svg",
// "assets/ic-nfc-small-b0ab8ef4.svg",
// "assets/ic-activated-df012ae5.svg",
// "assets/ic-exit-928806c0.svg",
// "assets/ic-freeze-fca23b79.svg",
// "assets/ic-lock-ba1313cf.svg",
// "assets/ic-pay-1fce1c93.svg",
// "assets/ic-plus-eab892c1.svg",
// "assets/ic-setup-a5466939.svg",
// "assets/ic-unfreeze-b80d8596.svg",
// "assets/ic-withdrawal-176d2210.svg",
// "assets/ic-back-8ec5669e.svg",
// "assets/ic-allert-16-c14d7154.svg",
// "assets/ic-smart-contract-32-f31ba52b.svg",
// "assets/ic-failed-16-3391702f.svg",
// "assets/ic-time-16-371eee32.svg",
// "assets/index-0d8ecaeb.css",
// "assets/index.es-dc92bf44.js",
// "assets/index-ad7811fe.js",
// "assets/common-f0260efc.js",
// "animations/flag.json",
// "favicon.ico",
// "images/about/landing/img-1.png",
// "images/about/landing/img-1@2x.png",
// "images/about/landing/img-2.png",
// "images/about/landing/img-2@2x.png",
// "images/about/landing/img-3.png",
// "images/about/landing/img-3@2x.png",
// "images/about/landing/img-4.png",
// "images/about/landing/img-4@2x.png",
// "images/about/landing/img-5.png",
// "images/about/landing/img-5@2x.png",
// "images/about/landing/img-6.png",
// "images/about/landing/img-6@2x.png",
// "images/about/limits/img-1.png",
// "images/about/limits/img-1@2x.png",
// "images/about/limits/img-2.png",
// "images/about/limits/img-2@2x.png",
// "images/about/limits/img-3.png",
// "images/about/limits/img-3@2x.png",
// "images/about/limits/img-4.png",
// "images/about/limits/img-4@2x.png",
// "images/about/wallet/img-1.png",
// "images/about/wallet/img-1@2x.png",
// "images/about/wallet/img-2.png",
// "images/about/wallet/img-2@2x.png",
// "images/about/wallet/img-3.png",
// "images/about/wallet/img-3@2x.png",
// "images/about/wallet/img-4.png",
// "images/about/wallet/img-4@2x.png",
// "images/about/wallet/img-5.png",
// "images/about/wallet/img-5@2x.png",
// "images/auth/img-docs.png",
// "images/auth/img-docs@2x.png",
// "images/auth/img-kyc.png",
// "images/auth/img-kyc@2x.png",
// "images/card/card-frozen.png",
// "images/card/card-frozen@2x.png",
// "images/card/promo/img-promo1.png",
// "images/card/promo/img-promo1@2x.png",
// "images/card/promo/img-promo2.png",
// "images/card/promo/img-promo2@2x.png",
// "images/icons/ic_diamond.png",
// "images/icons/img_eu.png",
// "images/icons/img_eu@2x.png",
// "images/icons/img_europe.png",
// "images/icons/img_europe@2x.png",
// "images/landing/img-cards.png",
// "images/landing/img-cards@2x.png",
// "vercel.svg"
//     ],
//     "routes":[
//     {
//     "fileName":"index.html",
//     "path":"*",
//     "source":"<!DOCTYPE html> <html lang=\"en\"> <head> <title>Tonhub Cards</title> <meta charset=\"utf-8\" /> <meta name=\"viewport\" content=\"width=device-width, minimum-scale=1.0, initial-scale=1.0, maximum-scale=1.0, user-scalable=no\" /> <meta name=\"Holders\" content=\"Tonhub - Issue a debit card linked directly to Your Tonhub wallet.\" /> <meta name=\"theme-color\" content=\"#ffffff\" /> <meta name=\"application-name\" content=\"Holders\" /> <meta name=\"ton-x-image\" content=\"https://tonhub-price-history-extension-draft.vercel.app/ton_symbol_310.png\" /> <meta property=\"og:logo\" content=\"https://tonhub-price-history-extension-draft.vercel.app/ton_symbol_310.png\" /> <meta itemProp=\"og:logo\" content=\"https://tonhub-price-history-extension-draft.vercel.app/ton_symbol_310.png\" /> <link rel=\"icon\" href=\"/favicon.ico\" /> <script type=\"module\" crossorigin src=\"/assets/index-ad7811fe.js\"></script> <link rel=\"modulepreload\" crossorigin href=\"/assets/common-f0260efc.js\"> <link rel=\"stylesheet\" href=\"/assets/index-0d8ecaeb.css\"> </head> <body> <div id=\"root\"></div> </body> </html> "
//     }
//     ],
//     "version":"0.1.4"
//     }

// "assets/common-f0260efc.js",
// "animations/flag.json",
// "favicon.ico",
// "images/about/landing/img-1.png",
// "images/icons/img_eu.png",
// "images/landing/img-cards.png",
// "vercel.svg"
// "images/auth/img-docs@2x.png",

export const zenPayAppCodec = t.type({
    version: t.string,
    routes: t.array(t.type({
        fileName: t.string,
        path: t.string,
        source: t.string
    })),
    resources: t.array(t.string)
});

export type ZenPayApp = {
    version: string
    routes: {
        fileName: string
        path: string
        source: string
    }[]
    resources: string[]
}

// ZenPayApps assets are scripts, styles and static files that are downloaded and injected into the ZenPayApp html source
// for example some asset css from the assets array is "/assets/index-0d8ecaeb.css"

export async function downloadAsset(endpoint: string, assetPath: string): Promise<string> {
    const assetUri = `${endpoint}/${assetPath}`;
    const assetRelativePath = assetPath.split('/').slice(0, -1);
    const assetFilename = assetPath.split('/').pop()?.replaceAll('/', '');
    const assetDirectory = assetRelativePath.length > 0
        ? `${FileSystem.cacheDirectory}${'zenpay/'}${assetPath.split('/').slice(0, -1).join('/')}`
        : `${FileSystem.cacheDirectory}${'zenpay/'}${assetFilename}`;

    const assetPathInCache = `${assetDirectory}/${assetFilename}`;

    console.log({ assetUri, assetPath, assetDirectory, assetFilename, assetPathInCache });

    try {
        const { exists: dirExists } = await FileSystem.getInfoAsync(assetDirectory);
        if (!dirExists) {
            await FileSystem.makeDirectoryAsync(assetDirectory, { intermediates: true });
        }

        // check if asset is already downloaded
        const { exists } = await FileSystem.getInfoAsync(assetPathInCache);
        console.log({ exists });
        if (exists) {
            console.log('Asset already downloaded: ' + assetPathInCache);
            return assetPathInCache;
        }
        // console.log('Downloading asset: ' + assetUri + ' to ' + assetPathInCache + '...');
        const { uri } = await FileSystem.downloadAsync(assetUri, assetPathInCache, {});
        console.log('Downloaded asset: ' + uri);
        return uri;
    } catch (error) {
        console.error(`Failed to download asset from ${assetUri}: ${error}`);
        throw error;
    }
}

// A function that downloads all of the ZenPayApp assets and html source, then injects all assets into the source and returns the result
export async function setupLocalZenPayApp(endpoint: string, app: ZenPayApp): Promise<string | null> {
    // has free space
    const freeSpace = await FileSystem.getFreeDiskStorageAsync();
    console.log({ freeSpace });
    const hasAppDirectory = await FileSystem.getInfoAsync(FileSystem.cacheDirectory + 'zenpay');
    if (!hasAppDirectory.exists) {
        await FileSystem.makeDirectoryAsync(FileSystem.cacheDirectory + 'zenpay');
    }
    
    let uri = null;
    if (true
        && app.routes.length > 0
        && app.routes[0].fileName === 'index.html'
    ) {
        uri = FileSystem.cacheDirectory + 'zenpay/' + app.routes[0].fileName;
        const stored = await FileSystem.writeAsStringAsync(uri, app.routes[0].source);
        console.log({ stored });
    }

    console.log({ uri });

    // go through all assets and download them await downloadAsset(endpoint, asset)
    const assets = app.resources.map(asset => downloadAsset(endpoint, asset));
    const downloadedAssets = await Promise.all(assets);
    console.log({ downloadedAssets });


    return uri;
}

export function extractZenPayQueryParams(url: string): {
    closeApp: boolean,
    openUrl: string | null,
    backPolicy: BackPolicy,
    openEnrollment: boolean,
    showKeyboardAccessoryView: boolean,
} {
    try {
        const query = url.split('?')[1];
        const params = new URLSearchParams(query);
        let closeApp = false;
        let openUrl = null;
        let backPolicy: BackPolicy = 'close';
        let openEnrollment = false;
        let showKeyboardAccessoryView = false;

        if (params.has(ZenPayQueryParams.CloseApp)) {
            const queryValue = params.get(ZenPayQueryParams.CloseApp);
            if (queryValue === 'true') {
                closeApp = true;
            }
        }

        if (params.has(ZenPayQueryParams.OpenUrl)) {
            const queryValue = params.get(ZenPayQueryParams.OpenUrl);
            if (queryValue) {
                openUrl = queryValue;
            }
        }

        if (params.has(ZenPayQueryParams.BackPolicy)) {
            const queryValue = params.get(ZenPayQueryParams.BackPolicy);
            if (queryValue === 'back') {
                backPolicy = 'back';
            }
        }

        if (params.has(ZenPayQueryParams.OpenEnrollment)) {
            const queryValue = params.get(ZenPayQueryParams.OpenEnrollment);
            if (queryValue === 'true') {
                openEnrollment = true;
            }
        }

        if (params.has(ZenPayQueryParams.ShowKeyboardAccessoryView)) {
            const queryValue = params.get(ZenPayQueryParams.ShowKeyboardAccessoryView);
            if (queryValue === 'true') {
                showKeyboardAccessoryView = true;
            }
        }

        return {
            closeApp,
            openUrl,
            backPolicy: backPolicy,
            openEnrollment,
            showKeyboardAccessoryView,
        }
    } catch (error) {
        warn(error);
        return {
            closeApp: false,
            openUrl: null,
            backPolicy: 'close',
            openEnrollment: false,
            showKeyboardAccessoryView: false,
        }
    }
}