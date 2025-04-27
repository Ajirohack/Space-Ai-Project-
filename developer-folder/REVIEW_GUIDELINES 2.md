# REVIEW GUIDELINES for the-space Project

Place this file at the root of the the-space repository as `REVIEW_GUIDELINES.md`.

## Update Instructions & Guidelines

- **Do not delete existing code or start a new project entirely.** All work must be performed on the current codebase.
- **Only update and improve existing code.** Refactor, optimize, or extend functionality without removing core components unless explicitly required.
- **Maintain backward compatibility** wherever possible to avoid breaking existing features.
- **Document all changes**: Clearly comment code updates and update related documentation.
- **Follow project structure and conventions** as established in the current codebase and documentation.
- **Review existing documentation** (README, guidelines, directives) before making changes.
- **Checklist adherence**: Both AI coding models/LLMs and human developers must follow this checklist and these guidelines for all updates and improvements.


---

## Purpose
These guidelines instruct AI and human developers on how to perform a comprehensive review of every component in the the-space codebase.  
They define:
1. A consistent **Review Template** for each component.  
2. Rules to prevent duplicate files or conflicts.  
3. Integration requirements with the Control Center.  
4. Instructions for creating or updating system-prompt files for AI coding agents.

> **IMPORTANT:** Before making any changes, you **must** fully understand the existing code, file structure, and dependencies. If uncertainty remains, clarify with a human or use available tools (e.g., MCP context7, GitHub search) before proceeding.

---

## Review Template
Each component—frontend, backend, integration layer, Control Center module—must be reviewed using this template. Create a Markdown file named `COMPONENT_NAME-REVIEW.md` in the component’s root folder.

### Header
```md
# Component: COMPONENT_NAME
Path: /relative/path/to/component
Reviewed by: YOUR_NAME_OR_AGENT_ID
Date: YYYY-MM-DD
```

### Structure
- **Key files/folders**, **Dependencies**, **Control Center Integration** details, **Strengths & Risks**, **Recommendations**, **Action Items**, and **System Prompt for AI Agents**.

---

## Duplicate Prevention
- **Do Not** create duplicates.  
- **Update** existing code.  
- **Search** before adding.

---

## Workflow
1. Discover & Catalog  
2. Review  
3. Plan  
4. Execute  
5. Verify  
6. Commit  

---

## Central Directive
Add to `README.md`:
```md
> ⚠️ **Before contributing:** Read **REVIEW_GUIDELINES.md** and all `*-REVIEW.md` files.
```
