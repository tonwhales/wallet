import { Address } from "ton";
import { AppConfig } from "../../AppConfig";
import { Engine } from "../Engine";
import { startJettonMasterSync } from "./startJettonMasterSync";
import { startAccountFullSync } from "./startAccountFullSync";
import { startAccountLiteSync } from "./startAccountLiteSync";
import { startHintsSync } from "./startHintsSync";
import { startPluginSync } from "./startPluginSync";
import { startStakingPoolSync } from "./startStakingPoolSync";
import { startWalletV4Sync } from "./startWalletV4Sync";
import { startJettonWalletSync } from "./startJettonWalletSync";

export function startSync(engine: Engine) {

    //
    // Hints
    //

    startHintsSync(engine);

    //
    // Lite accounts
    //

    engine.persistence.liteAccounts.on('created', (e) => {
        startAccountLiteSync(e.key, engine);
    });

    //
    // Full accounts
    //

    engine.persistence.fullAccounts.on('created', (e) => {
        startAccountFullSync(e.key, engine);
    });

    //
    // Wallet v4
    //

    engine.persistence.wallets.on('created', (e) => {
        startWalletV4Sync(e.key, engine);
    });

    // Staking
    engine.persistence.staking.on('created', (e) => {
        startStakingPoolSync(e.key.target, e.key.address, engine);
    });

    //
    // Wallet Plugins
    //

    let startedPlugins = new Set<string>();
    function startPluginSyncIfNeeded(address: Address) {
        let k = address.toFriendly({ testOnly: AppConfig.isTestnet });
        if (startedPlugins.has(k)) {
            return;
        }
        startedPlugins.add(k);
        startPluginSync(address, engine);
    }

    //
    // Wallet sync
    //

    engine.persistence.wallets.item(engine.address).for((w) => {
        for (let p of w.plugins) {
            startPluginSyncIfNeeded(p);
        }
    });

    //
    // Jetton Masters
    //

    let jettonStarted = new Set<string>();
    function startJettonMaster(address: Address) {
        let k = address.toFriendly({ testOnly: AppConfig.isTestnet });
        if (jettonStarted.has(k)) {
            return;
        }
        jettonStarted.add(k);
        startJettonMasterSync(address, engine);
    }
    engine.persistence.knownJettons.item().for((e) => {
        for (let addr of e) {
            startJettonMaster(addr);
        }
    });

    //
    // Jetton Wallets
    //

    let jettonWalletsStarted = new Set<string>();
    function startJettonWallet(address: Address) {
        let k = address.toFriendly({ testOnly: AppConfig.isTestnet });
        if (jettonWalletsStarted.has(k)) {
            return;
        }
        jettonWalletsStarted.add(k);
        startJettonWalletSync(address, engine);
    }
    engine.persistence.knownAccountJettons.item(engine.address).for((e) => {
        for (let addr of e) {
            startJettonWallet(addr);
        }
    });
}