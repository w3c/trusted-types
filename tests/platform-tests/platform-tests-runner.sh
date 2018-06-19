#!/bin/bash
#/**
# * @license
# * Copyright 2017 Google Inc. All Rights Reserved.
# *
# * Licensed under the W3C SOFTWARE AND DOCUMENT NOTICE AND LICENSE.
# *
# *  https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
# */
TYPES_REPO="$1"

if [ -z "$TYPES_REPO" ]; then
	echo "Usage: $0 <path-to-web-platform-tests-repository>"
	exit 1
fi

git -C $TYPES_REPO checkout -- .
cat dist/trustedtypes.build.js >> $TYPES_REPO/trusted-types/support/helper.js
git -C $TYPES_REPO apply < $(dirname $0)/platform-tests.patch

echo "Visit http://127.0.0.1:9999/trusted-types/ to view the tests."

(cd $TYPES_REPO; python -m SimpleHTTPServer 9999; git checkout -- .)

