import axios from "axios";
import { isLeft } from "fp-ts/lib/Either";
import * as t from 'io-ts';
import { whalesConnectEndpoint } from "../clients";

export type NftItemKind = 'Single' | 'CollectionItem' | 'DnsItem';

export type NftContent = {
    notLoaded?: boolean,
    lottie?: string,
    image?: {
        baseUrl: string
    },
    originalUrl?: string
}

export type NftSale = {
    address: string
    nftOwnerAddress: string
    fullPrice: string
} | {
    address: string,
    nftOwnerAddress: string,
    minBid: string,
    maxBid: string,
    minStep: string,
    minNextBid: string
    end: boolean,
    finishAt: number,
    lastBidAmount?: string,
    lastBidAmountWithFee?: string,
    lastBidAddress?: string,
    lastBidUser?: {
        id: string,
        wallet: string
    }
    lastBidAt?: string
}

export type NftItem = {
    id: string,
    address: string,
    ownerAddress: string,
    attributes: any[],
    name: string,
    collection: {
        name: string,
        id: string,
        description: string
    },
    content: NftContent,
    kind: NftItemKind,
    sale?: NftSale
}

type NftItemConnection = {
    items: NftItem[],
    cursor?: string
}

const nftSalecodec = t.union([
    t.type({
        address: t.string,
        nftOwnerAddress: t.string,
        fullPrice: t.string
    }),
    t.type({
        address: t.string,
        nftOwnerAddress: t.string,
        minBid: t.string,
        maxBid: t.string,
        minStep: t.string,
        minNextBid: t.string,
        end: t.boolean,
        finishAt: t.number,
        lastBidAmount: t.union([t.string, t.undefined, t.null]),
        lastBidAmountWithFee: t.union([t.string, t.undefined, t.null]),
        lastBidAddress: t.union([t.string, t.undefined, t.null]),
        lastBidUser: t.union([t.type({
            id: t.string,
            wallet: t.string
        }), t.undefined, t.null]),
        lastBidAt: t.union([t.undefined, t.string, t.null])
    }),
])

const ntfItemKindCodec = t.keyof({
    Single: null,
    CollectionItem: null,
    DnsItem: null,
});

const nftContentCodec = t.type({
    notLoaded: t.union([t.boolean, t.undefined, t.null]),
    lottie: t.union([t.string, t.undefined, t.null]),
    image: t.union([t.type({ baseUrl: t.string }), t.undefined, t.null]),
    originalUrl: t.union([t.string, t.undefined, t.null]),
});

const nftItemCodec = t.type({
    id: t.string,
    address: t.string,
    ownerAddress: t.string,
    attributes: t.array(t.unknown),
    name: t.string,
    collection: t.type({
        name: t.string,
        id: t.string,
        description: t.string
    }),
    content: nftContentCodec,
    kind: ntfItemKindCodec,
    sale: t.union([nftSalecodec, t.undefined, t.null])
})

const nftItemConnectionCodec = t.type({
    items: t.array(nftItemCodec),
    cursor: t.union([t.string, t.undefined, t.null])
})

export async function fetchNfts(address: string, isTestnet: boolean, first = 10, after?: string) {
    if (isTestnet) {
        return { items: [], cursor: undefined };
    }
    const res = await axios.get(`${whalesConnectEndpoint}/nfts/${address}?first=${first}${after ? `&after=${after}` : ''}`);

    if (res.status === 200) {
        const parsed = nftItemConnectionCodec.decode(res.data.data);
        if (isLeft(parsed)) {
            throw Error('Error fetching nfts')
        }
        return parsed.right as NftItemConnection
    }

    throw Error('Error fetching nfts');
}