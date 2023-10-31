// Word search trie impl from https://en.wikipedia.org/wiki/Trie

import { wordlist } from '@ton/crypto/dist/mnemonic/wordlist';

export class TrieNode {
    key: any;
    parent: any | null;
    children: {
        [key: string]: TrieNode
    };
    end: boolean

    constructor(key: any) {
        this.key = key;
        this.parent = null;
        this.children = {};
        this.end = false;
    }

    getWord() {
        var output = [];
        var node = this;

        while (node !== null) {
            output.unshift(node.key);
            node = node.parent;
        }

        return output.join('');
    }
}

export class Trie {
    root: TrieNode;
    allWords: Set<string>;

    constructor() {
        this.root = new TrieNode(null);
        this.allWords = new Set();
    }

    insert(word: string) {
        var node = this.root;
        this.allWords.add(word);

        // loop trough every character in the word
        for (var i = 0; i < word.length; i++) {
            // check if character node exists
            if (!node.children[word[i]]) {
                // create if doesnt
                node.children[word[i]] = new TrieNode(word[i]);

                // assign parent to child
                node.children[word[i]].parent = node;
            }

            // go to the next layer
            node = node.children[word[i]];

            // check if it's the last word
            if (i == word.length - 1) { node.end = true; }
        }
    }

    contains(word: string) {
        return this.allWords.has(word);
        // var node = this.root;

        // // for every char in the word
        // for (var i = 0; i < word.length; i++) {
        //     // check if character node exists
        //     if (node.children[word[i]]) {
        //         // if it exists, go to the next layer
        //         node = node.children[word[i]];
        //     } else {
        //         // not a valid word
        //         return false;
        //     }
        // }
        // return node.end;
    };

    find(prefix: string) {
        var node = this.root;
        var output: string[] = [];

        // for every character in the prefix
        for (var i = 0; i < prefix.length; i++) {
            // check if prefix has words
            if (node.children[prefix[i]]) {
                node = node.children[prefix[i]];
            } else {
                return output;
            }
        }

        // recursively words in the node
        findAllWords(node, output);

        // Sort output to let complete match word be present within suggestions
        output = output.sort();

        return output;
    };

}

export function findAllWords(node: TrieNode, arr: string[]) {
    // if node is at a word, add to output
    if (node.end) {
        arr.unshift(node.getWord());
    }

    // iterate through all children & call recursive findAllWords
    for (var child in node.children) {
        findAllWords(node.children[child], arr);
    }
}

export const WordsListTrie = () => {
    const trie = new Trie();
    wordlist.forEach((e) => trie.insert(e));
    return trie;
};