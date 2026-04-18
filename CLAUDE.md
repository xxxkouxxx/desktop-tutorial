# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

**desktop-tutorial** is a GitHub Desktop starter/tutorial repository owned by `xxxkouxxx`. It contains no application source code — it is a blank template with no build system, package manager, test framework, or CI/CD pipeline. There are no build, lint, or test commands to run.

- **Owner:** xxxkouxxx
- **Default branch:** master
- **Remote:** https://github.com/xxxkouxxx/desktop-tutorial

## Development Workflow

- Feature branches follow the pattern: `claude/<short-description>-<id>` (e.g. `claude/add-claude-documentation-GPPv8`)
- Always develop on a feature branch — never commit directly to `master`
- Push with `git push -u origin <branch-name>`
- After pushing, immediately open a **draft pull request** targeting `master` via `mcp__github__create_pull_request`

## Notes for AI Assistants

- When adding source code, update the **Repository Overview** section above and add a **Development Commands** section documenting how to build, lint, and test.
- Keep this file current — it is the primary reference for future AI sessions.
