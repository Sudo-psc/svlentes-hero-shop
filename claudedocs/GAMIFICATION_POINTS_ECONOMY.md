# Gamification Points Economy

**Document Version:** 1.0.0
**Last Updated:** 2025-10-30
**Status:** 🚧 Implementation Phase

---

## 📊 Overview

This document defines the complete points economy system for the SV Lentes gamification platform. The system is designed to:

- **Motivate** desired user behaviors (engagement, retention, loyalty)
- **Reward** valuable actions (subscriptions, referrals, health activities)
- **Balance** earning and spending rates for sustainable engagement
- **Prevent** abuse and gaming of the system

---

## 🎯 Design Principles

1. **Transparency**: Users always know how points are earned and spent
2. **Fairness**: Equal opportunity for all users to earn points
3. **Progression**: Point values scale with user level and engagement
4. **Anti-Fraud**: Rate limiting and validation on all point-earning actions
5. **Ethical**: No dark patterns or manipulative mechanics

---

## 💰 Points System Structure

### Points Types

| Type | Description | Characteristics |
|------|-------------|-----------------|
| **Total Points** | Lifetime points earned | Never decreases, tracks historical engagement |
| **Available Points** | Current spendable balance | Used for rewards redemption |
| **Experience Points (XP)** | Level progression currency | Separate from spendable points |

### Points Flow

```
User Action
    ↓
Point Earning Event
    ↓
Validation & Anti-Fraud Check
    ↓
[If Valid] Create PointTransaction
    ↓
Update GamificationProfile:
    - totalPoints += amount
    - availablePoints += amount
    - totalPointsEarned += amount
    ↓
Check Level Progression (XP)
    ↓
Create GamificationEvent (Analytics)
    ↓
Send Toast Notification
```

---

## 📈 Points Earning Actions

### Daily Activities

| Action | Points | XP | Frequency | Rate Limit | Anti-Cheat |
|--------|--------|----|-----------| -----------|------------|
| **Daily Login** | 10 | 5 | 1x/day | Reset at midnight | Check last_login_date |
| **Complete Profile** | 50 | 20 | 1x (one-time) | N/A | Validate all required fields |
| **Upload Prescription** | 30 | 15 | Per upload | Max 2/month | Medical validation required |
| **Check Dashboard** | 5 | 2 | 1x/day | 24h cooldown | Session-based tracking |

**Daily Cap**: 100 points/day from activities

### Weekly Goals

| Goal | Points | XP | Description | Validation |
|------|--------|----|-----------| -----------|
| **7-Day Login Streak** | 100 | 50 | Login 7 consecutive days | Check loginStreakDays |
| **Complete 3 Missions** | 75 | 30 | Finish 3 weekly missions | Track via UserMission |
| **Update Address** | 20 | 10 | Update shipping info | Validate CEP, complete address |
| **Review Order** | 25 | 10 | Rate delivery experience | Once per order, 1-5 stars |

**Weekly Cap**: 500 points/week from goals

### Monthly Milestones

| Milestone | Points | XP | Trigger | Frequency |
|-----------|--------|----|---------| ----------|
| **30-Day Active Streak** | 500 | 200 | 30 consecutive login days | Monthly |
| **All Monthly Missions** | 300 | 150 | Complete all monthly missions | Monthly |
| **Subscription Renewal** | 200 | 100 | Successful auto-renewal | Per billing cycle |
| **Payment on Time** | 150 | 75 | Pay before due date | Per payment |

**Monthly Cap**: 2,000 points/month from milestones

### Subscription Actions

| Action | Points | XP | Trigger | Validation |
|--------|--------|----|---------| -----------|
| **First Subscription** | 500 | 250 | Sign up for any plan | Check subscriptions.length === 1 |
| **Plan Upgrade** | 300 | 150 | Upgrade to higher tier | Validate monthlyValue increase |
| **Annual Commitment** | 1,000 | 500 | Subscribe for 12 months | Check payment schedule |
| **Renew Early** | 100 | 50 | Renew before due date | Check renewalDate vs paymentDate |
| **Set Auto-Renewal** | 50 | 25 | Enable recurring payments | Check payment method on file |

**Subscription Cap**: 2,500 points/year from subscription actions

### Referral Program

| Referral Stage | Referrer Points | Referee Points | XP (Both) | Trigger |
|----------------|-----------------|----------------|-----------|---------|
| **Referral Link Shared** | 10 | - | 5 | Copy link |
| **Friend Signs Up** | 200 | 100 | 100 | New user registration |
| **Friend First Purchase** | 500 | 250 | 200 | First payment confirmed |
| **Friend 3-Month Active** | 300 | - | 150 | 3rd consecutive payment |

**Referral Cap**: 10 successful referrals/month (max 5,000 points/month)

