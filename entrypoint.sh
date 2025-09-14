#!/usr/bin/env sh

cd /next
dos2unix wait-for-db.sh

# copy .env file if not exists
[ ! -f .env ] && [ -f .env.example ] && cp .env.example .env
cp .env .env.temp
dos2unix .env.temp
cat .env.temp > .env
rm .env.temp

source .env

# run cmd
exec "$@"
