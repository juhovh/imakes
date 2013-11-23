#!/bin/sh

MP4PATH=files/videos/mp4/
for file in $(ls $MP4PATH)
do
  qt-faststart $MP4PATH$file $MP4PATH$file.quick
  if [ -f $MP4PATH$file.quick ]; then
    mv $MP4PATH$file.quick $MP4PATH$file
  fi
done
