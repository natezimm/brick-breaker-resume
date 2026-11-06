# Security policy

## Reporting a vulnerability

Please report security problems privately, not in a public issue: use **Report a vulnerability** on this repository's [Security tab](https://github.com/natezimm/brick-breaker-resume/security/advisories/new). Include what you found, how to reproduce it and what it lets someone do. You should hear back within a week.

The game is a static site with no accounts or server-side data, so the browser is the main place a problem can show up, such as script injection. You are welcome to test [resume.nathanzimmerman.com](https://resume.nathanzimmerman.com) gently, but please do not run load tests or try to reach the server itself.

## Supported versions

Only what is on `main` is supported; every merge to `main` deploys.
