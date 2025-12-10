export interface AIMarkupElement {
    type: string;
    attributes: Record<string, string>;
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
