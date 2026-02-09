import { useCallback, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Queries } from '../../queries';
import { writePublicProfileWithRetry, PublicProfileValues } from '../../api/publicProfile';
import { useSelectedAccount } from '../appstate/useSelectedAccount';
import { useNetwork } from '../network/useNetwork';
import { solanaAddressFromPublicKey } from '../../../utils/solana/address';
import { useKeysAuth } from '../../../components/secure/AuthWalletKeys';
import { avatarColors } from '../../../components/avatar/Avatar';

export interface WritePublicProfileParams {
    avatar: number;
    colorIndex: number;
}

export interface UseWritePublicProfileResult {
    write: (params: WritePublicProfileParams) => Promise<void>;
    isLoading: boolean;
    error: Error | null;
    isSuccess: boolean;
}

/**
 * Hook to write public profile with both TON and Solana addresses
 * Requires authentication to sign address proofs
 */
export function useWritePublicProfile(): UseWritePublicProfileResult {
    const account = useSelectedAccount();
    const { isTestnet } = useNetwork();
    const authContext = useKeysAuth();
    const queryClient = useQueryClient();
    const [isSuccess, setIsSuccess] = useState(false);

    const mutation = useMutation({
        mutationFn: async (params: WritePublicProfileParams) => {
            if (!account) {
                throw new Error('No account selected');
            }

            // Get wallet keys through authentication
            const walletKeys = await authContext.authenticate({
                cancelable: true
            });

            // Derive addresses
            const tonAddress = account.address.toString({ testOnly: isTestnet, bounceable: false });
            const solanaAddress = solanaAddressFromPublicKey(account.publicKey).toString();

            // Prepare profile values
            const values: PublicProfileValues = {
                avatar: params.avatar,
                backgroundColor: avatarColors[params.colorIndex] ?? avatarColors[0]
            };

            // Write profile with retry on conflict
            const result = await writePublicProfileWithRetry({
                utilityKey: account.utilityKey,
                isTestnet,
                tonAddress,
                solanaAddress,
                walletPublicKey: walletKeys.keyPair.publicKey as Buffer,
                walletSecretKey: walletKeys.keyPair.secretKey as Buffer,
                values
            });

            return result;
        },
        onSuccess: (_, params) => {
            if (!account) return;

            setIsSuccess(true);

            // Invalidate public profile queries for both addresses
            const tonAddress = account.address.toString({ testOnly: isTestnet, bounceable: false });
            const solanaAddress = solanaAddressFromPublicKey(account.publicKey).toString();

            queryClient.invalidateQueries({ queryKey: Queries.PublicProfile(tonAddress) });
            queryClient.invalidateQueries({ queryKey: Queries.PublicProfile(solanaAddress) });
        },
        onError: () => {
            setIsSuccess(false);
        }
    });

    const write = useCallback(async (params: WritePublicProfileParams) => {
        setIsSuccess(false);
        await mutation.mutateAsync(params);
    }, [mutation]);

    return {
        write,
        isLoading: mutation.isPending,
        error: mutation.error as Error | null,
        isSuccess
    };
}

