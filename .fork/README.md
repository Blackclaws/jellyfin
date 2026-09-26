# Blackclaws Jellyfin fork

Upstream Jellyfin releases plus changes that are not (yet) merged upstream.
The web client lives in the matching fork, Blackclaws/jellyfin-web.

## Changes

- Per-library option to extract embedded subtitles during the library scan,
  plus the nightly "Extract Subtitles" task
  (branch `feature/library-subtitle-extraction` in both forks, based on upstream master).

## Branches

- `deploy/<version>` (e.g. `deploy/12.1`) in both forks: upstream's stable branch
  `release-<major>.z` (released code plus fixes queued for the next patch release) with
  the fork's changes on top. Images are built from these.
- `feature/*`: the changes themselves, based on upstream master, for upstream PRs.

## Building an image

Tag the same commit name in **both** forks and push the tags:

```sh
# in jellyfin-web, on deploy/12.1
git tag 12.1-dev.1 && git push fork 12.1-dev.1
# in jellyfin, on deploy/12.1
git tag 12.1-dev.1 && git push fork 12.1-dev.1
```

Push the web tag first: the server tag triggers `.github/workflows/fork-image.yml`,
which fails early if the web tag is missing or the tag does not start with
`JELLYFIN_VERSION` from `.fork/build.env`.

The workflow runs the unmodified `docker/Dockerfile` of upstream's
`jellyfin/jellyfin-packaging` at `PACKAGING_REF`, with the fork's server and web
sources in place of its submodules, and pushes `ghcr.io/blackclaws/jellyfin:<tag>`
(linux/amd64 only).

## Picking up upstream fixes

In both forks, rebase the deploy branch onto the latest stable branch, then tag the
next `-dev.N`:

```sh
git fetch origin && git rebase origin/release-12.z deploy/12.1
git push --force-with-lease fork deploy/12.1
```

## Moving to a new upstream release

For a new patch release (12.1.x) nothing changes: it is cut from the same stable branch.
When upstream releases a new minor or major version:

1. In both forks: `git switch -c deploy/<new> origin/release-<major>.z` (or the
   `v<new>` tag if you only want released code) and cherry-pick the fork's commits.
2. In the server fork, cherry-pick the `.fork/` and workflow commit and update
   `.fork/build.env`: `JELLYFIN_VERSION`, `PACKAGING_REF` (the matching
   `v<new>-<timestamp>` tag of jellyfin-packaging), and the framework versions from
   its `build.yaml`.
3. Tag `<new>-dev.1` as above.

Avoid basing a deploy branch on upstream `master`: it is the next major version in
development, and its database migrations cannot be undone by going back to a release.
