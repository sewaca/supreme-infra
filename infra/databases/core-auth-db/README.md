# Core Auth Database

This directory contains the database configuration and initialization scripts for the core-auth service.

## Files

- `init.sql` - Initial database schema and seed data
- `data-source.ts` - TypeORM data source configuration (for reference only)

## Database Schema

### Users Table

- `id` - Primary key
- `email` - Unique user email
- `password` - Hashed password
- `name` - User's display name
- `role` - User role (user, moderator, admin)
- `created_at` - Account creation timestamp

## Initial Users

The database is seeded with three test users:

- admin@example.com (password: admin123)
- moder@example.com (password: moder123)
- user@example.com (password: user123)
