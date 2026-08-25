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
        privateKeyBytes: kp.privateKey 
    }
}

export async function generateSalt() {
    await sodium.ready
    return sodium.to_base64(sodium.randombytes_buf(16))
}

export async function deriveKeyFromPassword(password, saltB64) {
    await sodium.ready
    const salt = safeFromBase64(saltB64)
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

function safeFromBase64(b64Str) {
    if (!b64Str) return null
    if (b64Str instanceof Uint8Array) return b64Str

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

export async function encryptDataWithKey(dataUint8, keyUint8) {
    await sodium.ready
    const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES)
    const encrypted = sodium.crypto_secretbox_easy(dataUint8, nonce, keyUint8)

    const combined = new Uint8Array(nonce.length + encrypted.length)
    combined.set(nonce)
    combined.set(encrypted, nonce.length)

    return sodium.to_base64(combined)
}

export async function decryptDataWithKey(encryptedData, keyUint8) {
    await sodium.ready

    if (!encryptedData) throw new Error("Encrypted data is missing or undefined")

    let payload = encryptedData
    if (typeof payload === 'string' && payload.trim().startsWith('{')) {
        try { payload = JSON.parse(payload) } 
        catch (e) { throw new Error("Invalid JSON encrypted payload") }
    }

    if (typeof payload === 'object' && payload !== null && payload.nonce && payload.ciphertext) {
        const nonce = safeFromBase64(payload.nonce)
        const ciphertext = safeFromBase64(payload.ciphertext)
        return sodium.crypto_secretbox_open_easy(ciphertext, nonce, keyUint8)
    }

    if (typeof payload === 'string') {
        const cleanB64 = payload.trim()
        const combined = safeFromBase64(cleanB64)
        const nonceBytes = sodium.crypto_secretbox_NONCEBYTES

        if (combined.length < nonceBytes) throw new Error("Payload prea scurt")

        const nonce = combined.slice(0, nonceBytes)
        const ciphertext = combined.slice(nonceBytes)

        return sodium.crypto_secretbox_open_easy(ciphertext, nonce, keyUint8)
    }

    throw new Error("Format necunoscut pentru datele criptate")
}

export async function encryptFile(fileBytes, fek) {
    await sodium.ready
    const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES)
    const encrypted = sodium.crypto_secretbox_easy(fileBytes, nonce, fek)

    const combined = new Uint8Array(nonce.length + encrypted.length)
    combined.set(nonce)
    combined.set(encrypted, nonce.length)

    return combined 
}

export async function encryptFekForUser(fek, userPublicKeyB64) {
    await sodium.ready
    const publicKey = safeFromBase64(userPublicKeyB64)
    const sealed = sodium.crypto_box_seal(fek, publicKey)

    return sodium.to_base64(sealed)
}

export async function decryptFekForUser(encryptedFekB64, publicKeyB64, privateKeyInput) {
    await sodium.ready
    
    const encryptedFek = safeFromBase64(encryptedFekB64)
    
    const privateKeyUint8 = typeof privateKeyInput === 'string' 
        ? safeFromBase64(privateKeyInput) 
        : privateKeyInput

    if (!privateKeyUint8 || privateKeyUint8.length !== sodium.crypto_box_SECRETKEYBYTES) {
        throw new Error(`Cheia privată este invalidă. Trebuie să aibă exact ${sodium.crypto_box_SECRETKEYBYTES} octeți.`)
    }

    const derivedPublicKey = sodium.crypto_scalarmult_base(privateKeyUint8)
    
    const fek = sodium.crypto_box_seal_open(encryptedFek, derivedPublicKey, privateKeyUint8)
    
    if (!fek) throw new Error("Decriptarea FEK a eșuat. Fișierul a fost criptat cu o altă cheie publică!")
    return fek
}

export async function decryptFile(encryptedFileBytes, fek) {
    await sodium.ready
    
    const nonceBytes = sodium.crypto_secretbox_NONCEBYTES
    
    if (encryptedFileBytes.length < nonceBytes) 
        throw new Error("Fișierul este prea mic pentru a conține nonce-ul.")
        
    const nonce = encryptedFileBytes.slice(0, nonceBytes)
    const ciphertext = encryptedFileBytes.slice(nonceBytes)
    
    const decrypted = sodium.crypto_secretbox_open_easy(ciphertext, nonce, fek)
    
    if (!decrypted) throw new Error("Decriptarea fișierului a eșuat.")
    return decrypted
}

export async function encryptPrivateKeyWithPassword(privateKeyB64, password, saltB64) {
    await sodium.ready
    
    const derivedKey = await deriveKeyFromPassword(password, saltB64)
    
    const privateKeyBytes = sodium.from_string(privateKeyB64)
    const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES)
    const encrypted = sodium.crypto_secretbox_easy(privateKeyBytes, nonce, derivedKey)

    const combined = new Uint8Array(nonce.length + encrypted.length)
    combined.set(nonce)
    combined.set(encrypted, nonce.length)

    return sodium.to_base64(combined)
}

export async function decryptPrivateKeyWithPassword(encryptedPrivateKeyB64, password, saltB64) {
    await sodium.ready

    if (!encryptedPrivateKeyB64)
        throw new Error("Encrypted private key is missing")

    const derivedKey = await deriveKeyFromPassword(password, saltB64)

    const combined = safeFromBase64(encryptedPrivateKeyB64)
    const nonceBytes = sodium.crypto_secretbox_NONCEBYTES

    if (combined.length < nonceBytes) 
        throw new Error("Payload-ul cheii private este prea scurt")

    const nonce = combined.slice(0, nonceBytes)
    const ciphertext = combined.slice(nonceBytes)

    const decryptedBytes = sodium.crypto_secretbox_open_easy(ciphertext, nonce, derivedKey)
    if (!decryptedBytes) throw new Error("Parolă incorectă sau cheie privată coruptă.")

    return decryptedBytes 
}

export async function safeDecryptFekForUser(encryptedFekB64, publicKeyB64, privateKeyUint8) {
    await sodium.ready
    
    const encryptedFek = safeFromBase64(encryptedFekB64)
    const publicKey = safeFromBase64(publicKeyB64)
    
    const privateKey = typeof privateKeyUint8 === 'string' 
        ? safeFromBase64(privateKeyUint8) 
        : privateKeyUint8

    const fek = sodium.crypto_box_seal_open(encryptedFek, publicKey, privateKey)
    
    if (!fek) throw new Error("Decriptarea FEK a eșuat. Verifică cheile.")
    return fek
}