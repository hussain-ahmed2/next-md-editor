export interface PromptTemplate {
  label: string;
  description: string;
  prompt: string;
}

export const README_PROMPTS: PromptTemplate[] = [
  {
    label: "Comprehensive",
    description: "Full README with all standard sections",
    prompt:
      "Generate a comprehensive README with title, description, features, installation, usage, API reference, contributing guide, and license sections.",
  },
  {
    label: "Minimal + Quick Start",
    description: "Badges, quick start, and basic usage",
    prompt:
      "Generate a minimal README with badges, a quick start guide, and basic usage examples.",
  },
  {
    label: "React Library",
    description: "Props table + usage examples",
    prompt:
      "Generate a README for a React library — include installation, a props table, and usage examples.",
  },
  {
    label: "CLI Tool",
    description: "Commands reference + configuration",
    prompt:
      "Generate a README for a command-line tool — include installation, commands reference, and configuration.",
  },
  {
    label: "REST API",
    description: "Endpoints + auth + error handling",
    prompt:
      "Generate a README for a REST API — include authentication, endpoint documentation, and error handling.",
  },
  {
    label: "Next.js App",
    description: "Setup + env vars + deployment",
    prompt:
      "Generate a README for a Next.js web app — include setup, environment variables, and deployment.",
  },
  {
    label: "Python Library",
    description: "Install + quick start + API ref",
    prompt:
      "Generate a README for a Python library — include installation, quick start, and API reference.",
  },
  {
    label: "Database Project",
    description: "Schema + migrations + queries",
    prompt:
      "Generate a README for a database project — include schema overview, migrations, and query examples.",
  },
];
