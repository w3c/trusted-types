# Web Platform Incubator Community Group

This repository is being used for work in the Web Platform Incubator Community Group, governed by the [W3C Community License
Agreement (CLA)](http://www.w3.org/community/about/agreements/cla/). To contribute, you must join
the CG.

If you are not the sole contributor to a contribution (pull request), please identify all
contributors in the pull request's body or in subsequent comments.

To add a contributor (other than yourself, that's automatic), mark them one per line as follows:

```
+@github_username
```

If you added a contributor by mistake, you can remove them in a comment with:

```
-@github_username
```

If you are making a pull request on behalf of someone else but you had no part in designing the
feature, you can remove yourself with the above syntax.

# Tests

For normative changes, a corresponding
[web-platform-tests](https://github.com/web-platform-tests/wpt) PR is highly appreciated. Typically,
both PRs will be merged at the same time. Note that a test change that contradicts the spec should
not be merged before the corresponding spec change. If testing is not practical, please explain why
and if appropriate [file an issue](https://github.com/web-platform-tests/wpt/issues/new) to follow
up later. Add the `type:untestable` or `type:missing-coverage` label as appropriate.

# Spec Changes

If you would like to propose a spec change, please send a PR that changes
[spec/index.bs][] *and* regenerate [dist/spec/index.html][].

Here's a workflow to get you started:

1.  Fork github.com/WICG/trusted-types
1.  `git clone` your fork and `cd trusted-types`
1.  `npm install` to get everything set up.
1.  Run `git checkout -b your-branch-name` to setup a branch to hold your patch.
1.  Optionally, [install bikeshed](https://tabatkins.github.io/bikeshed/#installing)
1.  Run `node_modules/.bin/gulp spec.watch` which will regnerate `dist/spec/index.html`
    every time you modify [spec/index.bs][].
1.  Open a browser to your local [dist/spec/index.html][].
1.  Until you're happy, make edits to your local [spec/index.bs][].
    To help, you might refer to:
    *   The [bikeshed docs](https://tabatkins.github.io/bikeshed/)
    *   The [bikeshed doc source](https://github.com/tabatkins/bikeshed/blob/master/docs/index.bs)
        which shows bikeshed in practice.
    *   The source for the other specifications like
        [CSP3](https://github.com/w3c/webappsec-csp/blob/master/index.src.html)
1.  Be aware of [issue 112](https://github.com/WICG/trusted-types/issues/112) if you're
    having trouble with the watcher.
1.  Maybe locally enable
    [`Complain About: broken-links yes`](https://github.com/WICG/trusted-types/blob/9445a47f720f255d066621ba6975228e558453f5/spec/index.bs#L18)
    and double check that there are no broken links.
    Broken-link checking is slooow during development.
1.  Commit and push your branch to your fork and send us a PR.
1.  Check the PR to see if bots need you to sign any contributor agreements.

Once your PR is merged, it'll be available at
https://wicg.github.io/trusted-types/dist/spec/
but if you want a shareable link to your PR, try filling in the blanks:

> <tt>https\://raw.githack.com/<b>\<YOUR-GITHUB-HANDLE\></b>/trusted-types/<b>\<YOUR-BRANCH-NAME\></b>/dist/spec/index.html</tt>


[spec/index.bs]: https://github.com/WICG/trusted-types/blob/master/spec/index.bs
[dist/spec/index.html]: https://github.com/WICG/trusted-types/blob/master/dist/spec/index.html
