import {
    AIMarkupComponent,
    ParsedAIMessage,
    ParsedAIMessageWithOrder,
    ContentElement,
    StickerElement,
    ButtonElement,
    NavElement,
    TxElement,
    ChipElement,
    ChipsElement,
    LoaderElement,
    EventCategory,
    EventMerchantCategory,
} from './markup-types';

export function parseAIMarkup(message: string): ParsedAIMessage {
    const components: AIMarkupComponent[] = [];
    let cleanText = message;
    let hasMarkup = false;

    const selfClosingTagRegex = /<(\w+)\s*([^>]*?)\/>/g;
    const pairedTagRegex = /<(\w+)\s*([^>]*)>(.*?)<\/\1>/gs;

    let match;
    while ((match = pairedTagRegex.exec(message)) !== null) {
        const [fullMatch, tagName, attributesStr, innerContent] = match;

        if (tagName === 'chips') {
            hasMarkup = true;
            const chips = parseChipsElement(innerContent);
            if (chips) {
                components.push(chips);
                cleanText = cleanText.replace(fullMatch, '').trim();
            }
        }
    }

    while ((match = selfClosingTagRegex.exec(message)) !== null) {
        const [fullMatch, tagName, attributesStr] = match;
        const attributes = attributesStr ? parseAttributes(attributesStr) : {};

        hasMarkup = true;

        switch (tagName) {
            case 'sticker':
                components.push(createStickerElement(attributes));
                break;
            case 'button':
                components.push(createButtonElement(attributes));
                break;
            case 'nav':
                components.push(createNavElement(attributes));
                break;
            case 'tx':
                components.push(createTxElement(attributes));
                break;
            case 'loader':
                components.push(createLoaderElement());
                break;
        }

        cleanText = cleanText.replace(fullMatch, '').trim();
    }

    cleanText = cleanText.replace(/\s+/g, ' ').trim();

    return {
        text: cleanText,
        components,
        hasMarkup,
    };
}

function parseAttributes(attributesStr: string): Record<string, string> {
    const attributes: Record<string, string> = {};

    const attrRegex = /(\w+)=(?:"([^"]*)"|'([^']*)')/g;

    let match;
    while ((match = attrRegex.exec(attributesStr)) !== null) {
        const [, name, doubleQuotedValue, singleQuotedValue] = match;
        const value = doubleQuotedValue !== undefined ? doubleQuotedValue : singleQuotedValue;
        attributes[name] = value;
    }

    return attributes;
}

function createStickerElement(attributes: Record<string, string>): StickerElement {
    return {
        type: 'sticker',
        attributes: {
            name: attributes.name || '',
            loop: attributes.loop as 'true' | 'false' | undefined,
            autoplay: attributes.autoplay as 'true' | 'false' | undefined,
        },
    };
}

function createButtonElement(attributes: Record<string, string>): ButtonElement {
    return {
        type: 'button',
        attributes: {
            url: attributes.url || '',
            title: attributes.title || '',
            icon: attributes.icon as 'external' | 'download' | 'link' | undefined,
        },
    };
}

function createNavElement(attributes: Record<string, string>): NavElement {
    return {
        type: 'nav',
        attributes: {
            route: attributes.route || '',
            title: attributes.title || '',
            params: attributes.params,
            icon: attributes.icon,
        },
    };
}

/**
 * Создает элемент транзакции
 */
function createTxElement(attributes: Record<string, string>): TxElement {
    let date = undefined;

    console.log({ date: new Date('2025-12-08T02:53:24') });

    if (attributes.date) {
        try {
            date = new Date(attributes.date).getTime();
        } catch (error) {
            console.warn('Failed to parse date:', error);
        }
    }

    return {
        type: 'tx',
        attributes: {
            type: (attributes.type as 'solana' | 'ton' | 'holders') || 'ton',
            hash: attributes.hash,
            lt: attributes.lt,
            address: attributes.address,
            id: attributes.id,
            details: attributes.details,
            title: attributes.title,
            amount: attributes.amount,
            currency: attributes.currency,
            category: attributes.category as EventCategory,
            merchant: attributes.merchant,
            merchantLogo: attributes.merchantLogo,
            merchantCountry: attributes.merchantCountry,
            merchantCategory: attributes.merchantCategory.toLowerCase() as EventMerchantCategory,
            date,
        },
    };
}

function createLoaderElement(): LoaderElement {
    return {
        type: 'loader',
        attributes: {},
    };
}

function parseChipsElement(innerContent: string): ChipsElement | null {
    const chipRegex = /<chip\s+([^>]*?)\/>/g;
    const chips: ChipElement[] = [];

    let match;
    while ((match = chipRegex.exec(innerContent)) !== null) {
        const [, attributesStr] = match;
        const attributes = parseAttributes(attributesStr);

        chips.push({
            type: 'chip',
            attributes: {
                value: attributes.value || '',
                title: attributes.title || '',
            },
        });
    }

    if (chips.length === 0) {
        return null;
    }

    return {
        type: 'chips',
        attributes: {},
        children: chips,
    };
}

