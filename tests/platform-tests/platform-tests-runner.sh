#!/bin/bash
# Copyright 2017 Google Inc.

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     https://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
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

