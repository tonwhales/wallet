import { Platform } from "react-native";
import { storeScreenProtectorState } from "../engine/state/screenProtector";
import { toggleSecureScreen } from "../modules/SecureScreen";
import { storage } from "../storage/storage";

function migrateFlagSecureModule() {
    if (Platform.OS === 'android') {
        storeScreenProtectorState(false);
        toggleSecureScreen(false);
    }
}

const migrations = [
    {
        key: 'flag-secure-module',
        platforms: ['android'],
        run: migrateFlagSecureModule,
    }
]

export function runMigrations() {
    for (const migration of migrations) {
        console.log(`Running migration ${migration.key} on platform ${Platform.OS}`);
        const platformCheck = migration.platforms.includes(Platform.OS);
        const isAlreadyRun = storage.getBoolean(migration.key);

        console.log(`Platform check: ${platformCheck}, isAlreadyRun: ${isAlreadyRun}`);

        if (platformCheck && !isAlreadyRun) {
            migration.run();
            storage.set(migration.key, true);
        }
    }

    console.log('all migrations done');
}