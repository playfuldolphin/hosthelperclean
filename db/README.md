# Database Setup Guide

## Quick Start

### 1. Install PostgreSQL

**macOS (using Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download and install from: https://www.postgresql.org/download/windows/

### 2. Create Database

```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE hosthelper;

# Create user (optional, for production)
CREATE USER hosthelper_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE hosthelper TO hosthelper_user;

# Exit psql
\q
```

### 3. Configure Environment

Update your `.env` file:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/hosthelper
```

Or for custom user:
```env
DATABASE_URL=postgresql://hosthelper_user:your_secure_password@localhost:5432/hosthelper
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Database Setup

```bash
npm run db:setup
```

This will:
- Create all tables
- Set up indexes
- Create triggers
- Verify the connection

## Database Schema

### Tables Created

1. **users** - User accounts (hosts, cleaners, admins)
2. **properties** - Rental properties managed by hosts
3. **checklists** - Cleaning checklists and templates
4. **cleaners** - Cleaner profiles and details
5. **bookings** - Cleaning bookings and jobs
6. **payments** - Payment records from Stripe
7. **payouts** - Cleaner payout tracking
8. **notifications** - User notifications
9. **reviews** - Ratings and reviews
10. **webhook_events** - Stripe webhook event log (for idempotency)

### Key Features

- ✅ UUID primary keys for all tables
- ✅ Automatic `updated_at` timestamps
- ✅ Foreign key constraints
- ✅ Indexes for performance
- ✅ JSONB fields for flexible data (addons, photos, etc.)
- ✅ Check constraints for data validation
- ✅ Idempotent webhook processing

## Production Setup

### Using Railway.app (Recommended)

1. Create a new project on Railway
2. Add PostgreSQL service
3. Railway will automatically provide `DATABASE_URL`
4. Deploy your app
5. Run migration:
   ```bash
   railway run npm run db:setup
   ```

### Using Heroku

1. Add Heroku Postgres addon:
   ```bash
   heroku addons:create heroku-postgresql:mini
   ```

2. Heroku automatically sets `DATABASE_URL`

3. Run migration:
   ```bash
   heroku run npm run db:setup
   ```

### Using Render

1. Create PostgreSQL database in Render dashboard
2. Copy the Internal Database URL
3. Add as environment variable `DATABASE_URL`
4. Deploy and run migration

## Troubleshooting

### Connection Refused

```bash
# Check if PostgreSQL is running
brew services list  # macOS
sudo systemctl status postgresql  # Linux

# Start PostgreSQL
brew services start postgresql@15  # macOS
sudo systemctl start postgresql  # Linux
```

### Authentication Failed

```bash
# Reset PostgreSQL password
psql postgres
ALTER USER postgres WITH PASSWORD 'newpassword';
\q

# Update DATABASE_URL in .env
DATABASE_URL=postgresql://postgres:newpassword@localhost:5432/hosthelper
```

### Database Does Not Exist

```bash
createdb hosthelper
```

Or using psql:
```sql
psql postgres
CREATE DATABASE hosthelper;
\q
```

### Permission Denied

```bash
psql hosthelper
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_user;
```

## Resetting the Database

**⚠️ WARNING: This will delete all data!**

```bash
# Drop and recreate database
psql postgres
DROP DATABASE hosthelper;
CREATE DATABASE hosthelper;
\q

# Run setup again
npm run db:setup
```

## Backup and Restore

### Backup

```bash
# Full database backup
pg_dump $DATABASE_URL > backup.sql

# Specific tables
pg_dump $DATABASE_URL -t bookings -t payments > backup_critical.sql
```

### Restore

```bash
# Restore from backup
psql $DATABASE_URL < backup.sql
```

## Useful SQL Commands

### Check Table Sizes

```sql
SELECT 
  table_name,
  pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) AS size
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY pg_total_relation_size(quote_ident(table_name)) DESC;
```

### View Recent Bookings

```sql
SELECT 
  b.booking_number,
  b.scheduled_date,
  b.status,
  b.payment_status,
  b.total_price,
  u.full_name as host_name,
  p.name as property_name
FROM bookings b
JOIN users u ON b.host_id = u.id
JOIN properties p ON b.property_id = p.id
ORDER BY b.created_at DESC
LIMIT 10;
```

### Check Webhook Processing

```sql
SELECT 
  event_type,
  processed,
  COUNT(*) as count
FROM webhook_events
GROUP BY event_type, processed
ORDER BY count DESC;
```

## Migration Strategy

For future schema changes, create new migration files:

```
db/migrations/
  001_initial_schema.sql  ✅ Created
  002_add_user_preferences.sql  (future)
  003_add_calendar_sync.sql  (future)
```

Run migrations in order:
```bash
psql $DATABASE_URL < db/migrations/002_add_user_preferences.sql
```

## Performance Tips

1. **Use Connection Pooling** - Already configured in `config/database.js`
2. **Add Indexes** - Already included for common queries
3. **Use EXPLAIN ANALYZE** - For slow queries
4. **Monitor Query Performance** - Enable in development mode
5. **Regular VACUUM** - PostgreSQL does this automatically

## Security Checklist

- [ ] Use strong database password
- [ ] Enable SSL in production (`?sslmode=require`)
- [ ] Restrict database access by IP
- [ ] Regular backups (daily recommended)
- [ ] Use prepared statements (already done)
- [ ] Never log sensitive data
- [ ] Rotate credentials regularly

## Next Steps

After database setup:

1. ✅ Start the server: `npm start`
2. ✅ Test checkout flow
3. ✅ Verify bookings are saved
4. ✅ Check webhook events table
5. ✅ Test payment processing
6. ✅ Review database logs

## Support

If you encounter issues:

1. Check the error message carefully
2. Verify DATABASE_URL format
3. Ensure PostgreSQL is running
4. Check user permissions
5. Review server logs

For PostgreSQL help: https://www.postgresql.org/docs/
