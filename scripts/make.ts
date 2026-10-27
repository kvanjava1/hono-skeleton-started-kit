import { createMigrationFile } from "./migrations/utils.ts";
import { createSeederFile } from "./seeders/utils.ts";
import * as fs from "fs";
import * as path from "path";

const args = process.argv.slice(2);
const type = args[0];

const printUsage = () => {
  console.log(`
Make CLI (Laravel-style Modular Scaffolder)

Usage:
  bun run make <type> [args...]

Available Types:
  domain         Scaffold a complete domain bundle (Web + API + Service + Repository + Validation)
  controller     Create a new controller (<web|api> <domain> [name])
  service        Create a new service (<domain> [name])
  repository     Create a new repository (<domain> [name])
  validation     Create a new Zod request validation schema (<domain> [name])
  migration      Create a new migration file (<target> <name>)
  seeder         Create a new seeder file (<target> <name>)
  job            Create a new background job handler (<name>)

Targets for migration/seeder:
  mysql, mongo, pg, sqlite

Examples:
  bun run make domain article
  bun run make controller api article
  bun run make controller web article
  bun run make service article
  bun run make repository article
  bun run make validation article
  bun run make migration pg add_users_table
  bun run make seeder pg UserSeeder
  bun run make job SendEmail
`);
};

if (
  !type ||
  ![
    "domain",
    "migration",
    "seeder",
    "controller",
    "service",
    "repository",
    "schema",
    "validation",
    "job",
    "help",
  ].includes(type) ||
  type === "help"
) {
  printUsage();
  process.exit(0);
}

// --- Helpers ---

function toPascalCase(str: string): string {
  return str
    .replace(/[-_](\w)/g, (_, c) => c.toUpperCase())
    .replace(/^(\w)/, (_, c) => c.toUpperCase());
}

function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function cleanSuffix(str: string, suffix: string): string {
  if (str.toLowerCase().endsWith(suffix.toLowerCase())) {
    return str.slice(0, -suffix.length);
  }
  return str;
}

