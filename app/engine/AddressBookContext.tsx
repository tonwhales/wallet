import { createContext, memo, useContext } from "react";
import { AddressBook, AddressContact, useAddressBook } from "./hooks/contacts/useAddressBook";

export const AddressBookContext = createContext<
    {
        state: AddressBook,
        update: (updater: (value: AddressBook) => void) => Promise<void>,
        asContact: (addressString?: string | null) => AddressContact | null,
        isDenyAddress: (addressString?: string | null) => boolean
    }
    | null
>(null);

export const AddressBookLoader = memo(({ children }: { children: React.ReactNode }) => {
    const [state, update] = useAddressBook();

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

    const isDenyAddress = (addressString?: string | null) => {
        if (!addressString) {
            return false;
        }

        const denied = state.denyList[addressString];
        return !!denied;
    }

    return (
        <AddressBookContext.Provider value={{ state, update, asContact, isDenyAddress }}>
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