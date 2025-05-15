import { Address } from "@ton/core";
import { Queries } from "../../queries";
import { useIsFetching } from '@tanstack/react-query';
import { queryClient } from "../../clients";
import { useEffect, useState } from "react";
import { useEthena, useNetwork } from "..";

export function useRefreshLiquidUSDeStaking(account: Address | null | undefined) {
    const { isTestnet } = useNetwork();
    const { tsMinter } = useEthena();

    const usdeMemberKey = Queries.StakingLiquidUSDeMember(
        tsMinter.toString({ testOnly: isTestnet }),
        account!.toString({ testOnly: isTestnet })
    );

    const hintsFullKey = Queries.HintsFull(account!.toString({ testOnly: isTestnet }));

    const isFetchingMember = useIsFetching(usdeMemberKey);
    const isFetchingHints = useIsFetching(hintsFullKey);

    const isFetching = isFetchingMember + isFetchingHints;
    const [isRefetching, setIsRefetching] = useState(false);

    const refetch = async () => {
        setIsRefetching(true);
        await queryClient.invalidateQueries({ queryKey: usdeMemberKey });
        await queryClient.invalidateQueries({ queryKey: hintsFullKey });
    };

    useEffect(() => {
        if (isFetching <= 0) {
            setIsRefetching(false);
        }
    }, [isFetching]);

    return {
        isRefetching,
        refetch
    };
}