**Fraud Prevention**:
- IP address tracking (same IP = suspicious)
- Email domain validation (temporary emails blocked)
- Payment validation (must complete payment within 7 days)
- Rate limit: 3 referral sign-ups per IP per 24h

### Health & Medical

| Action | Points | XP | Frequency | Validation |
|--------|--------|----|-----------| -----------|
| **Schedule Consultation** | 100 | 50 | Unlimited | Booking confirmation required |
| **Attend Consultation** | 300 | 150 | Per visit | Provider confirmation |
| **Prescription Updated** | 150 | 75 | Per update | Medical professional upload |
| **Eye Health Check-In** | 50 | 25 | Monthly | Questionnaire completion |

**Health Cap**: 1,000 points/month from health activities

### Engagement & Content

| Action | Points | XP | Frequency | Rate Limit |
|--------|--------|----|-----------| -----------|
| **Read Educational Article** | 15 | 5 | Per article | Max 5/day |
| **Complete Tutorial** | 40 | 20 | Per tutorial | One-time each |
| **Watch Product Video** | 20 | 10 | Per video | Max 3/day |
| **Submit Feedback** | 50 | 25 | Unlimited | Validated form submission |
| **Write Review** | 100 | 50 | Per order | Max 1/order, min 50 chars |

**Engagement Cap**: 300 points/day from content

### Special Events

| Event | Points | XP | Duration | Availability |
|-------|--------|----|-----------| -------------|
| **Birthday Bonus** | 500 | 250 | 24 hours | Annual |
| **Anniversary Bonus** | 1,000 | 500 | Account creation date | Annual |
| **Holiday Special** | 250 | 100 | Event period | Seasonal |
| **Limited-Time Challenge** | Variable | Variable | Campaign duration | Event-specific |

---

## 🏆 Experience Points (XP) & Leveling

### XP Curve Formula

```typescript
// XP required to reach level N
function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.15, level - 1))
}

// Examples:
// Level 1 → 2: 100 XP
// Level 2 → 3: 115 XP
// Level 5 → 6: 175 XP
// Level 10 → 11: 305 XP
// Level 20 → 21: 1,637 XP
// Level 50 → 51: 108,366 XP
```

### Level Benefits

| Level Tier | Level Range | Benefits |
|------------|-------------|----------|
| **Novice** | 1-5 | Basic features, standard rewards |
| **Regular** | 6-10 | +10% points earning, access to rare rewards |
| **Frequent** | 11-20 | +20% points earning, exclusive badges, priority support |
| **Loyal** | 21-30 | +30% points earning, epic rewards, custom avatar |
| **Champion** | 31-50 | +50% points earning, legendary rewards, VIP perks |
| **Legend** | 51+ | +75% points earning, all rewards, beta access |

### XP Bonuses

- **Multiplier Events**: 2x XP during special campaigns
- **Combo Bonuses**: Complete multiple actions in sequence for +25% XP
- **Level Milestones**: Bonus XP at levels 10, 25, 50, 100

---

## 🛍️ Points Spending

### Rewards Catalog Pricing

| Reward Category | Point Range | Examples |
|-----------------|-------------|----------|
| **Micro Rewards** | 50-200 | Digital content, emotes, minor customizations |
| **Small Rewards** | 200-500 | 5% discount, free delivery upgrade |
| **Medium Rewards** | 500-1,500 | 10-15% discount, product samples |
| **Large Rewards** | 1,500-3,000 | 20% discount, plan upgrade (1 month) |
| **Premium Rewards** | 3,000-5,000 | Free month subscription, exclusive products |
| **Elite Rewards** | 5,000+ | 3 months free, VIP experiences, annual discount |

### Recommended Redemption Values

```
1 Point = R$0.01 in value
100 Points = R$1.00 discount
1,000 Points = R$10.00 value
5,000 Points = R$50.00 value

Target Earn Rate: 500-1,000 points/month (active user)
Target Spend Rate: 300-800 points/month (sustainable engagement)
```

---

## 🔒 Anti-Fraud & Security

### Validation Rules

1. **IP-Based Rate Limiting**
   - Max 50 point-earning actions/hour per IP
   - Suspicious IPs flagged for manual review

2. **User-Based Rate Limiting**
   - Daily/weekly/monthly caps enforced
   - Cooldown periods between same actions

3. **Action Validation**
   - Server-side verification required
   - No client-side point manipulation
   - Idempotent operations (duplicate prevention)

4. **Audit Trail**
   - All point transactions logged in PointTransaction table
   - Metadata includes: IP, user agent, timestamp, action context
   - Immutable records for compliance

5. **Anomaly Detection**
   - Flag users earning >3 standard deviations above mean
   - Automatic suspension of suspicious accounts
   - Manual review process for reinstatement

### Anti-Cheat Measures

