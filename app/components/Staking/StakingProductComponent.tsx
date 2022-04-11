import React from "react";
import { useAccount } from "../../sync/Engine";
import { StakingProductMember } from "./StakingProductMember";
import { StakingProductJoin } from "./StakingProductJoin";
import { StakingPoolState } from "../../storage/cache";

export const StakingProductComponent = React.memo(({ pool }: { pool: StakingPoolState | null }) => {

    if (!pool) {
        return <></>;
    }

    const member = pool.member

    if (member) {
        return <StakingProductMember pool={pool} member={member} />
    }

    return (
        <StakingProductJoin />
    )
})