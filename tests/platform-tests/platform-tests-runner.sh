#!/bin/bash
#/**
# * @license
# * Copyright 2017 Google Inc. All Rights Reserved.
# *
# * Licensed under the W3C SOFTWARE AND DOCUMENT NOTICE AND LICENSE.
# *
# *  https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
# */
CMD="$1"; shift
TESTS_REPO="$1"; shift

function help {
  echo "\
Usage:

1. Run the native wpt runner with trusted-types WPT tests:

   $0 wpt <path-to-web-platform-tests-repository> [wpt-run-arguments]

   (default wpt-run-arguments will run unstable chrome)

2. Patch the tests and start a test server only (for debugging)

  $0 manual <path-to-web-platform-tests-repository>
"
  exit 1
}

function init_repo {
  git  -C $TESTS_REPO diff --quiet
  if [ $? -ne 0 ]; then
    echo "Git repository at $TESTS_REPO has unstaged changes, running the tests would overwrite them. Please commit the changes first."
  exit 4
  fi
  git -C $TESTS_REPO checkout -- .
  if [ $? -ne 0 ]; then
    echo "Failure checking out Git repository at $TESTS_REPO, exiting..."
    exit 3
  fi

  echo "Adding polyfill to the test files..."
  cat dist/es5/trustedtypes.build.js >> $TESTS_REPO/trusted-types/support/helper.sub.js
  echo "Removing unpolyfillable tests..."
  echo "" > $TESTS_REPO/trusted-types/idlharness.window.js
}

if [ -z "$TESTS_REPO" ]; then
  help
fi

if [ ! -d "$TESTS_REPO" ]; then
  echo "$TESTS_REPO does not exist."
  exit 2
fi

case $CMD in
  wpt)
    case "$(uname -s)" in
      Darwin)
        CHROME_BINARY='"/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary"'
      ;;
      Linux)
        CHROME_BINARY="$(which google-chrome-unstable)"
      ;;
      *)
      echo "Unsupported platform, aborting."
      exit 2
      ;;
    esac
    WPT_ARGS="${*:---manifest-update --channel dev --binary=$CHROME_BINARY --binary-arg=--disable-blink-features=TrustedDOMTypes chrome}"
    init_repo
    WPT_COMMAND="./wpt run $WPT_ARGS trusted-types"
    echo "Calling $WPT_COMMAND"
    (cd $TESTS_REPO; eval $WPT_COMMAND; git checkout -- .; git clean -f .)
  ;;
  manual)
    init_repo
    echo "Patching the harness to use the policy..."
    sed -i 's/content="trusted-types \([^*]\)/content="trusted-types web-platform-tests-internal-unsafe \1/' $TESTS_REPO/trusted-types/*.html
    git -C $TESTS_REPO apply < $(dirname $0)/platform-tests.patch

    echo "Visit http://127.0.0.1:9999/trusted-types/ to view the tests."
    # Cleanup
    (cd $TESTS_REPO; python -m SimpleHTTPServer 9999; git checkout -- .; git clean -f .)
    ;;
  *)
    help
  ;;
esac
