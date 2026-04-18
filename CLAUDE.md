# CLAUDE.md

This file provides guidance for AI assistants (like Claude) working in this repository.

## Repository Overview

**desktop-tutorial** is a GitHub Desktop starter/tutorial repository owned by `xxxkouxxx`. It was initialized in June 2020 as a minimal template using GitHub Desktop's new-repository wizard. The repository currently contains no application source code — it is a blank slate suitable for experimentation or tutorial purposes.

- **Owner:** xxxkouxxx
- **Default branch:** master
- **Remote:** https://github.com/xxxkouxxx/desktop-tutorial

## Repository Structure

```
desktop-tutorial/
├── CLAUDE.md       # AI assistant guidance (this file)
└── README.md       # Project description placeholder
```

No build system, package manager, test framework, or CI/CD pipeline exists yet. When files are added to the project, update this document to reflect the new structure and conventions.

## Development Workflow

### Branches

- `master` — default/main branch; stable state
- Feature branches follow the pattern: `claude/<short-description>-<id>` (e.g. `claude/add-claude-documentation-GPPv8`)

### Making Changes

1. Check out or create your feature branch from `master`
2. Make changes, commit with a descriptive message
3. Push with `git push -u origin <branch-name>`
4. Open a **draft pull request** targeting `master` immediately after pushing
5. Mark the PR ready for review only when the work is complete

### Commit Messages

- Use imperative mood: "Add X", "Fix Y", "Update Z"
- Keep the subject line under 72 characters
- Reference issues or PRs where relevant

### Pull Requests

- Always open as draft first
- Title should be short and descriptive (under 70 characters)
- Body should include a summary and a testing checklist
- Do not force-push to `master`

## Common Git Commands

```bash
# Check current status
git status

# Stage and commit
git add <file>
git commit -m "Your message"

# Push a new branch
git push -u origin <branch-name>

# Pull latest from master
git pull origin master
```

## Notes for AI Assistants

- **This is a template repo** with no production code. There are no build, lint, or test commands to run.
- When adding source code to this repository, update the **Repository Structure** section above and document any build/test commands in a **Development Commands** section.
- Always develop on the designated feature branch (never commit directly to `master`).
- After pushing, always create a draft PR via the GitHub MCP tools (`mcp__github__create_pull_request`).
- Keep this file up to date as the project evolves — it is the primary reference for future AI sessions.
