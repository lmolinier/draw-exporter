#!/bin/sh
FILE=`readlink -f $0`
DIR=`dirname $FILE`
exec xvfb-run --auto-servernum $DIR/electron-bin $@
