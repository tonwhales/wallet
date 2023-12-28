import { storage } from './storage';


export function markAsTermsNotAccepted() {
    storage.set('terms_accepted', false);
}

export function markAsTermsAccepted() {
    storage.set('terms_accepted', true);
}

export function isTermsAccepted() {
    return storage.getBoolean('terms_accepted');
}