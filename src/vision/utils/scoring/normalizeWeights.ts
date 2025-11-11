export function normalizeWeights(weights: Record<string, number>): Record<string, number> {
    const total = Object.values(weights).reduce((acc, value) => acc + value, 0)
    if (total === 0) {
        return weights
    }
    const normalized: Record<string, number> = {}
    Object.entries(weights).forEach(([key, value]) => {
        normalized[key] = Number((value / total).toFixed(4))
    })
    return normalized
}
