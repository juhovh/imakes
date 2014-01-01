#!/bin/sh

rm imakes.db.new
sqlite3 imakes.db.new < db/schema.sql
sqlite3 imakes.db .dump | grep -v -e '^CREATE' -e '^  ' -e '^);' | sqlite3 imakes.db.new
