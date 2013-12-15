PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE "user" (
  "id"          INTEGER PRIMARY KEY,
  "admin"       INTEGER NOT NULL DEFAULT 0,
  "disabled"    INTEGER NOT NULL DEFAULT 0,
  "name"        TEXT,
  "lastlogin"   DATETIME
);
CREATE TABLE "auth" (
  "id"          INTEGER PRIMARY KEY,
  "user_id"     INTEGER,
  "disabled"    INTEGER NOT NULL DEFAULT 0,
  "provider"    TEXT NOT NULL,
  "identifier"  TEXT NOT NULL,
  "username"    TEXT,
  "displayname" TEXT,
  "lastlogin"   DATETIME,
  FOREIGN KEY("user_id") REFERENCES "user"("id")
);
CREATE UNIQUE INDEX "auth_idx" ON "auth"("provider","identifier");
CREATE TABLE "message" (
  "id"          INTEGER PRIMARY KEY,
  "deleted"     INTEGER NOT NULL DEFAULT 0,
  "imap_uid"    INTEGER UNIQUE,
  "servertime"  DATETIME,
  "title"       TEXT,
  "author"      TEXT,
  "timestamp"   DATETIME NOT NULL,
  "search"      TEXT UNIQUE,
  "processed"   INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE "image" (
  "id"          INTEGER PRIMARY KEY,
  "deleted"     INTEGER NOT NULL DEFAULT 0,
  "message_id"  INTEGER NOT NULL,
  "filename"    TEXT NOT NULL UNIQUE ON CONFLICT IGNORE,
  "mimetype"    TEXT NOT NULL,
  "checksum"    TEXT NOT NULL,
  "width"       INTEGER,
  "height"      INTEGER,
  "exif"        TEXT,
  FOREIGN KEY("message_id") REFERENCES "message"("id")
);
CREATE TABLE "video" (
  "id"          INTEGER PRIMARY KEY,
  "deleted"     INTEGER NOT NULL DEFAULT 0,
  "message_id"  INTEGER NOT NULL,
  "filename"    TEXT NOT NULL UNIQUE ON CONFLICT IGNORE,
  "mimetype"    TEXT NOT NULL,
  "checksum"    TEXT NOT NULL,
  "exif"        TEXT,
  FOREIGN KEY("message_id") REFERENCES "message"("id")
);
CREATE TABLE "favorite" (
  "user_id"     INTEGER NOT NULL,
  "message_id"  INTEGER NOT NULL,
  "timestamp"   DATETIME NOT NULL,
  FOREIGN KEY("user_id") REFERENCES "user"("id"),
  FOREIGN KEY("message_id") REFERENCES "message"("id")
);
CREATE UNIQUE INDEX "favorite_idx" ON "favorite"("user_id","message_id");
COMMIT;
