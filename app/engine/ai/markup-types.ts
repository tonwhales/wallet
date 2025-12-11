export interface AIMarkupElement {
    type: string;
    attributes: Record<string, string | number>;
    children?: AIMarkupElement[];
    text?: string;
}

export interface AIMarkupMessage {
    version: string;
    elements: AIMarkupElement[];
    rawText: string;
}

export interface StickerElement extends AIMarkupElement {
    type: 'sticker';
    attributes: {
        name: string;
        loop?: 'true' | 'false';
        autoplay?: 'true' | 'false';
    };
}

export interface ButtonElement extends AIMarkupElement {
    type: 'button';
    attributes: {
        url: string;
        title: string;
        icon?: 'external' | 'download' | 'link';
    };
}

export interface NavElement extends AIMarkupElement {
    type: 'nav';
    attributes: {
        route: string;
        title: string;
        params?: string; // JSON
        icon?: string;
    };
}

export enum EventCategory {
    PURCHASE = 'PURCHASE',
    PURCHASE_FAILED = 'PURCHASE_FAILED',
    PURCHASE_REVERSAL = 'PURCHASE_REVERSAL',
    DEPOSIT = 'DEPOSIT',
    WITHDRAWAL = 'WITHDRAWAL',
    CARD_MANAGEMENT = 'CARD_MANAGEMENT',
    ACCOUNT_MANAGEMENT = 'ACCOUNT_MANAGEMENT',
    OTHER = 'OTHER',
}

export type EventMerchantCategory =
    | 'culture'
    | 'entertainment'
    | 'finance'
    | 'groceries'
    | 'health_and_beauty'
    | 'home_and_utilities'
    | 'professional_services'
    | 'public_administrations'
    | 'restaurants'
    | 'shopping'
    | 'software'
    | 'transport'
    | 'travel'
    | 'withdrawal'
    | 'purchase_reversal'
    | 'deposit'
    | 'other';

export interface TxElement extends AIMarkupElement {
    type: 'tx';
    attributes: {
        type: 'solana' | 'ton' | 'holders';
        hash?: string;
        lt?: string;
        address?: string;
        id?: string;
        details?: string;
        title?: string;
        amount?: string;
        currency?: string;
        category?: EventCategory;
        merchant?: string;
        merchantLogo?: string;
        merchantCountry?: string;
        merchantCategory?: EventMerchantCategory;
        date?: number;
    };
}

export interface ChipElement extends AIMarkupElement {
    type: 'chip';
    attributes: {
        value: string;
        title: string;
    };
}

export interface ChipsElement extends AIMarkupElement {
    type: 'chips';
    children: ChipElement[];
}

export interface LoaderElement extends AIMarkupElement {
    type: 'loader';
    attributes: {};
}

export type AIMarkupComponent =
    | StickerElement
    | ButtonElement
    | NavElement
    | TxElement
    | ChipsElement
    | LoaderElement;

export interface ParsedAIMessage {
    text: string;
    components: AIMarkupComponent[];
    hasMarkup: boolean;
}

export type ContentElement =
    | { type: 'text'; content: string }
    | { type: 'component'; component: AIMarkupComponent };

export interface ParsedAIMessageWithOrder {
    content: ContentElement[];
    inlineComponents: AIMarkupComponent[];
    trailingComponents: AIMarkupComponent[];
    hasMarkup: boolean;
}

export interface AIMarkupHandlers {
    onStickerPress?: (name: string) => void;
    onButtonPress?: (url: string, title: string) => void;
    onNavPress?: (route: string, params?: any) => void;
    onTxPress?: (txData: {
        type: 'solana' | 'ton' | 'holders';
        hash?: string;
        lt?: string;
        address?: string;
        id?: string;
        details?: string;
    }) => void;
    onChipPress?: (value: string, title: string) => void;
}
