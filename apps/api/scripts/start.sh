#!/bin/sh
set -e

echo "Running Prisma migrations..."
npx prisma migrate deploy --schema=prisma/schema.prisma

echo "Starting APIDelta API..."
exec node dist/main.js
