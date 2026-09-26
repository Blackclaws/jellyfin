# Blackclaws Jellyfin fork

Upstream Jellyfin releases plus changes that are not (yet) merged upstream.
The web client lives in the matching fork, Blackclaws/jellyfin-web.

## Changes

- Per-library option to extract embedded subtitles during the library scan,
  plus the nightly "Extract Subtitles" task
  (branch `feature/library-subtitle-extraction` in both forks, based on upstream master).

## Branches

- `deploy/<version>` (e.g. `deploy/12.1`) in both forks: the upstream release tag
  `v<version>` with the fork's changes cherry-picked on top. Images are built from these.
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

## Moving to a new upstream release

1. In both forks: `git switch -c deploy/<new> v<new>` and cherry-pick the fork's commits.
2. In the server fork, cherry-pick the `.fork/` and workflow commit and update
   `.fork/build.env`: `JELLYFIN_VERSION`, `PACKAGING_REF` (the matching
   `v<new>-<timestamp>` tag of jellyfin-packaging), and the framework versions from
   its `build.yaml`.
3. Tag `<new>-dev.1` as above.
