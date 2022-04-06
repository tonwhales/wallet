import React from "react";
import { AppConfig } from "../../AppConfig";
import { getCurrentAddress } from "../../storage/appState";
import { useAccount } from "../../sync/Engine";
import { StakingProductMember } from "./StakingProductMember";
import { StakingProductJoin } from "./StakingProductJoin";

export const StakingProductComponent = React.memo(() => {
    const [account, engine] = useAccount();
    const address = React.useMemo(() => getCurrentAddress().address, []);
    const pool = engine.products.stakingPool.useState();

    if (!pool) {
        return <></>;
    }

    const member = pool
        .members
        .find((m) => {
            return m.address
                .toFriendly({ testOnly: AppConfig.isTestnet }) === address
                    .toFriendly({ testOnly: AppConfig.isTestnet })
        });

    if (member) {
        return <StakingProductMember pool={pool} member={member} />
    }

    return (
        <StakingProductJoin />
    )
})