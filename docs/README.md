# Server-Sent Events - Documentation

Welcome to the comprehensive documentation for this Server-Sent Events (SSE) implementation.

## 📚 Table of Contents

### Getting Started
- [Main README](../README.md) - Project overview and quick start
- [Testing Guide](TESTING.md) - How to run tests and write new ones

### Client-Side (Observable Pattern)

#### Core Documentation
- **[Observable Pattern Guide](OBSERVABLE_PATTERN.md)** - Complete guide to the Observable pattern
- **[Observable README](OBSERVABLE_README.md)** - Getting started with Observables
- **[Quick Reference](QUICK_REFERENCE.md)** - Cheat sheet for daily use
- **[Observable Refactor](OBSERVABLE_REFACTOR.md)** - Migration from effect-based to Observable pattern

#### Visual Documentation
- **[Observable Diagrams](OBSERVABLE_DIAGRAMS.md)** - All architecture diagrams with explanations

### Server-Side
- **[Server SSE Implementation](SERVER_SSE.md)** - Server-side SSE helper documentation

### Project History
- **[Refactor Summary](REFACTOR_SUMMARY.md)** - Historical refactoring changes

---

## 🎯 Quick Links by Topic

### For Beginners

Start here if you're new to this project:

1. [Main README](../README.md) - Overview and setup
2. [Observable README](OBSERVABLE_README.md) - Introduction to the Observable pattern
3. [Quick Reference](QUICK_REFERENCE.md) - Common patterns and examples

### For Developers

Working with the codebase:

1. [Observable Pattern Guide](OBSERVABLE_PATTERN.md) - Deep dive into architecture
2. [Testing Guide](TESTING.md) - Writing and running tests
3. [Observable Diagrams](OBSERVABLE_DIAGRAMS.md) - Visual architecture reference

### For Migration

Updating from old code:

1. [Observable Refactor](OBSERVABLE_REFACTOR.md) - Migration guide
2. [Refactor Summary](REFACTOR_SUMMARY.md) - What changed and why

---

## 📊 Diagrams

All Mermaid diagrams are located in [`diagrams/`](diagrams/):

### Client-Side (Observable Pattern)
- [`observable-architecture.mmd`](diagrams/observable-architecture.mmd) - Main Observable architecture
- [`observable-dataflow.mmd`](diagrams/observable-dataflow.mmd) - Sequence diagram of data flow
- [`pattern-comparison.mmd`](diagrams/pattern-comparison.mmd) - Old vs new pattern comparison
- [`multiple-subscribers.mmd`](diagrams/multiple-subscribers.mmd) - Multiple subscriber pattern
- [`observable-lifecycle.mmd`](diagrams/observable-lifecycle.mmd) - Observable state machine
- [`operator-chaining.mmd`](diagrams/operator-chaining.mmd) - Operator transformation example
- [`client-time-flow.mmd`](diagrams/client-time-flow.mmd) - Time client implementation flow

### Server-Side
- [`server-sse-architecture.mmd`](diagrams/server-sse-architecture.mmd) - Server SSE architecture
- [`server-sse-lifecycle.mmd`](diagrams/server-sse-lifecycle.mmd) - Server SSE broadcast lifecycle
- [`server-sse-shutdown.mmd`](diagrams/server-sse-shutdown.mmd) - Graceful shutdown process
- [`server-hooks.mmd`](diagrams/server-hooks.mmd) - Server hooks system

See [`diagrams/README.md`](diagrams/README.md) for details on viewing and editing diagrams.

---

## 🔍 Documentation by File Type

### Markdown Files (.md)

| File | Description |
|------|-------------|
| [OBSERVABLE_PATTERN.md](OBSERVABLE_PATTERN.md) | Complete Observable pattern documentation |
| [OBSERVABLE_README.md](OBSERVABLE_README.md) | Observable getting started guide |
| [OBSERVABLE_REFACTOR.md](OBSERVABLE_REFACTOR.md) | Refactor summary and migration guide |
| [OBSERVABLE_DIAGRAMS.md](OBSERVABLE_DIAGRAMS.md) | Visual architecture guide with diagrams |
| [QUICK_REFERENCE.md](QUICK_REFERENCE.md) | Quick reference cheat sheet |
| [SERVER_SSE.md](SERVER_SSE.md) | Server-side SSE documentation |
| [TESTING.md](TESTING.md) | Testing guide and best practices |
| [REFACTOR_SUMMARY.md](REFACTOR_SUMMARY.md) | Historical refactoring information |

### Diagram Files (.mmd)

All Mermaid diagrams are in the [`diagrams/`](diagrams/) directory.

---

## 🎨 Documentation Standards

### Writing Style
- Use clear, concise language
- Include code examples for concepts
- Provide both simple and advanced examples
- Link to related documentation

### Code Examples
- Use actual project code when possible
- Include comments explaining non-obvious parts
- Show both the pattern and anti-pattern
- Test all code examples

### Diagrams
- Use consistent color scheme (see [OBSERVABLE_DIAGRAMS.md](OBSERVABLE_DIAGRAMS.md))
- One diagram per `.mmd` file
- Embed diagrams in markdown docs with proper code fences
- Include legend/explanation with each diagram

### File Organization
- Keep related docs together
- Use descriptive filenames (kebab-case)
- Maintain this index when adding new docs
- Archive outdated documentation, don't delete

---

## 🚀 Contributing to Documentation

When adding or updating documentation:

1. **Add new files to appropriate section** in this index
2. **Update related documents** if structure changes
3. **Test code examples** to ensure they work
4. **Validate Mermaid diagrams** before committing
5. **Follow naming conventions**:
   - Docs: `UPPERCASE_WITH_UNDERSCORES.md`
   - Diagrams: `lowercase-with-dashes.mmd`
6. **Add cross-references** to related documentation

---

## 📞 Need Help?

- Check the [Quick Reference](QUICK_REFERENCE.md) for common patterns
- Review [Observable Diagrams](OBSERVABLE_DIAGRAMS.md) for visual guides
- See [Testing Guide](TESTING.md) for testing examples
- Read the [Main README](../README.md) for project overview

---

## 📋 Documentation Checklist

When creating new features:

- [ ] Update relevant markdown docs
- [ ] Create/update diagrams if architecture changes
- [ ] Add code examples to demonstrate usage
- [ ] Update this index
- [ ] Add tests (see [TESTING.md](TESTING.md))
- [ ] Update [Quick Reference](QUICK_REFERENCE.md) if adding common patterns
- [ ] Cross-reference related documentation

---

**Last Updated**: October 11, 2025  
**Version**: 2.0 (Observable Pattern Implementation)
