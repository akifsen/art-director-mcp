# Security

Development preview. Report vulnerabilities privately at https://github.com/akifsen/art-director-mcp/security/advisories/new. Do not open public issues containing secrets or exploit details.

The startup root is fixed. Tool paths cannot broaden it. Traversal, drive paths, UNC paths, symlinks/junctions and known secret/config directories are rejected; inspection never returns source bodies. Artifacts are content-addressed and project-scoped. Repo and page instructions are data, not authority.

Atomic renames and an exclusive contract lock prevent normal concurrent writers from losing updates. A process crash can leave a lock; do not automatically remove it without confirming no writer remains. Multiple output files are not a transactional filesystem snapshot; contract.json is the final authoritative commit.

Do not run against untrusted actively mutating workspaces as an OS sandbox substitute. Symlink checks cannot eliminate all cross-process TOCTOU races or hardlink attacks. Use a dedicated OS account/container for adversarial filesystems. Browser routing is a local development policy, not a browser exploit boundary. Per-workspace cross-process worker quotas and comprehensive cancellation/crash handling remain release gates.

The worker blocks service workers, WebSockets and unlisted HTTP origins, including redirect destinations. Only numeric loopback hosts are accepted to avoid DNS rebinding. No personal browser profile, shell, user-supplied JavaScript or arbitrary application startup is accepted via tools.

Screenshots and DOM findings may contain private data. Masks apply to pixels only. There is no remote upload or telemetry, but IDE tool responses can reach the IDE's provider. Retention cleanup remains manual.
