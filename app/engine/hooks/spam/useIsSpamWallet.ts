import { useServerConfig } from '../useServerConfig';

export function useIsSpamWallet(address: string): boolean {
    const config = useServerConfig().data;
    return config?.wallets.spam?.findIndex((addr) => addr === address) !== -1;
}