export interface TemplateDef {
  id: string;
  name: string;
  description: string;
  markdown: string;
}

const BASE = process.env.NEXT_PUBLIC_FRONTEND_URL ?? "";

const GITHUB_PROFILE = `# Hi there 👋

Welcome to my GitHub profile!

- 🔭 I am currently working on **awesome projects**
- 🌱 Currently learning **Next.js, TypeScript, React**
- 💬 Ask me about **web development, open source**
- 📫 How to reach me: **your-email@example.com**

---

## My Tech Stack

<!-- badge-group -->
![image](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![image](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![image](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![image](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![image](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![image](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![image](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)

---

## My GitHub Stats

![GitHub Stats](${BASE}/api/github/hussain-ahmed2/stats.svg)

---

## Featured Projects

### Project One
Description of your amazing project. Built with **React**, **Node.js**, and **MongoDB**.

### Project Two
Another awesome project you have worked on. Built with **Python** and **Flask**.

### Project Three
A third project that showcases your skills. Built with **TypeScript** and **Next.js**.
`;

const PROJECT_README = `# Project Name

> A brief description of what this project does and who it's for

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Features](#features)
- [Contributing](#contributing)
- [License](#license)

## Installation

\`\`\`bash
npm install my-project
# or
yarn add my-project
\`\`\`

## Usage

\`\`\`typescript
import { myFunction } from "my-project";

const result = myFunction({
  option1: true,
  option2: "value",
});

console.log(result);
\`\`\`

## Features

- **Feature 1:** Description of the first key feature
- **Feature 2:** Description of the second key feature
- **Feature 3:** Description of the third key feature

## API

### \`myFunction(options)\`

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| option1 | \`boolean\` | \`false\` | Enables feature A |
| option2 | \`string\` | \`"default"\` | Sets the mode |

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

[MIT](LICENSE)
`;

const API_DOCS = `# API Documentation

> Base URL: \`https://api.example.com/v1\`

## Authentication

All requests require an API key passed in the \`Authorization\` header:

\`\`\`
Authorization: Bearer YOUR_API_KEY
\`\`\`

## Endpoints

### GET /users

Returns a list of users.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | \`number\` | No | Page number (default: 1) |
| limit | \`number\` | No | Items per page (default: 20) |
| search | \`string\` | No | Search query |

**Response:**

\`\`\`json
{
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    }
  ],
  "total": 100,
  "page": 1
}
\`\`\`

### POST /users

Creates a new user.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | \`string\` | Yes | User's full name |
| email | \`string\` | Yes | User's email address |
| role | \`string\` | No | User role (default: "member") |

**Response:** \`201 Created\`

\`\`\`json
{
  "id": 101,
  "name": "Jane Smith",
  "email": "jane@example.com",
  "role": "member"
}
\`\`\`

### GET /users/:id

Returns a single user by ID.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | \`number\` | User ID |

**Response:** \`200 OK\`

### DELETE /users/:id

Deletes a user by ID.

**Response:** \`204 No Content\`

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request |
| 401 | Unauthorized |
| 404 | Not Found |
| 429 | Rate Limit Exceeded |
| 500 | Internal Server Error |
`;

const BLANK = `# Untitled
`;

