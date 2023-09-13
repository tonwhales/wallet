import { createContext, memo, useContext, useMemo } from "react"
import { SharedPersistence } from "../SharedPersistence"
import { sharedStoragePersistence } from "../../storage/storage";
import { useAppConfig } from "../../utils/AppConfigContext";
import { useRecoilCallback } from "recoil";

const SharedPersistenceContext = createContext<SharedPersistence | null>(null);

export const SharedPersistenceLoader = memo(({ children }: { children: any, }) => {
    const { AppConfig } = useAppConfig();
    const recoilUpdater = useRecoilCallback<[any, any], any>(({ set }) => (node, value) => set(node, value));
    const sP = useMemo(() => new SharedPersistence(sharedStoragePersistence, { updater: recoilUpdater }, AppConfig.isTestnet), [AppConfig.isTestnet]);

    return (
        <SharedPersistenceContext.Provider value={sP}>
            {children}
        </SharedPersistenceContext.Provider>
    );
});

export function useSharedPersistence() {
    const sP = useContext(SharedPersistenceContext);
    if (!sP) {
        throw new Error('SharedPersistence not loaded');
    }
    return sP;
}