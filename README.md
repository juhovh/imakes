Imakes
======

Kickass image and photo blog that can be used for recording all those memorable
(drunken) moments with your best friends and buddies. All you need is an IMAP
mailbox and its email address and you are ready to start.

Installation
------------

### Install dependencies

The server is tested to run correctly on Mac OS X 10.8 and Ubuntu 12.04 LTS.

#### Mac OS X

```
brew install node
brew install exiftool
brew install graphicsmagick
brew install libav --with-libvo-aacenc
brew install qtfaststart
brew install sqlite3
```

#### Ubuntu 12.04

```
# Install Node.js
sudo apt-get install -y python-software-properties python g++ make
sudo add-apt-repository -y ppa:chris-lea/node.js
sudo apt-get update
sudo apt-get install nodejs

# Install image processing dependencies
sudo apt-get install libimage-exiftool-perl
sudo apt-get install graphicsmagick

# Unfortunately the Ubuntu 12.04 libav-tools is buggy and crashes
# We need to download the ffmpeg version from their PPA repository
# This stage might not be necessary for newer Ubuntu versions
sudo add-apt-repository ppa:jon-severinsson/ffmpeg
sudo apt-get update

# Install video processing dependencies and sqlite client
sudo apt-get install libav-tools libavcodec-extra-53
sudo apt-get install sqlite3
```

### Configure the server

```
cd imakes/
npm install
cp config.js.sample config.js
vim config.js # Edit all the marked fields
vim db/users.sql # Modify the user login information
```

### Initializing the database

```
cat db/schema.sql | sqlite3 imakes.db
cat db/users.sql | sqlite3 imakes.db
```

### Finally run the server

```
node server
```

REST API
--------

The JSON API consists of the following endpoints:

### Direct database access endpoints

```
GET /api/user/                    - returns a list of all users on the system
GET /api/user/{userid}            - returns information of a single user
GET /api/user/{userid}/favorite/  - returns a list of all messages favorited by the user
GET /api/message/                 - returns a list of all messages in the database
GET /api/message/{msgid}          - returns information of a single message
```

### Favorite modification endpoints

```
POST /api/user/{userid}/favorite/{msgid}   - adds a message to user favorites, if already exists does nothing
DELETE /api/user/{userid}/favorite/{msgid} - removes a message from user favorites, if not existing does nothing
```

### Message search endpoints

```
GET /api/search/favorites           - searches messages favorited at least by one user
GET /api/search/favorites/{userid}  - searches messages favorited by a certain user (sorted from latest favorite to oldest)
GET /api/search/messages            - search from all messages in the database
GET /api/search/images              - search only messages containing at least one image
GET /api/search/videos              - search only messages containing at least one video
```

### Message search query parameters

All of these use a common format in query parameters:

```
from={timestamp}
until={timestamp}
limit={number}
offset={number}
key={word1} {word2}
metadata_contains={key1},{key2}|{key3},{key4}
order_by={field1}_asc,{field2}_desc
```

The timestamps are in number of milliseconds since 1 January 1970 00:00:00 UTC (Unix Epoch) and from
is inclusive whereas until is exclusive. Limit and offset are numbers, limit is the maximum number
of results and offset is an offset from the beginning of the result list. As per SQL semantics,
offset can only be specified if limit is set to some number, otherwise it is simply ignored.

The search keywords can be any words and are handled in case insensitive way. They search from the
message title, message author and timestamp fields where timestamp is in YYYY-MM-DDTHH:mm:ss.sssZ
format. Partial words are matched and if multiple keywords are specified, only messages that match
all the words are included.

The metadata_contains parameter can include several metadata fields that are to be fetched. For
example `metadata_contains=CreateDate,GPSPosition|GPSCoordinates` searches for messages that have at
least one attachment whose metadata contains both CreateDate and either GPSPosition or
GPSCoordinates fields. It is worth to note that since metadata is not indexed in the database, these
query parameters are considerably slower than any other query parameters and should be used
sparingly.

The order_by parameter can contain a list of order parameters in the format field_(asc|desc).
Supported fields are `id`, `title`, `author`, `timestamp` and `favorited` the default being always
`id_asc`, except for favorites by user search where the default is favorite timestamp only relevant
for that particular search query. If only field name is specified or the sorting order is unknown,
then `asc` is always used as the default. If multiple order_by parameters are given, the first ones
will always have higher precedence than the latter ones.

### Message search results

Search results are always in the same format from all endpoints:

```
{
  "query": {
    "param1": "value1",
    "param2": "value2"
  },
  "totalMessages": {number},
  "messages: [
    {msg1},
    {msg2}
  ]
}
```

The `query` object contains the parameters of the query that were actually used in constructing the
corresponding result. The totalMessages field contains the number of messages in case no `order` or
`limit` parameters would have been given. This is useful for example if one wants to implement
paging and know the number of total pages. The messages array finally contains the resulting
messages with the requested ordering.