const DEMO = `# ⚡ Next MD Editor - Ultimate Demo

Welcome to your next-generation, block-based markdown editor workspace. Designed for ultimate speed, visual excellence, and complete GFM compatibility.

---

> [!TIP]
> Use the left handle to drag and drop elements. Try selecting multiple blocks by holding **Shift** to perform bulk moves or bulk deletes!

---

### 🚀 Key Editor Features

* **Slash Commands Palette:** Press \`/\` inside a paragraph to trigger inline transformation controls.
* **Smart Keyboard Indentation:** Use \`Tab\` to indent lists or \`Shift+Tab\` to outdent them instantly.
* **Interactive Resizable Layouts:** Click and drag the left palette border or right preview border to resize sidebars to your liking.

---

### 🔢 List Formatting & Cycling Markers

1. Decimal list marker for root elements (e.g. \`1.\`, \`2.\`)
    1. Roman numeral marker for level 1 indentation (e.g. \`i.\`, \`ii.\`)
        1. Alphabetical marker for level 2 indentation (e.g. \`a.\`, \`b.\`)

---

### 🛠️ Developer Code Editor

\`\`\`ts
// High-performance tokenization pipeline
export function highlightCode(code: string, lang: string): string {
  const safe = escapeHtml(code);
  const stashed = stashComments(safe);
  return restoreTokens(applyRegex(stashed, lang));
}
\`\`\`

---

### 🏷️ My Tech Stack
_My current technology toolkit_

<!-- badge-group -->
![image](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![image](https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white)
![image](https://img.shields.io/badge/Kotlin-0095D5?style=for-the-badge&logo=kotlin&logoColor=white)
![image](https://img.shields.io/badge/Dart-0175C2?style=for-the-badge&logo=dart&logoColor=white)
![image](https://img.shields.io/badge/Flutter-02569B?style=for-the-badge&logo=flutter&logoColor=white)
![image](https://img.shields.io/badge/C-00599C?style=for-the-badge&logo=c&logoColor=white)
![image](https://img.shields.io/badge/C%2B%2B-00599C?style=for-the-badge&logo=cplusplus&logoColor=white)
![image](https://img.shields.io/badge/C%23-239120?style=for-the-badge&logo=csharp&logoColor=white)
![image](https://img.shields.io/badge/Java-ED8B00?style=for-the-badge&logo=java&logoColor=white)
![image](https://img.shields.io/badge/JavaScript-323330?style=for-the-badge&logo=javascript&logoColor=F7EF1E)
![image](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![image](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![image](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![image](https://img.shields.io/badge/JSON-5E5C5C?style=for-the-badge&logo=json&logoColor=white)
![image](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![image](https://img.shields.io/badge/Postman-FF6C37?style=for-the-badge&logo=postman&logoColor=white)
![image](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)
![image](https://img.shields.io/badge/Jira-0052CC?style=for-the-badge&logo=jira&logoColor=white)
![image](https://img.shields.io/badge/mac%20OS-000000?style=for-the-badge&logo=apple&logoColor=white)
![image](https://img.shields.io/badge/Wix-000000?style=for-the-badge&logo=wix&logoColor=white)
![image](https://img.shields.io/badge/Heroku-430098?style=for-the-badge&logo=heroku&logoColor=white)
![image](https://img.shields.io/badge/Google%20Cloud-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white)
![image](https://img.shields.io/badge/Android-3DDC84?style=for-the-badge&logo=android&logoColor=white)
![image](https://img.shields.io/badge/Windows-0078D6?style=for-the-badge&logo=windows&logoColor=white)
![image](https://img.shields.io/badge/Zorin%20OS-0CC1F3?style=for-the-badge&logo=zorin&logoColor=white)
![image](https://img.shields.io/badge/Arduino-00979D?style=for-the-badge&logo=arduino&logoColor=white)
![image](https://img.shields.io/badge/Google%20Play-414141?style=for-the-badge&logo=google-play&logoColor=white)
![image](https://img.shields.io/badge/Adobe%20XD-470137?style=for-the-badge&logo=adobe-xd&logoColor=white)

---

### 🌟 Design Grid Assets
_A showcase of visual abstract card grids inside a responsive 3-column container._

<!-- image-grid -->

<table>
<tr>
<td><img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop" alt="Fluid abstract shapes" /></td>
<td><img src="https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=600&auto=format&fit=crop" alt="Glossy 3D composition" /></td>
<td><img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=600&auto=format&fit=crop" alt="Architectural patterns" /></td>
</tr>
</table>
`;

export const TEMPLATES: TemplateDef[] = [
  {
    id: "github-profile",
    name: "GitHub Profile",
    description: "GitHub profile README with badges, stats, and projects",
    markdown: GITHUB_PROFILE,
  },
  {
    id: "project-readme",
    name: "Project README",
    description: "Standard project documentation with install, usage, API",
    markdown: PROJECT_README,
  },
  {
    id: "api-docs",
    name: "API Docs",
    description: "API endpoint documentation with request/response examples",
    markdown: API_DOCS,
  },
  {
    id: "blank",
    name: "Blank",
    description: "Start with an empty document",
    markdown: BLANK,
  },
  {
    id: "demo",
    name: "Demo",
    description: "Showcase all editor features and block types",
    markdown: DEMO,
  },
];
