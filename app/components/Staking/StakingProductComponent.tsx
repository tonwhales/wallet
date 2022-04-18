import React from "react";
import { StakingProductMember } from "./StakingProductMember";
import { StakingProductJoin } from "./StakingProductJoin";
import { StakingPoolState } from "../../storage/cache";
import { BN } from "bn.js";

export const StakingProductComponent = React.memo(({ pool }: { pool: StakingPoolState | null }) => {
    const member = pool?.member;
    const showJoin = member?.balance
        .add(member.pendingDeposit)
        .add(member.pendingWithdraw)
        .add(member.withdraw)
        .eq(new BN(0));

    if (!showJoin && member) return <StakingProductMember pool={pool} member={member} />;

    return <StakingProductJoin loading={!pool} />;
})