import axios from "axios";
import HTMLParser from 'fast-html-parser';
import { warn } from "../log";

async function fetchPage(url: string) {
    return axios.get(url);
}

export type MetaTags = { [key: string]: string };

export async function getMetaTags(link: string) {
    const metaTags: MetaTags = {};

    try {
        const pageRes = await fetchPage(link);
        const root = HTMLParser.parse(pageRes.data);
        root.querySelectorAll('meta').forEach((item) => {
            metaTags[`${item.attributes['name']}`] = item.attributes['content'];
        });
    } catch (e) {
        warn(`getMetaTags error: ${e}`);
    }

    return metaTags;
}