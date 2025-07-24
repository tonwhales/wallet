import { Address } from "@ton/core";
import { queryClient } from "../clients";

export async function onHoldersInvalidate(account: string, isTestnet: boolean) {
    let address = Address.parse(account).toString({ testOnly: isTestnet });
    await queryClient.invalidateQueries({
        predicate: (query) => {
            const queryKey = query.queryKey as string[];
            if (queryKey[0] === 'holders' || queryKey[0] === 'holders-otp') {
                const isAccountInQuery = queryKey[1] === address;

                if (queryKey[2] === 'invite') {
                    return false;
                }

                return isAccountInQuery;
            }
            return false;
        },
    });
}