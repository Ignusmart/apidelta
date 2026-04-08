#!/bin/sh
set -e

echo "Running Prisma migrations..."
npx prisma@6.19.3 migrate deploy --schema=prisma/schema.prisma

echo "Starting APIDelta API..."
exec node dist/main.js
