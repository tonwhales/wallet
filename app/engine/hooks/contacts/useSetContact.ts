import { AddressContact, useAddressBook } from "./useAddressBook";

export function useSetContact() {
    const [, update] = useAddressBook();
    return (addressString: string, contact: AddressContact) => {
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
}