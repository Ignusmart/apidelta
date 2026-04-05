#!/bin/sh
set -e

echo "Running Prisma migrations..."
npx prisma migrate deploy --schema=prisma/schema.prisma

echo "Starting DriftWatch API..."
exec node dist/main.js
