const fs = require("fs");
const path = require("path");

// Definir tipo de incremento: puede ser 'major', 'minor', o 'patch' (por defecto)
const incrementType = process.argv[2] || "patch";

// Leer el package.json
const packageJsonPath = path.join(__dirname, "..", "package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
const currentVersion = packageJson.version;

// Dividir la versión en componentes
const versionParts = currentVersion.split(".");

// Incrementar según el tipo
switch (incrementType) {
  case "major":
    versionParts[0] = parseInt(versionParts[0]) + 1;
    versionParts[1] = 0;
    versionParts[2] = 0;
    break;
  case "minor":
    versionParts[1] = parseInt(versionParts[1]) + 1;
    versionParts[2] = 0;
    break;
  case "patch":
  default:
    versionParts[2] = parseInt(versionParts[2]) + 1;
    break;
}

// Nueva versión
const newVersion = versionParts.join(".");
packageJson.version = newVersion;

// Guardar el package.json actualizado
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

// Actualizar también el README.md si existe la etiqueta de versión
const readmePath = path.join(__dirname, "..", "README.md");
if (fs.existsSync(readmePath)) {
  let readme = fs.readFileSync(readmePath, "utf8");
  // Reemplazar el badge de versión de GitHub Package
  readme = readme.replace(
    /\[\!\[GitHub Package\]\(https:\/\/img\.shields\.io\/badge\/GitHub%20Package-[0-9]+\.[0-9]+\.[0-9]+-blue\)\]/g,
    `[![GitHub Package](https://img.shields.io/badge/GitHub%20Package-${newVersion}-blue)]`
  );
  fs.writeFileSync(readmePath, readme);
}

console.log(`✅ Versión incrementada: ${currentVersion} → ${newVersion}`);
