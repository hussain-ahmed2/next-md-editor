# Custom behavioral rules for the agent

- **No any type**: Never use the `any` type anywhere in the codebase under any circumstances (including type casting, parameters, or variables). Use explicit types, type assertion with specific types, or `unknown` combined with type guards.

- **Always check types and lint**: As a strict action before completing any task, you must always run `npm run lint` and `npm run test` (or your typecheck command) to verify that no `any` types were introduced and that the codebase passes all linting and type checks.

- **Add comments properly**: Ensure all code changes are well-documented with clear and proper comments explaining the logic and 'why' behind complex implementations.