function getStub(stubName: string, replacements: Record<string, string>) {
  const stubPath = path.join("./scripts/stubs", stubName);
  if (!fs.existsSync(stubPath)) {
    throw new Error(`Stub not found: ${stubPath}`);
  }
  let content = fs.readFileSync(stubPath, "utf-8");
  for (const [key, value] of Object.entries(replacements)) {
    content = content.replace(new RegExp(`{{${key}}}`, "g"), value);
  }
  return content;
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function writeFileSafely(filePath: string, content: string) {
  if (fs.existsSync(filePath)) {
    throw new Error(`File already exists: ${filePath}`);
  }
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf-8");
}

// --- Generators ---

function createControllerFile(
  kind: "api" | "web",
  domain: string,
  rawName?: string,
) {
  const baseName = rawName || domain;
  const clean = cleanSuffix(baseName, ".controller");
  const fileName = `${toCamelCase(clean)}.controller.ts`;
  const filePath = `./src/controllers/${kind}/${domain}/${fileName}`;

  const stubName = kind === "api" ? "controller-api.stub" : "controller-web.stub";
  const template = getStub(stubName, {
    DOMAIN: domain,
    LOWER_NAME: toCamelCase(clean),
    PASCAL_NAME: toPascalCase(clean),
    CAMEL_NAME: toCamelCase(clean),
  });

  writeFileSafely(filePath, template);
  return filePath;
}

function createRouterFile(
  kind: "api" | "web",
  domain: string,
  rawName?: string,
) {
  const baseName = rawName || domain;
  const clean = cleanSuffix(baseName, ".router");
  const fileName = `${toCamelCase(clean)}.router.ts`;
  const filePath = `./src/routes/${kind}/${domain}/${fileName}`;

  const stubName = kind === "api" ? "router-api.stub" : "router-web.stub";
  const template = getStub(stubName, {
    DOMAIN: domain,
    LOWER_NAME: toCamelCase(clean),
    PASCAL_NAME: toPascalCase(clean),
    CAMEL_NAME: toCamelCase(clean),
  });

  writeFileSafely(filePath, template);
  return filePath;
}

function createServiceFile(domain: string, rawName?: string) {
  const baseName = rawName || domain;
  const clean = cleanSuffix(baseName, ".service");
  const fileName = `${toCamelCase(clean)}.service.ts`;
  const filePath = `./src/services/${domain}/${fileName}`;

  const template = getStub("service.stub", {
    DOMAIN: domain,
    LOWER_NAME: toCamelCase(clean),
    PASCAL_NAME: toPascalCase(clean),
    CAMEL_NAME: toCamelCase(clean),
  });

  writeFileSafely(filePath, template);
  return filePath;
}

function createRepositoryFile(domain: string, rawName?: string) {
  const baseName = rawName || domain;
  const clean = cleanSuffix(baseName, ".repository");
  const fileName = `${toCamelCase(clean)}.repository.ts`;
  const filePath = `./src/repositories/${domain}/${fileName}`;

  const template = getStub("repository.stub", {
    DOMAIN: domain,
    LOWER_NAME: toCamelCase(clean),
    PASCAL_NAME: toPascalCase(clean),
    CAMEL_NAME: toCamelCase(clean),
  });

  writeFileSafely(filePath, template);
  return filePath;
}

function createValidationFile(domain: string, rawName?: string) {
  const baseName = rawName || domain;
  const clean = cleanSuffix(
    cleanSuffix(baseName, ".validation"),
    ".schema",
  );
  const fileName = `${toCamelCase(clean)}.validation.ts`;
  const filePath = `./src/validations/${domain}/${fileName}`;

  const template = getStub("validation.stub", {
    DOMAIN: domain,
    LOWER_NAME: toCamelCase(clean),
    PASCAL_NAME: toPascalCase(clean),
    CAMEL_NAME: toCamelCase(clean),
  });

  writeFileSafely(filePath, template);
  return filePath;
}

function createJobFile(name: string) {
  const clean = cleanSuffix(name, ".job");
  const fileName = `${toCamelCase(clean)}.job.ts`;
  const filePath = `./src/jobs/${fileName}`;

  const template = getStub("job.stub", {
    NAME: name,
    LOWER_NAME: toCamelCase(clean),
  });

  writeFileSafely(filePath, template);
  return filePath;
}

// --- Runner ---

const run = async () => {
  try {
    switch (type) {
      case "domain": {
        const domain = args[1];
        if (!domain) throw new Error("Usage: bun run make domain <domain>");

        console.log(`Scaffolding domain bundle for "${domain}"...`);
        const cApiPath = createControllerFile("api", domain);
        const cWebPath = createControllerFile("web", domain);
        const rApiPath = createRouterFile("api", domain);
        const rWebPath = createRouterFile("web", domain);
        const sPath = createServiceFile(domain);
        const repoPath = createRepositoryFile(domain);
        const vPath = createValidationFile(domain);

        console.log(`  ✓ Controller (API): ${cApiPath}`);
        console.log(`  ✓ Controller (Web): ${cWebPath}`);
        console.log(`  ✓ Route (API):      ${rApiPath}`);
        console.log(`  ✓ Route (Web):      ${rWebPath}`);
        console.log(`  ✓ Service:          ${sPath}`);
        console.log(`  ✓ Repository:       ${repoPath}`);
        console.log(`  ✓ Validation:       ${vPath}`);
        console.log(`\nDomain "${domain}" scaffolded successfully!`);
        break;
      }

      case "controller": {
        let kind: "api" | "web" = "api";
        let domain = args[1];
        let name = args[2];

        if (args[1]?.toLowerCase() === "api" || args[1]?.toLowerCase() === "web") {
          kind = args[1].toLowerCase() as "api" | "web";
          domain = args[2];
          name = args[3];
        }

        if (!domain) {
          throw new Error("Usage: bun run make controller [api|web] <domain> [name]");
        }

        const cPath = createControllerFile(kind, domain, name);
        console.log(`Created controller (${kind}): ${cPath}`);
        break;
      }

      case "service": {
        const domain = args[1];
        const name = args[2];
        if (!domain) throw new Error("Usage: bun run make service <domain> [name]");
        const svPath = createServiceFile(domain, name);
        console.log(`Created service: ${svPath}`);
        break;
      }

      case "repository": {
        const domain = args[1];
        const name = args[2];
        if (!domain) throw new Error("Usage: bun run make repository <domain> [name]");
        const rPath = createRepositoryFile(domain, name);
        console.log(`Created repository: ${rPath}`);
        break;
      }

      case "schema":
      case "validation": {
        const domain = args[1];
        const name = args[2];
        if (!domain) throw new Error("Usage: bun run make validation <domain> [name]");
        const scPath = createValidationFile(domain, name);
        console.log(`Created validation: ${scPath}`);
        break;
      }

      case "job": {
        const name = args[1];
        if (!name) throw new Error("Usage: bun run make job <name>");
        const jPath = createJobFile(name);
        console.log(`Created job: ${jPath}`);
        break;
      }

      case "migration": {
        const target = args[1];
        const name = args[2];
        if (!target || !name)
          throw new Error("Usage: bun run make migration <target> <name>");
        const mPath = createMigrationFile(target as any, name);
        console.log(`Created migration: ${mPath}`);
        break;
      }

      case "seeder": {
        const target = args[1];
        const name = args[2];
        if (!target || !name)
          throw new Error("Usage: bun run make seeder <target> <name>");
        const sPath = createSeederFile(target as any, name);
        console.log(`Created seeder: ${sPath}`);
        break;
      }
    }
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

run();
