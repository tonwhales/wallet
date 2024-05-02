import { createContext, memo, useContext } from "react";
import { AddressBook, AddressContact, useAddressBook } from "./hooks/contacts/useAddressBook";
import { Address } from "@ton/core";
import { useNetwork } from "./hooks";

export const AddressBookContext = createContext<
    {
        state: AddressBook,
        update: (updater: (value: AddressBook) => void) => Promise<void>,
        asContact: (addressString?: string | null) => AddressContact | null,
        isDenyAddress: (addressString?: string | null) => boolean,
        addToDenyList: (address: string | Address, reason?: string) => void,
        removeFromDenyList: (address: string | Address,) => void,
        setContact: (addressString: string, contact: AddressContact) => void,
        removeContact: (addressString: string) => void,
    }
    | null
>(null);

export const AddressBookLoader = memo(({ children }: { children: React.ReactNode }) => {
    const [state, update] = useAddressBook();
    const { isTestnet } = useNetwork();

    const asContact = (addressString?: string | null) => {
        if (!addressString) {
            return null;
        }
        const contact = state.contacts[addressString];
        if (!!contact) {
            return contact;
        }
        return null;
    }

    const setContact = (addressString: string, contact: AddressContact) => {
        return update((doc) => {
            // Create a new contact if it doesn't exist
            if (!doc.contacts[addressString]) {
                doc.contacts[addressString] = {
                    name: contact.name,
                    fields: contact.fields
                }
                return;
            }

            // Update the contact if it does exist
            doc.contacts[addressString].name = contact.name;

            // Update the fields
            if (!contact.fields) {
                doc.contacts[addressString].fields = [];
                return;
            }

            if (!doc.contacts[addressString].fields) {
                doc.contacts[addressString].fields = [];
                return;
            }

            contact.fields.forEach((field, index) => {
                const existingFieldIndex = doc.contacts[addressString].fields?.findIndex((f) => f.key === field.key);
                if (existingFieldIndex === -1 || existingFieldIndex === undefined) {
                    doc.contacts[addressString].fields?.push(field);
                } else {
                    delete doc.contacts[addressString].fields![existingFieldIndex];
                    doc.contacts[addressString].fields![existingFieldIndex] = field;
                }
            });
        })
    };

    const removeContact = (addressString: string) => {
        return update((doc) => {
            delete doc.contacts[addressString];
        });
    };

    const isDenyAddress = (address?: string | Address | null) => {
        if (!address) {
            return false;
        }

        let addrStr = '';

        if (address instanceof Address) {
            addrStr = address.toString({ testOnly: isTestnet });
        } else {
            addrStr = Address.parse(address).toString({ testOnly: isTestnet });
        }

        const denied = state.denyList[addrStr];
        return !!denied;
    }

    const addToDenyList = (address: string | Address, reason?: string) => {
        let addrStr = '';

        if (address instanceof Address) {
            addrStr = address.toString({ testOnly: isTestnet });
        } else {
            addrStr = Address.parse(address).toString({ testOnly: isTestnet });
        }

        return update((doc) => doc.denyList[addrStr] = { reason: reason ?? 'spam' });
    };

    const removeFromDenyList = (address: string | Address) => {
        let addrStr = '';

        if (address instanceof Address) {
            addrStr = address.toString({ testOnly: isTestnet });
        } else {
            addrStr = Address.parse(address).toString({ testOnly: isTestnet });
        }

        return update((doc) => {
            delete doc.denyList[addrStr];
        });
    }

    return (
        <AddressBookContext.Provider value={{
            state, update,
            asContact, isDenyAddress,
            addToDenyList, removeFromDenyList,
            setContact, removeContact
        }}>
            {children}
        </AddressBookContext.Provider>
    );
})

export function useAddressBookContext() {
    const context = useContext(AddressBookContext);
    if (context === null) {
        throw new Error('useAddressBookContext must be used within a AddressBookLoader');
    }
    return context;
}