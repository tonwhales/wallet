import { Address } from "@ton/core";
import { useAddressBook } from "../contacts/useAddressBook";
import { useNetwork } from "../network/useNetwork";
import { useAddressBookContext } from "../../AddressBookContext";

export function useAddToDenyList() {
    const addressBookContext = useAddressBookContext();
    return addressBookContext.addToDenyList
}