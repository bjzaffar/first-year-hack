# Shared contracts

Status: UNSET. Record only actual shared interfaces. If none exist, say so.

For each API/shared type/provider boundary:

- Name, owner, consumer issues, and source-of-truth code/schema path.
- Request and response examples, field types, required/optional fields.
- Validation, status codes, error shape, empty/loading behavior.
- Auth expectations, if applicable.
- Mock/seed examples and how real integration replaces them.
- Compatibility implications and dependency ordering.

Integration coordinates changes before dependent sessions implement them. Prefer executable shared types/schemas when appropriate and link them here rather than duplicating all definitions. Mark proposed contracts separately from agreed ones.
