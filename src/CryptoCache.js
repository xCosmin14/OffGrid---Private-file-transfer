const DB_NAME = 'e2ee-cache'
const STORE = 'keys'

function openDb() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1)
        req.onupgradeneeded = () => req.result.createObjectStore(STORE)
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
    })
}

async function idbGet(key) {
    const db = await openDb()
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readonly')
        const req = tx.objectStore(STORE).get(key)
        
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
        tx.oncomplete = () => db.close() 
    })
}

async function idbSet(key, value) {
    const db = await openDb()
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite')
        tx.objectStore(STORE).put(value, key)
        
        tx.oncomplete = () => {
            db.close()
            resolve()
        }
        tx.onerror = () => {
            db.close()
            reject(tx.error)
        }
    })
}

async function getDeviceKey() {
    let deviceKey = await idbGet('deviceKey')
    if (!deviceKey) {
        deviceKey = await crypto.subtle.generateKey(
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        )
        await idbSet('deviceKey', deviceKey)
    }
    return deviceKey
}

export async function cachePrivateKey(privateKeyUint8) {
    const deviceKey = await getDeviceKey()
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        deviceKey,
        privateKeyUint8
    )
    await idbSet('cachedPrivateKey', { iv, ciphertext })
}

export async function loadCachedPrivateKey() {
    const entry = await idbGet('cachedPrivateKey')
    if (!entry) return null
    
    const deviceKey = await getDeviceKey()
    try {
        const plainBuf = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: entry.iv },
            deviceKey,
            entry.ciphertext
        )
        
        return new Uint8Array(plainBuf)
    } catch {return null}
}

export async function clearCachedPrivateKey() {
    const db = await openDb()
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite')
        tx.objectStore(STORE).delete('cachedPrivateKey')
        
        tx.oncomplete = () => {
            db.close()
            resolve()
        }
        tx.onerror = () => {
            db.close()
            reject(tx.error)
        }
    })
}