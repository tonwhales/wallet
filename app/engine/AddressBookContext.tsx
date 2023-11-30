import { createContext, useContext } from "react";
import { AddressBook, AddressContact, useAddressBook } from "./hooks/contacts/useAddressBook";

export const AddressBookContext = createContext<
    {
        state: AddressBook,
        update: (updater: (value: AddressBook) => void) => Promise<void>,
        useContact: (addressString?: string | null) => AddressContact | null,
        useDenyAddress: (addressString?: string | null) => boolean
    }
    | null
>(null);

export const AddressBookLoader = ({ children }: { children: React.ReactNode }) => {
    const [state, update] = useAddressBook();

    const useContact = (addressString?: string | null) => {
        if (!addressString) {
            return null;
        }
        const contact = state.contacts[addressString];
        if (!!contact) {
            return contact;
        }
        return null;
    }

    const useDenyAddress = (addressString?: string | null) => {
        if (!addressString) {
            return false;
        }

        const denied = state.denyList[addressString];
        return !!denied;
    }

    return (
        <AddressBookContext.Provider value={{ state, update, useContact, useDenyAddress }}>
            {children}
        </AddressBookContext.Provider>
    );
}

export function useAddressBookContext() {
    const context = useContext(AddressBookContext);
    if (context === null) {
        throw new Error('useHooks must be used within a HooksProvider');
    }
    return context;
}