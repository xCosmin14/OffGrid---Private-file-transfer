import sodium from 'libsodium-wrappers-sumo'

export async function initCrypto() {
    await sodium.ready
}

export async function generateKeyPair() {
    await sodium.ready
    const kp = sodium.crypto_box_keypair()

    return {
        publicKey: sodium.to_base64(kp.publicKey),
        privateKey: sodium.to_base64(kp.privateKey),
    }
}

export async function generateSalt() {
    await sodium.ready
    return sodium.to_base64(sodium.randombytes_buf(16))
}

export async function deriveKeyFromPassword(password, saltB64) {
    await sodium.ready
    const salt = sodium.from_base64(saltB64)
    const passwordUint8 = sodium.from_string(password) 

    return sodium.crypto_pwhash(
        sodium.crypto_secretbox_KEYBYTES,
        passwordUint8, 
        salt,
        sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
        sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
        sodium.crypto_pwhash_ALG_ARGON2ID13
    )
}

export async function generateFEK() {
    await sodium.ready
    return sodium.crypto_secretbox_keygen()
}

export async function encryptDataWithKey(dataUint8, keyUint8) {
    await sodium.ready

    const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES)
    const encrypted = sodium.crypto_secretbox_easy(dataUint8, nonce, keyUint8)

    const combined = new Uint8Array(nonce.length + encrypted.length)
    combined.set(nonce)
    combined.set(encrypted, nonce.length)

    return sodium.to_base64(combined)
}

function safeFromBase64(b64Str) {
    if (!b64Str) return null

    let cleanStr = String(b64Str).trim().replace(/^"+|"+$/g, '').replace(/\s+/g, '')

    const variants = [
        sodium.base64_variants.URLSAFE_NO_PADDING,
        sodium.base64_variants.URLSAFE,
        sodium.base64_variants.ORIGINAL_NO_PADDING,
        sodium.base64_variants.ORIGINAL
    ]

    for (const variant of variants) {
        try {
            return sodium.from_base64(cleanStr, variant)
        } catch {}
    }

    let standardB64 = cleanStr.replace(/-/g, '+').replace(/_/g, '/')
    while (standardB64.length % 4 !== 0) standardB64 += '='

    return sodium.from_base64(standardB64, sodium.base64_variants.ORIGINAL)
}

export async function decryptDataWithKey(encryptedData, keyUint8) {
    await sodium.ready

    if (!encryptedData) 
        throw new Error("Encrypted data is missing or undefined")

    let payload = encryptedData

    if (typeof payload === 'string' && payload.trim().startsWith('{')) 
        try {payload = JSON.parse(payload)} 
        catch (e) {throw new Error("Invalid JSON encrypted payload")}
    

    if (typeof payload === 'object' && payload !== null && payload.nonce && payload.ciphertext) {
        const nonce = safeFromBase64(payload.nonce)
        const ciphertext = safeFromBase64(payload.ciphertext)
        return sodium.crypto_secretbox_open_easy(ciphertext, nonce, keyUint8)
    }

    if (typeof payload === 'string') {
        const cleanB64 = payload.trim()
        
        try {
            const combined = safeFromBase64(cleanB64)
            const nonceBytes = sodium.crypto_secretbox_NONCEBYTES

            if (combined.length < nonceBytes) 
                throw new Error("Payload-ul este prea scurt pentru a conține nonce-ul")
        
            const nonce = combined.slice(0, nonceBytes)
            const ciphertext = combined.slice(nonceBytes)

            return sodium.crypto_secretbox_open_easy(ciphertext, nonce, keyUint8)
        } catch (err) {
            console.error("Eroare la decodare Base64 pentru:", cleanB64)
            throw err
        }
    }

    throw new Error("Format necunoscut pentru datele criptate")
}