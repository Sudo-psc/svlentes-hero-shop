# Database Migrations - Intelligent Reminder System

## Initial Setup

### 1. Generate Prisma Client

```bash
npx prisma generate
```

This will create the Prisma Client based on your schema in `prisma/schema.prisma`.

### 2. Create Migration

```bash
npx prisma migrate dev --name init_reminder_system
```

This creates a new migration file and applies it to your database.

### 3. Apply Migrations (Production)

```bash
npx prisma migrate deploy
```

Use this in CI/CD or production environments.

## Schema Overview

The reminder system uses the following tables:

### Core Tables

1. **users** - User information and preferences
   - id, email, phone, preferences (JSON)
   
2. **notifications** - All sent/scheduled notifications
   - id, userId, channel, type, content, status, scheduledAt, sentAt
   
3. **interactions** - User interactions with notifications
   - id, notificationId, userId, actionType, timestamp
   
4. **user_behaviors** - Analytics per user
   - userId, emailOpenRate, whatsappOpenRate, bestHourOfDay, preferredFrequency, currentFatigueScore

5. **ml_predictions** - ML model predictions and accuracy tracking
   - id, userId, predictedChannel, predictedTime, confidenceScore, wasAccurate

6. **campaigns** - Bulk notification campaigns
   - id, name, type, targetChannels, scheduledAt, statistics

7. **analytics_snapshots** - Daily aggregated analytics
   - date, totalSent, totalDelivered, totalOpened, channelMetrics

### Indexes

The schema includes optimized indexes for:
- User lookups (userId)
- Status filtering (status)
- Time-based queries (scheduledAt, timestamp)
- Channel filtering (channel)

### Enums

- **NotificationChannel**: EMAIL, WHATSAPP, SMS, PUSH
- **NotificationStatus**: SCHEDULED, SENDING, SENT, DELIVERED, OPENED, CLICKED, FAILED, CANCELLED
- **NotificationType**: REMINDER, PROMOTION, UPDATE, ALERT
- **InteractionType**: SENT, DELIVERED, OPENED, CLICKED, DISMISSED, OPTED_OUT, CONVERTED

## Common Operations

### View Current Schema

```bash
npx prisma studio
```

Opens a GUI to browse your database.

### Reset Database (Development Only)

```bash
npx prisma migrate reset
```

⚠️ **WARNING**: This deletes all data!

### Create a New Migration

```bash
npx prisma migrate dev --name your_migration_name
```

### Check Migration Status

```bash
npx prisma migrate status
```

### Format Schema

```bash
npx prisma format
```

## Seed Data (Optional)

Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create test user
  await prisma.user.upsert({
    where: { email: 'test@svlentes.com.br' },
    update: {},
    create: {
      email: 'test@svlentes.com.br',
      phone: '+5511999999999',
      preferences: {
        channels: {
          email: { enabled: true },
          whatsapp: { enabled: true },
        },
        frequency: { max_per_day: 3 },
      },
    },
  })
}

main()
  .then(() => console.log('Seed complete'))
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

Run with:
```bash
npx prisma db seed
```

## Troubleshooting

### Migration Conflicts

If you get migration conflicts:

```bash
# Mark as resolved
npx prisma migrate resolve --applied <migration_name>

# Or rollback
npx prisma migrate resolve --rolled-back <migration_name>
```

### Connection Issues

Check your `DATABASE_URL` in `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
```

### Schema Drift

Check if database is in sync with schema:

```bash
npx prisma migrate diff \
  --from-schema-datamodel prisma/schema.prisma \
  --to-schema-datasource prisma/schema.prisma
```

## Production Checklist

- [ ] Backup database before migration
- [ ] Test migration on staging environment
- [ ] Use `prisma migrate deploy` (not `migrate dev`)
- [ ] Monitor application after deployment
- [ ] Keep migrations in version control
- [ ] Document breaking changes

## Performance Tips

1. **Add indexes** for frequently queried fields
2. **Use pagination** for large result sets
3. **Batch operations** when possible
4. **Monitor query performance** with `prisma.$queryRaw`
5. **Consider caching** for hot data

## Support

- Prisma Docs: https://www.prisma.io/docs
- Issues: File on GitHub repository
- Community: Prisma Discord
