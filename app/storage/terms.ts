import { storage } from './storage';

export function markAsTermsAccepted() {
    storage.set('terms_accepted', true);
}

export function isTermsAccepted() {
    return storage.getBoolean('terms_accepted');
}