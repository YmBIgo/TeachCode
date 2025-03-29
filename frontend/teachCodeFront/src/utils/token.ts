export function floorTokenCount(tokenCount: number): string {
    if (tokenCount >= 1000000000) { // 1b
        const floorNumber = Math.floor(tokenCount / 100000000) / 10
        return `${floorNumber}B`
    } else if (tokenCount >= 1000000) {
        const floorNumber = Math.floor(tokenCount / 100000) / 10
        return `${floorNumber}M`
    } else if (tokenCount >= 1000) {
        const floorNumber = Math.floor(tokenCount / 100) / 10
        return `${floorNumber}T`
    }
    return String(tokenCount)
}