FROM node:24-bullseye

WORKDIR /imakes

RUN apt update -y && apt upgrade -y
RUN apt install -y libimage-exiftool-perl graphicsmagick ffmpeg sqlite3
RUN ln -s /usr/bin/ffmpeg /usr/bin/avconv

RUN git clone https://github.com/juhovh/imakes.git .
RUN npm install -y
