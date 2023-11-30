import { createContext, useContext } from "react";
import { AddressBook, AddressContact, useAddressBook } from "./hooks/contacts/useAddressBook";

export const AddressBookContext = createContext<
    {
        addressBook: [AddressBook, (updater: (value: AddressBook) => void) => Promise<void>],
        useContact: (addressString?: string | null) => AddressContact | null,
        useDenyAddress: (addressString?: string | null) => boolean
    }
    | null
>(null);

export const AddressBookLoader = ({ children }: { children: React.ReactNode }) => {
    const addressBook = useAddressBook();

    const useContact = (addressString?: string | null) => {
        if (!addressString) {
            return null;
        }
        const contact = addressBook[0].contacts[addressString];
        if (!!contact) {
            return contact;
        }
        return null;
    }

    const useDenyAddress = (addressString?: string | null) => {
        if (!addressString) {
            return false;
        }

        const denied = addressBook[0].denyList[addressString];
        return !!denied;
    }

    return (
        <AddressBookContext.Provider value={{ addressBook, useContact, useDenyAddress }}>
            {children}
        </AddressBookContext.Provider>
    );
}

export function useAddressBookHooks() {
    const context = useContext(AddressBookContext);
    if (context === null) {
        throw new Error('useHooks must be used within a HooksProvider');
    }
    return context;
}