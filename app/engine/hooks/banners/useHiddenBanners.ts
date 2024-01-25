import { atom, atomFamily, selectorFamily, useRecoilState, useRecoilValue } from "recoil";
import { storage } from "../../../storage/storage";
import { z } from "zod";

const hinddenBannersCodec = z.array(z.string());

function getHiddenBanners() {
    const stored = storage.getString('hiddenBanners');
    if (!stored) {
        return [];
    }

    try {
        const parsed = hinddenBannersCodec.safeParse(JSON.parse(stored));
        if (!parsed.success) {
            return [];
        }

        return parsed.data;
    } catch {
        return [];
    }
}

function setHiddenBanners(banners: string[]) {
    storage.set('hiddenBanners', JSON.stringify(banners));
}

const hiddenBannersState = atom({
    key: 'products/hiddenBanners',
    default: getHiddenBanners(),
    effects: [({ onSet }) => {
        onSet((newValue) => {
            setHiddenBanners(newValue);
        })
    }]
});

export function useHiddenBanners() {
    return useRecoilValue(hiddenBannersState);
}

export function useMarkBannerHidden() {
    const [hidden, setHidden] = useRecoilState(hiddenBannersState);

    return (id: string) => {
        if (hidden.includes(id)) {
            return;
        }

        setHidden([...hidden, id]);
    }
}