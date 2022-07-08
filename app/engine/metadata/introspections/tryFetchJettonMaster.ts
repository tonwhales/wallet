import BN from "bn.js";
import { Address, Slice, TonClient4 } from "ton";
import { warn } from "../../../utils/log";
import { ContentSource, ContractContent, JettonMaster } from '../Metadata';
import { sha256 } from "ton-crypto";

function parseString(slice: Slice) {
    let res = slice.readBuffer(Math.floor(slice.remaining / 8)).toString();
    let rr = slice;
    if (rr.remainingRefs > 0) {
        rr = rr.readRef();
        res += rr.readBuffer(Math.floor(rr.remaining / 8)).toString();
    }
    return res;
}

async function parseJettonOnchainMetadata(
    contentSlice: Slice
  ): Promise<ContractContent> {
    type MetadataKeys = "description" | "name" | "symbol" | "image";
    type Encodings = "utf8" | "ascii";

    const SNAKE_PREFIX = 0x00;
    const jettonOnChainMetadataSpec: Record<MetadataKeys, Encodings> = {
      name: "utf8",
      description: "utf8",
      image: "ascii",
      symbol: "utf8",
    };
  
    // Note that this relies on what is (perhaps) an internal implementation detail:
    // "ton" library dict parser converts: key (provided as buffer) => BN(base10)
    // and upon parsing, it reads it back to a BN(base10)
    // tl;dr if we want to read the map back to a JSON with string keys, we have to convert BN(10) back to hex
    const toKey = (str: string) => new BN(str, "hex").toString(10);
    const KEYLEN = 256;
  
    const dict = contentSlice.readDict(KEYLEN, (s) => {
      let buffer = Buffer.from("");
  
      const sliceToVal = (s: Slice, v: Buffer, isFirst: boolean) => {
        s.toCell().beginParse();
        if (isFirst && s.readUint(8).toNumber() !== SNAKE_PREFIX)
          throw new Error("Only snake format is supported");
  
        v = Buffer.concat([v, s.readRemainingBytes()]);
        if (s.remainingRefs === 1) {
          v = sliceToVal(s.readRef(), v, false);
        }
  
        return v;
      };
  
      return sliceToVal(s.readRef(), buffer, true);
    });
  
    const res:ContractContent = {
        name: null,
        description: null,
        image: null,
        symbol: null
    };
  
    for (const k of ["description", "name", "symbol", "image"] as MetadataKeys[]) {
      const keySha256 = (await sha256(k)).toString("hex");
      const val = dict
        .get(toKey(keySha256))
        ?.toString(jettonOnChainMetadataSpec[k]);
      if (val) res[k] = val;
    }
  
    return res;
}

export async function tryFetchJettonMaster(client: TonClient4, seqno: number, address: Address): Promise<JettonMaster | null> {
    let walletData = await client.runMethod(seqno, address, 'get_jetton_data');
    if (walletData.exitCode !== 0 && walletData.exitCode !== 1) {
        return null;
    }
    if (walletData.result.length !== 5) {
        return null;
    }
    if (walletData.result[0].type !== 'int') {
        return null;
    }
    if (walletData.result[1].type !== 'int') {
        return null;
    }
    if (walletData.result[2].type !== 'slice') {
        return null;
    }
    if (walletData.result[3].type !== 'cell') {
        return null;
    }
    if (walletData.result[4].type !== 'cell') {
        return null;
    }

    // Parsing
    let totalSupply: BN;
    let mintalbe: boolean;
    let owner: Address;
    let content: ContentSource | null;
    try {

        totalSupply = walletData.result[0].value;
        mintalbe = !walletData.result[1].value.eq(new BN(0));
        let _owner = walletData.result[2].cell.beginParse().readAddress();
        if (!_owner) {
            return null;
        }
        owner = _owner;

        let cs = walletData.result[3].cell.beginParse();
        let kind = cs.readUintNumber(8);
        if (kind === 1) {
            let res = parseString(cs);
            content = { type: 'offchain', link: res };
        } else if (kind === 0) {
            content = {
              type: "onchain",
              onchainContent: (await parseJettonOnchainMetadata(cs)),
            };
        } else {
            throw Error('Unsupported');
        }
        // if (content.readUintNumber())
        // console.warn(content.readUintNumber(8));
        // console.warn(parseDict(content, 256, (slice) => slice.readRemaining()));
        // if (!_master) {
        //     return null;
        // }
        // master = _master;
    } catch (e) {
        warn(e);
        return null;
    }

    return {
        totalSupply,
        mintalbe,
        owner,
        content
    };
}