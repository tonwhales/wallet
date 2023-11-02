import { useCloudValue } from "../cloud/useCloudValue";

const version = 1;

export type AddressContact = { name: string, fields?: { key: string, value: string | null | undefined }[] | null };

export type AddressBook = {
    denyList: { [key: string]: { reason: string | null } };
    contacts: { [key: string]: AddressContact };
    fields: { [key: string]: string };
}

export function useAddressBook() {
    return useCloudValue<AddressBook>(`addressbook-v${version}`, (src) => { src.denyList = {}; src.contacts = {}; src.fields = {} });
}