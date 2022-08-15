export async function sha256(bytes: BufferSource) {
    return crypto.subtle.digest("SHA-256", bytes)
}