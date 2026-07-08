# Custom behavioral rules for the agent

- **No any type**: Never use the `any` type anywhere in the codebase under any circumstances (including type casting, parameters, or variables). Use explicit types, type assertion with specific types, or `unknown` combined with type guards.

- **Always verify before completion**: As a strict action before completing ANY task, you must always run `npm run lint`, your type checking command (like `tsc` or `npm run typecheck`), and `npm run build` to verify that no regressions were introduced and the codebase builds perfectly.

- **Add comments properly**: Ensure all code changes are well-documented with clear and proper comments explaining the logic and 'why' behind complex implementations.

- **Tests location**: Always write test files inside the designated __tests__ or tests folders within the relevant package or app. Never create test scripts in the project root. Ensure you keep those test files around (do not delete them after testing).

- **Small reusable components**: Break down large React components into smaller, highly reusable subcomponents in separate files to keep code concise and maintainable.  