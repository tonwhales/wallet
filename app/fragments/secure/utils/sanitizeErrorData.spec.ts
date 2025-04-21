import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { sanitizeErrorData } from "./sanitizeErrorData";

const tests: { name: string; input: string; expected: string }[] = [
    {
        name: "no secrets",
        input: "Prefix text Program consumed: 4374 of 200000 compute units Suffix text",
        expected: "Prefix text Program consumed: 4374 of 200000 compute units Suffix text",
    },
    {
        name: "hex string",
        input: "Error occurred (key:0x1234567890abcdef1234567890ABcdef) during execution",
        expected: "Error occurred (key:[hex_string_data]) during execution",
    },
    {
        name: "hex string",
        input: "Transaction failed (key:0x1234567890abcdef1234567890ABcdef4567890abcdef) at step 5",
        expected: "Transaction failed (key:[hex_string_data]) at step 5",
    },
    {
        name: "hex string",
        input: "Invalid state (key:1234567890abcdef1234567890ABcdef4567890abcdef) detected",
        expected: "Invalid state (key:[hex_string_data]) detected",
    },
    {
        name: "hex string",
        input: "MAC address (key:12:34:56:78:90:ab:cd:ef:12:34:56:78:90:AB:cd:ef:45:67:89:0a:bc:de:aa) not found",
        expected: "MAC address (key:[hex_string_data]) not found",
    },
    {
        name: "hex string",
        input: "UUID found (key:12-34-56-78-90-ab-cd-ef-12-34-56-78-90-AB-cd-ef-45-67-89-0a-bc-de-aa) in database",
        expected: "UUID found (key:[hex_string_data]) in database",
    },
    {
        name: "hex string",
        input: "Hash value (key:12 34 56 78 90 AB cd ef 12 34 56) was incorrect",
        expected: "Hash value (key:[hex_string_data]) was incorrect",
    },
    {
        name: "no secrets, not hex string",
        input: "This should not match (not_key:dead beAF dead beaf dead beaf dead beaf dead beaf) as hex pattern",
        expected: "This should not match (not_key:dead beAF dead beaf dead beaf dead beaf dead beaf) as hex pattern",
    },
    {
        name: "multiple hex strings",
        input: "First key (key1:0x1234567890abcdef1234567890abcdef) and second key (key2:12:34:56:78:90:ab:cd:ef:12:34:56:78:90:AB:cd:ef:45:67:89:0a:bc:de:aa) in same message",
        expected: "First key (key1:[hex_string_data]) and second key (key2:[hex_string_data]) in same message",
    },
    {
        name: "base58 string",
        input: `Found token (key:${bs58.encode(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]))}) in wallet`,
        expected: "Found token (key:[base58_string_data]) in wallet",
    },
    {
        name: "Uint8Array.toString()",
        input: (() => {
            const arr = new Uint8Array(64);
            for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
            return `Binary data (key:${arr.toString()}) was processed`;
        })(),
        expected: "Binary data (key:[uint8array_object]) was processed",
    },
    {
        name: "Uint8Array.toString()",
        input: (() => {
            const arr = new Uint8Array(31);
            for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
            return `Short array (key:${arr.toString()}) detected`;
        })(),
        expected: "Short array (key:[uint8array_object]) detected",
    },
    {
        name: "Uint8Array.toString()",
        input: (() => {
            const arr = new Uint8Array(100);
            for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
            return `Long array (key:${arr.toString()}) exceeded limit`;
        })(),
        expected: "Long array (key:[uint8array_object]) exceeded limit",
    },
    {
        name: "hex-like text that shouldn't match",
        input: "This text contains deadbeef cafe1234 but not as a proper pattern",
        expected: "This text contains deadbeef cafe1234 but not as a proper pattern",
    },
    {
        name: "hex-like text mixed with valid pattern",
        input: "Random deadbeef and valid hex (key:0xdeadbeef12345678deadbeef12345678) should be handled differently",
        expected: "Random deadbeef and valid hex (key:[hex_string_data]) should be handled differently",
    },
];

describe('sanitizeErrorData', () => {
    tests.forEach((test) => {
        it(`should return ${test.expected} for ${test.name}`, () => {
            expect(sanitizeErrorData(test.input)).toBe(test.expected);
        });
    });
});