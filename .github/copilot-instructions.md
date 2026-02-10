# Face Match - GitHub Copilot Instructions

## AI Assistant Workflow Guidelines

### Git Workflow

- **Never auto-commit changes** - Let the user review and commit when ready
- Only run `git commit` commands when explicitly requested
- Before committing, always run: `npm run build`, `npm test`, `npm run lint`
- Only proceed with commit if all checks pass

### Package Management

- **Always ask before installing packages**
- Explain package purpose, size, and alternatives
- Let user decide whether to proceed

### Opinion vs Implementation

- When user asks for opinions/suggestions, provide recommendations but **wait for approval before implementing**
- Example phrases: "What do you think?", "How would you improve?", "Any suggestions?"

### Context7 MCP Usage

- **Always use Context7 MCP** when user needs library/API documentation, code generation, setup or configuration steps
- Do not wait for explicit requests - proactively use Context7 for technical documentation and code examples
- Use `mcp_io_github_ups_resolve-library-id` to find the correct library ID
- Use `mcp_io_github_ups_get-library-docs` to fetch documentation and examples
- Prioritize libraries with High source reputation and high benchmark scores
