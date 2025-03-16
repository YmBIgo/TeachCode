const uuidSeed = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
const DEFAULT_UUID_LENGTH = 24

export function uuid(): string {
    let uuidResult = ""
    for(let i = 0; i < DEFAULT_UUID_LENGTH; i++) {
        const random = Math.floor(Math.random() * DEFAULT_UUID_LENGTH)
        const char = uuidSeed[random]
        uuidResult += char
    }
    return uuidResult
}