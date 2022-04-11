import { Address } from "ton";
import { AppConfig } from "../AppConfig";

export const PoolAddress = AppConfig.isTestnet
    ? Address.parse('kQBs7t3uDYae2Ap4686Bl4zGaPKvpbauBnZO_WSop1whaLEs').toFriendly({ testOnly: AppConfig.isTestnet })
    : Address.parse('EQCkR1cGmnsE45N4K0otPl5EnxnRakmGqeJUNua5fkWhales').toFriendly()