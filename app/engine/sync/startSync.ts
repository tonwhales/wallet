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
import { requestAllHintsIfNeeded } from "./ops";
import { startConfigSync } from "./startConfigSync";
import { startServerConfigSync } from "./startServerConfigSync";
import { startAppMetadataSync } from "./startAppMetadataSync";
import { startWalletConfigSync } from "./startWalletConfigSync";
import { startApySync } from "./startApySync";
import { startAccountBalanceChartSync } from "./startAccountBalanceChartSync";
import { createTracer } from '../../utils/tracer';
import { startLockupWalletSync } from "./startLockupWalletSync";

export function startSync(engine: Engine) {
    const tracer = createTracer();

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
    tracer.label('lite accounts');

    //
    // Full accounts
    //

    engine.persistence.fullAccounts.each((key) => {
        startAccountFullSync(key, engine);
    });
    tracer.label('full accounts');

    //
    // Wallet v4
    //

    engine.persistence.wallets.each((key) => {
        startWalletV4Sync(key, engine);
    });
    tracer.label('wallet v4');

    // Staking
    engine.persistence.staking.each((key) => {
        startStakingPoolSync(key.target, key.address, engine);
    });
    tracer.label('staking');

    // APY
    startApySync(engine);
    tracer.label('APY');

    // Account Balance
    startAccountBalanceChartSync(engine);
    tracer.label('balance chart');

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
    tracer.label('plugins');

    //
    // Wallet sync
    //

    engine.persistence.wallets.item(engine.address).for((w) => {
        for (let p of w.plugins) {
            startPluginSyncIfNeeded(p);
        }
    });
    tracer.label('wallet plugins');

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
    tracer.label('jetton masters');

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
    tracer.label('jetton wallets');

    // 
    // Lockup Wallets
    // 
    let lockupWalletsStarted = new Set<string>();
    function startLockupWallet(address: Address) {
        let k = address.toFriendly({ testOnly: AppConfig.isTestnet });
        if (lockupWalletsStarted.has(k)) {
            return;
        }
        lockupWalletsStarted.add(k);
        startLockupWalletSync(address, engine);
    }
    engine.persistence.knownAccountLockups.item(engine.address).for((e) => {
        for (let addr of e) {
            startLockupWallet(addr);
        }
    });
    tracer.label('lockup wallets');

    //
    // Hints
    //

    startHintsSync(engine.address, engine);
    tracer.label('hints');

    startHintsTxSync(engine.address, engine);
    tracer.label('hints tx sync');

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
    tracer.label('hints for');

    //
    // Downloads
    //

    engine.persistence.downloads.each((file) => {
        startFileSync(file, engine);
    });
    tracer.label('downloads');

    //
    // Auto-query on metadata fetching
    //

    let metadataAddresses: Address[] = [];
    engine.persistence.metadata.each((address) => {
        metadataAddresses.push(address);
    });
    requestAllHintsIfNeeded(metadataAddresses, null, engine);
    tracer.label('metadata hints');

    // 
    // Server config for restrict_send and spam wallets
    // 

    startServerConfigSync(engine);
    tracer.label('server config');

    //
    // Wallet Config
    //

    startWalletConfigSync(engine);
    tracer.label('wallet config');

    //
    // App Metadata
    //

    engine.persistence.dApps.each((url) => {
        startAppMetadataSync(url, engine);
    });
    tracer.label('app metadata');


    tracer.report();
}