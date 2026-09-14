# Release and maintainer checklist

- [ ] Complete gaps in status.md, especially output schemas, worker lifecycle and safe IDE merge.
- [ ] Run all checks on clean Windows, macOS and Linux CI; review tarball contents.
- [ ] Test actual Cursor, Codex and VS Code clients and record versions.
- [ ] Verify ownership and availability of @akifsen and io.github.akifsen/art-director.
- [ ] Configure repository, security reporting channel, npm publisher identity and protected release environment with the maintainer.
- [ ] Recheck https://docs.npmjs.com/trusted-publishers/ for supported provider, npm/Node minimums and OIDC identity. No token or publisher has been configured by this task.
- [ ] Obtain explicit maintainer authorization for npm and MCP Registry publication; local pack/install is not publication.
- [ ] Validate server.json against the current official Registry schema and ensure its package exists before submitting.

Never run an automatic publish from pull requests. Keep lockfiles pinned. Browser binary installation is opt-in. Review dependency licenses and SECURITY.md limitations before release.