```typescript
// Example: Daily login points
async function awardDailyLoginPoints(userId: string) {
  const profile = await getGamificationProfile(userId)

  // Check last login date
  if (profile.lastLoginDate === todayDate()) {
    return { success: false, reason: 'Already claimed today' }
  }

  // Check for IP abuse
  const recentLogins = await getRecentLoginsForIP(ipAddress)
  if (recentLogins.length > 10) {
    return { success: false, reason: 'Rate limit exceeded' }
  }

  // Award points
  await createPointTransaction({
    userId,
    type: 'EARNED',
    amount: 10,
    reason: 'Daily login',
    metadata: { date: todayDate(), ip: ipAddress }
  })

  // Update streak
  await updateLoginStreak(userId)

  return { success: true, points: 10 }
}
```

---

## 📊 Economics & Balance

### Target Metrics

| Metric | Target | Rationale |
|--------|--------|-----------|
| **Avg Points/User/Month** | 750 | Moderate engagement without burnout |
| **Redemption Rate** | 60% | Points should be valuable and used |
| **Earning/Spending Ratio** | 1.3:1 | Slight surplus for flexibility |
| **Points Expiration** | 12 months | Encourage regular redemption |
| **Inflation Control** | <5%/year | Maintain point value over time |

### Monitoring & Adjustments

**Weekly Review**:
- Points issued vs redeemed
- Top earning actions
- Redemption patterns

**Monthly Adjustment**:
- Rebalance point values if needed
- Introduce new earning opportunities
- Deprecate low-engagement actions

**Quarterly Analysis**:
- User segmentation (low/medium/high earners)
- Lifetime value correlation with points
- Retention impact measurement

---

## 🎁 Point Expiration Policy

### Rules

1. **Standard Points**: Expire after 12 months of inactivity
2. **Bonus Points**: May have shorter expiration (30-90 days)
3. **Promotional Points**: Expire at campaign end
4. **Subscription Points**: Never expire while subscription active

### Grace Period

- 30-day warning before expiration
- Email and WhatsApp notification at 30, 7, and 1 day before expiration
- Option to "pause" expiration by completing a mission

### Expiration Handling

```sql
-- Nightly cron job to expire points
UPDATE point_transactions
SET
  status = 'EXPIRED',
  metadata = jsonb_set(metadata, '{expired_at}', to_jsonb(NOW()))
WHERE
  expires_at < NOW()
  AND type = 'EARNED'
  AND status != 'EXPIRED';

-- Deduct from user balance
UPDATE gamification_profiles
SET
  available_points = available_points - (
    SELECT SUM(amount)
    FROM point_transactions
    WHERE user_id = gamification_profiles.user_id
      AND status = 'EXPIRED'
      AND expires_at < NOW()
  )
WHERE user_id IN (
  SELECT DISTINCT user_id
  FROM point_transactions
  WHERE status = 'EXPIRED'
    AND expires_at < NOW()
);
```

---

## 📐 Formula Reference

### Streak Multiplier

```typescript
function streakMultiplier(streakDays: number): number {
  if (streakDays < 3) return 1.0
  if (streakDays < 7) return 1.1
  if (streakDays < 14) return 1.2
  if (streakDays < 30) return 1.3
  if (streakDays < 60) return 1.5
  return 2.0 // Max 2x for 60+ day streaks
}
```

### Level-Based Bonus

```typescript
function levelBonus(level: number): number {
  if (level < 6) return 1.0
  if (level < 11) return 1.1
  if (level < 21) return 1.2
  if (level < 31) return 1.3
  if (level < 51) return 1.5
  return 1.75
}
```

### Combined Points Calculation

```typescript
function calculatePoints(
  basePoints: number,
  level: number,
  streakDays: number
): number {
  const levelMult = levelBonus(level)
  const streakMult = streakMultiplier(streakDays)
  const finalPoints = Math.floor(basePoints * levelMult * streakMult)
  return finalPoints
}

// Example:
// Base: 100 points
// Level 15: 1.2x
// Streak 10 days: 1.2x
// Final: 100 * 1.2 * 1.2 = 144 points
```

---

## 🚀 Implementation Checklist

### Phase 1: Core System
- [x] Database schema design
- [ ] Point transaction service
- [ ] XP and leveling system
- [ ] Anti-fraud validation layer
- [ ] Basic earning actions (login, profile, subscription)

### Phase 2: Advanced Features
- [ ] Referral system with fraud detection
- [ ] Health & medical action tracking
- [ ] Engagement content tracking
- [ ] Special events and seasonal bonuses

### Phase 3: Optimization
- [ ] A/B testing for point values
- [ ] Machine learning for anomaly detection
- [ ] Dynamic point value adjustment
- [ ] Personalized earning opportunities

---

## 📧 Support & Questions

For questions about the points economy system, contact:
- **Technical Lead**: Development team
- **Product Manager**: Gamification strategy
- **Security Team**: Anti-fraud measures

---

**Last Review Date**: 2025-10-30
**Next Review Date**: 2025-11-30
**Document Owner**: Product & Engineering Teams