export function extractPlainText(message: string): string {
    const parsed = parseAIMarkup(message);
    return parsed.text;
}

export function hasMarkup(message: string): boolean {
    return /<\w+\s+[^>]*?\/?>/.test(message);
}

export interface TextSegment {
    text: string;
    bold?: boolean;
    heading?: 1 | 2 | 3;
    isNewLine?: boolean;
}

export function parseTextFormatting(text: string): TextSegment[] {
    const segments: TextSegment[] = [];

    const lines = text.split('\n');

    lines.forEach((line, lineIndex) => {
        const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);

        if (headingMatch) {
            const level = headingMatch[1].length as 1 | 2 | 3;
            const headingText = headingMatch[2];

            segments.push({
                text: headingText,
                heading: level,
                isNewLine: true,
            });
        } else {
            // Парсим жирный текст в обычной строке
            const boldRegex = /\*\*([^*]+)\*\*/g;
            let lastIndex = 0;
            let match;
            let hasContent = false;

            while ((match = boldRegex.exec(line)) !== null) {
                if (match.index > lastIndex) {
                    const normalText = line.substring(lastIndex, match.index);
                    if (normalText) {
                        segments.push({
                            text: normalText,
                            bold: false,
                            isNewLine: !hasContent,
                        });
                        hasContent = true;
                    }
                }

                segments.push({
                    text: match[1],
                    bold: true,
                    isNewLine: !hasContent,
                });
                hasContent = true;

                lastIndex = match.index + match[0].length;
            }

            if (lastIndex < line.length) {
                const remainingText = line.substring(lastIndex);
                if (remainingText) {
                    segments.push({
                        text: remainingText,
                        bold: false,
                        isNewLine: !hasContent,
                    });
                    hasContent = true;
                }
            }

            if (!hasContent && line.trim() === '') {
                segments.push({
                    text: '',
                    isNewLine: true,
                });
            }
        }

        if (lineIndex < lines.length - 1) {
            segments.push({
                text: '\n',
                isNewLine: false,
            });
        }
    });

    if (segments.length === 0) {
        segments.push({ text, bold: false });
    }

    return segments;
}

export function parseAIMarkupWithOrder(message: string): ParsedAIMessageWithOrder {
    const content: ContentElement[] = [];
    const inlineComponents: AIMarkupComponent[] = [];
    const trailingComponents: AIMarkupComponent[] = [];
    let hasMarkup = false;

    interface TagMatch {
        index: number;
        length: number;
        component: AIMarkupComponent;
        type: string;
    }

    const matches: TagMatch[] = [];

    const selfClosingTagRegex = /<(\w+)\s*([^>]*?)\/>/g;
    let match;

    while ((match = selfClosingTagRegex.exec(message)) !== null) {
        const [fullMatch, tagName, attributesStr] = match;
        const attributes = attributesStr ? parseAttributes(attributesStr) : {};

        let component: AIMarkupComponent | null = null;

        switch (tagName) {
            case 'sticker':
                component = createStickerElement(attributes);
                break;
            case 'button':
                component = createButtonElement(attributes);
                break;
            case 'nav':
                component = createNavElement(attributes);
                break;
            case 'tx':
                component = createTxElement(attributes);
                break;
            case 'loader':
                component = createLoaderElement();
                break;
        }

        if (component) {
            hasMarkup = true;
            matches.push({
                index: match.index,
                length: fullMatch.length,
                component,
                type: tagName,
            });
        }
    }

    const pairedTagRegex = /<(\w+)\s*([^>]*)>(.*?)<\/\1>/gs;
    while ((match = pairedTagRegex.exec(message)) !== null) {
        const [fullMatch, tagName, , innerContent] = match;

        if (tagName === 'chips') {
            const chips = parseChipsElement(innerContent);
            if (chips) {
                hasMarkup = true;
                matches.push({
                    index: match.index,
                    length: fullMatch.length,
                    component: chips,
                    type: tagName,
                });
            }
        }
    }

    matches.sort((a, b) => a.index - b.index);

    let lastIndex = 0;

    for (const tagMatch of matches) {
        if (tagMatch.index > lastIndex) {
            const textBefore = message.substring(lastIndex, tagMatch.index).trim();
            if (textBefore) {
                content.push({ type: 'text', content: textBefore });
            }
        }

        if (tagMatch.type === 'tx' || tagMatch.type === 'sticker' || tagMatch.type === 'nav' || tagMatch.type === 'loader') {
            content.push({ type: 'component', component: tagMatch.component });
            inlineComponents.push(tagMatch.component);
        } else {
            trailingComponents.push(tagMatch.component);
        }

        lastIndex = tagMatch.index + tagMatch.length;
    }

    if (lastIndex < message.length) {
        const textAfter = message.substring(lastIndex).trim();
        if (textAfter) {
            content.push({ type: 'text', content: textAfter });
        }
    }

    if (content.length === 0 && !hasMarkup) {
        content.push({ type: 'text', content: message });
    }

    return {
        content,
        inlineComponents,
        trailingComponents,
        hasMarkup,
    };
}

