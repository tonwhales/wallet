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
import { startHintsTxSync } from "./startHintsTxSync";
import { startHintSync } from "./startHintSync";
import { startFileSync } from "./startFileSync";
import { requestHintsIfNeeded } from "./ops";
import { startConfigSync } from "./startConfigSync";
import { startServerConfigSync } from "./startServerConfigSync";
import { resolveLink } from "../../utils/resolveLink";

export function startSync(engine: Engine) {

    //
    // Config
    //

    startConfigSync(engine);

    //
    // Lite accounts
    //

    engine.persistence.liteAccounts.each((key) => {
        startAccountLiteSync(key, engine);
    });

    //
    // Full accounts
    //

    engine.persistence.fullAccounts.each((key) => {
        startAccountFullSync(key, engine);
    });

    //
    // Wallet v4
    //

    engine.persistence.wallets.each((key) => {
        startWalletV4Sync(key, engine);
    });

    // Staking
    engine.persistence.staking.each((key) => {
        startStakingPoolSync(key.target, key.address, engine);
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

    //
    // Hints
    //

    startHintsSync(engine.address, engine);
    startHintsTxSync(engine.address, engine);
    let hintsStarted = new Set<string>();
    function startHints(address: Address) {
        let k = address.toFriendly({ testOnly: AppConfig.isTestnet });
        if (hintsStarted.has(k)) {
            return;
        }
        hintsStarted.add(k);
        startHintSync(address, engine);
    }
    engine.persistence.accountHints.item(engine.address).for((e) => {
        for (let addr of e) {
            startHints(addr);
        }
    });

    //
    // Downloads
    //

    engine.persistence.downloads.each((file) => {
        startFileSync(file, engine);
    });

    //
    // Auto-query on metadata fetching
    //

    engine.persistence.metadata.each((address) => {
        requestHintsIfNeeded(address, null, engine);
    });

    // 
    // Server config for restrict_send and spam wallets
    // 
    startServerConfigSync(engine);
}