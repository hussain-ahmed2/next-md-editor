export interface Badge {
  id: string;
  text: string;
  color: string;
  logo: string;
  url?: string;
}

export interface TechItem {
  text: string;
  color: string;
  logo: string;
}

export const TECH_LOGOS: TechItem[] = [
  // Programming Languages
  { text: "Python", color: "3776AB", logo: "python" },
  { text: "JavaScript", color: "F7DF1E", logo: "javascript" },
  { text: "TypeScript", color: "3178C6", logo: "typescript" },
  { text: "Go", color: "00ADD8", logo: "go" },
  { text: "Rust", color: "000000", logo: "rust" },
  { text: "C++", color: "00599C", logo: "cplusplus" },
  { text: "C#", color: "239120", logo: "csharp" },
  { text: "Java", color: "ED8B00", logo: "java" },
  { text: "Kotlin", color: "0095D5", logo: "kotlin" },
  { text: "Dart", color: "0175C2", logo: "dart" },
  { text: "Swift", color: "F05138", logo: "swift" },
  { text: "PHP", color: "777BB4", logo: "php" },
  { text: "Ruby", color: "CC342D", logo: "ruby" },
  { text: "Lua", color: "2C2D72", logo: "lua" },
  { text: "R", color: "276DC3", logo: "r" },
  { text: "Scala", color: "DC322F", logo: "scala" },
  { text: "Elixir", color: "4B275F", logo: "elixir" },
  { text: "C", color: "A8B9CC", logo: "c" },
  { text: "HTML5", color: "E34F26", logo: "html5" },
  { text: "CSS3", color: "1572B6", logo: "css3" },
  { text: "Sass", color: "CC6699", logo: "sass" },
  { text: "Shell Script", color: "89E051", logo: "gnu-bash" },
  { text: "PowerShell", color: "5391FE", logo: "powershell" },

  // Frontend Frameworks & UI Libraries
  { text: "React", color: "61DAFB", logo: "react" },
  { text: "Next.js", color: "000000", logo: "nextdotjs" },
  { text: "Vue.js", color: "4FC08D", logo: "vuedotjs" },
  { text: "Nuxt.js", color: "00DC82", logo: "nuxtdotjs" },
  { text: "Angular", color: "DD0031", logo: "angular" },
  { text: "Svelte", color: "FF3E00", logo: "svelte" },
  { text: "SolidJS", color: "2C4F7C", logo: "solid" },
  { text: "Remix", color: "000000", logo: "remix" },
  { text: "Gatsby", color: "663399", logo: "gatsby" },
  { text: "Tailwind CSS", color: "06B6D4", logo: "tailwindcss" },
  { text: "Bootstrap", color: "7952B3", logo: "bootstrap" },
  { text: "Material UI", color: "007FFF", logo: "mui" },
  { text: "Chakra UI", color: "319795", logo: "chakraui" },
  { text: "Ant Design", color: "0170FE", logo: "antdesign" },
  { text: "Radix UI", color: "161618", logo: "radixui" },

  // Backend Frameworks & Runtimes
  { text: "Node.js", color: "339933", logo: "nodedotjs" },
  { text: "Deno", color: "000000", logo: "deno" },
  { text: "Bun", color: "000000", logo: "bun" },
  { text: "Express", color: "000000", logo: "express" },
  { text: "Fastify", color: "000000", logo: "fastify" },
  { text: "NestJS", color: "E0234E", logo: "nestjs" },
  { text: "Flask", color: "000000", logo: "flask" },
  { text: "Django", color: "092E20", logo: "django" },
  { text: "FastAPI", color: "009688", logo: "fastapi" },
  { text: "Spring Boot", color: "6DB33F", logo: "springboot" },
  { text: ".NET", color: "512BD4", logo: "dotnet" },
  { text: "Laravel", color: "FF2D20", logo: "laravel" },
  { text: "Ruby on Rails", color: "CC0000", logo: "rubyonrails" },

  // Databases & Caching
  { text: "PostgreSQL", color: "4169E1", logo: "postgresql" },
  { text: "MySQL", color: "4479A1", logo: "mysql" },
  { text: "SQLite", color: "003B57", logo: "sqlite" },
  { text: "MariaDB", color: "003545", logo: "mariadb" },
  { text: "MongoDB", color: "47A248", logo: "mongodb" },
  { text: "Redis", color: "DC382D", logo: "redis" },
  { text: "Firebase", color: "FFCA28", logo: "firebase" },
  { text: "Supabase", color: "3ECF8E", logo: "supabase" },
  { text: "DynamoDB", color: "4053D6", logo: "amazondynamodb" },
  { text: "Cassandra", color: "1287B1", logo: "apachecassandra" },
  { text: "Neo4j", color: "008CC1", logo: "neo4j" },
  { text: "InfluxDB", color: "22ADF6", logo: "influxdb" },

  // DevOps & CI/CD
  { text: "Docker", color: "2496ED", logo: "docker" },
  { text: "Kubernetes", color: "326CE5", logo: "kubernetes" },
  { text: "Terraform", color: "7B42BC", logo: "terraform" },
  { text: "Ansible", color: "EE0000", logo: "ansible" },
  { text: "GitHub Actions", color: "2088FF", logo: "githubactions" },
  { text: "Jenkins", color: "D33833", logo: "jenkins" },
  { text: "CircleCI", color: "343434", logo: "circleci" },
  { text: "Travis CI", color: "3EAAAF", logo: "travisci" },

  // Cloud Providers & Hosting
  { text: "AWS", color: "FF9900", logo: "amazonwebservices" },
  { text: "Google Cloud", color: "4285F4", logo: "googlecloud" },
  { text: "Azure", color: "0078D4", logo: "microsoftazure" },
  { text: "Cloudflare", color: "F38020", logo: "cloudflare" },
  { text: "DigitalOcean", color: "0080FF", logo: "digitalocean" },
  { text: "Vercel", color: "000000", logo: "vercel" },
  { text: "Netlify", color: "00C7B7", logo: "netlify" },
  { text: "Heroku", color: "430098", logo: "heroku" },
  { text: "GitHub Pages", color: "222222", logo: "github" },

  // Development Tools, Package Managers, APIs
  { text: "Git", color: "F05032", logo: "git" },
  { text: "GitHub", color: "181717", logo: "github" },
  { text: "GitLab", color: "FCA121", logo: "gitlab" },
  { text: "Bitbucket", color: "0052CC", logo: "bitbucket" },
  { text: "npm", color: "CB3837", logo: "npm" },
  { text: "pnpm", color: "F9AD19", logo: "pnpm" },
  { text: "Yarn", color: "2C8EBB", logo: "yarn" },
  { text: "Webpack", color: "8DD6F9", logo: "webpack" },
  { text: "Vite", color: "646CFF", logo: "vite" },
  { text: "Electron", color: "47848F", logo: "electron" },
  { text: "GraphQL", color: "E10098", logo: "graphql" },
  { text: "Postman", color: "FF6C37", logo: "postman" },
  { text: "Swagger", color: "85EA2D", logo: "swagger" },
  { text: "OpenAPI", color: "6BA539", logo: "openapiinitiative" },
  { text: "Apollo GraphQL", color: "311C87", logo: "apollographql" },

  // Monitoring, Analytics, Design
  { text: "Prometheus", color: "E6522C", logo: "prometheus" },
  { text: "Grafana", color: "F46800", logo: "grafana" },
  { text: "Elasticsearch", color: "005571", logo: "elasticsearch" },
  { text: "Sentry", color: "362D59", logo: "sentry" },
  { text: "Jira", color: "0052CC", logo: "jira" },
  { text: "Figma", color: "F24E1E", logo: "figma" },
  { text: "Adobe XD", color: "FF61F6", logo: "adobexd" },
  { text: "Photoshop", color: "31A8FF", logo: "adobephotoshop" },

  // Machine Learning, AI & Data Science
  { text: "PyTorch", color: "EE4C2C", logo: "pytorch" },
  { text: "TensorFlow", color: "FF6F00", logo: "tensorflow" },
  { text: "Keras", color: "D00000", logo: "keras" },
  { text: "Jupyter", color: "F37626", logo: "jupyter" },
  { text: "Pandas", color: "150458", logo: "pandas" },
  { text: "NumPy", color: "013243", logo: "numpy" },
  { text: "OpenCV", color: "5C3EE8", logo: "opencv" },
  { text: "OpenAI", color: "412991", logo: "openai" },
  { text: "Hugging Face", color: "FFD21E", logo: "huggingface" },

  // Collaboration & Chat OS / Hardware
  { text: "Slack", color: "4A154B", logo: "slack" },
  { text: "Discord", color: "5865F2", logo: "discord" },
  { text: "Notion", color: "000000", logo: "notion" },
  { text: "Trello", color: "0079BF", logo: "trello" },
  { text: "Linux", color: "FCC624", logo: "linux" },
  { text: "Debian", color: "A81D33", logo: "debian" },
  { text: "Arch Linux", color: "1793D1", logo: "archlinux" },
  { text: "Ubuntu", color: "E95420", logo: "ubuntu" },
  { text: "Windows", color: "0078D6", logo: "windows" },
  { text: "macOS", color: "000000", logo: "apple" },
  { text: "Android", color: "3DDC84", logo: "android" },
  { text: "iOS", color: "000000", logo: "ios" },
  { text: "Raspberry Pi", color: "A22846", logo: "raspberrypi" },
  { text: "Arduino", color: "00979D", logo: "arduino" },
];

export function buildShieldsUrl(badge: Omit<Badge, "id">): string {
  const label = encodeURIComponent(badge.text.replace(/-/g, "--"));
  const color = badge.color.replace("#", "");
  const logo = badge.logo ? `&logo=${encodeURIComponent(badge.logo)}&logoColor=white` : "";
  return `https://img.shields.io/badge/${label}-${color}?style=for-the-badge${logo}`;
}
