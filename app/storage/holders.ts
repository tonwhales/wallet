import { removeProvisioningCredentials } from "../engine/holders/updateProvisioningCredentials";
import { storage } from "./storage";

// Migrate holders token from ton-x to ton-connect
// user will be prompted to re-enroll
const migrationKey = 'holders-token-ton-connect';
function migrateHoldersToken(addressString: string) {
    const key = `${migrationKey}-${addressString}`;
    if (storage.getBoolean(key)) {
        return false;
    }
    deleteHoldersToken(addressString);
    storage.set(key, true);
    return true;
}

// Migrate holders token from ton to ton+solana
// user will be prompted to re-enroll
const solanaMigrationKey = 'holders-token-solana';
function migrateHoldersSolanaToken(address: string) {
    const key = `${solanaMigrationKey}-${address}`;
    if (storage.getBoolean(key)) {
        return false;
    }
    deleteHoldersToken(address);
    storage.set(key, true);
    return true;
}

const holdersTokenMigrationKey_0 = 'holders-token-migration-0';
function migrateHoldersToken_0(address: string) {
    const key = `${holdersTokenMigrationKey_0}-${address}`;
    if (storage.getBoolean(key)) {
        return false;
    }
    deleteHoldersToken(address);
    storage.set(key, true);
    return true;
}

export function deleteHoldersToken(address: string) {
    // clean up provisioning credentials cache for this address
    removeProvisioningCredentials(address);
    storage.delete(`holders-jwt-${address}`);
}

export function setHoldersToken(address: string, token: string) {
    storage.set(`holders-jwt-${address}`, token);
}

export function getHoldersToken(address: string) {
    // Migate to ton-connect
    if (migrateHoldersToken(address)) {
        return null;
    }

    // Migate to solana
    if (migrateHoldersSolanaToken(address)) {
        return null;
    }

    // Migrate to new token session
    if (migrateHoldersToken_0(address)) {
        return null;
    }

    return storage.getString(`holders-jwt-${address}`);
}