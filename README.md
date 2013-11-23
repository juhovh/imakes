README

Mac OS X
--------

```
brew install node
brew install exiftool
brew install graphicsmagick
brew install libav --with-libvo-aacenc
brew install qtfaststart
```

Ubuntu 12.04
------------

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

sudo apt-get install libav-tools libavcodec-extra-53
```
