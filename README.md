Imakes
======

Kickass image and photo blog that can be used for recording all those memorable
(drunken) moments with your best friends and buddies. All you need is an IMAP
mailbox and its email address and you are ready to start.

Install dependencies
--------------------

### Mac OS X

```
brew install node
brew install exiftool
brew install graphicsmagick
brew install libav --with-libvo-aacenc
brew install qtfaststart
brew install sqlite3
```

### Ubuntu 12.04

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

Configure the server
--------------------

```
cd imakes/
npm install
cp config.js.sample config.js
vim config.js # Edit all the marked fields
vim db/users.sql # Modify the user login information
```

Initializing the database
-------------------------

```
cat db/schema.sql | sqlite3 imakes.db
cat db/users.sql | sqlite3 imakes.db
```

Finally run the server
----------------------

```
node server
```
