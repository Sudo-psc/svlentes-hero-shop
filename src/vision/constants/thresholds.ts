export const CONFIDENCE_THRESHOLDS = {
    veryHigh: 0.85,
    high: 0.7,
    medium: 0.5
}

export const RISK_RULES = {
    critical: ['infection-recent', 'acute-trauma'],
    high: ['dry-eye-severe', 'hygiene-poor', 'diabetes-unstable'],
    moderate: ['dry-eye-moderate', 'allergy-perennial', 'sleep-irregular'],
    cautionary: ['budget-low', 'sports-contact', 'environment-dust']
}

export const COST_BANDS = {
    contactLens: {
        daily: { monthly: [180, 320], annual: [2000, 3600] },
        monthly: { monthly: [120, 200], annual: [1300, 2100] },
        rigid: { monthly: [90, 150], annual: [1000, 1600] }
    },
    glasses: {
        singleVision: { initial: [400, 900], annual: [450, 950] },
        progressive: { initial: [900, 2500], annual: [950, 2600] }
    }
}
