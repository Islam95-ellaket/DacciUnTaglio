// Configurazione ESLint del backend (flat config, ESLint 9+).
// Speculare a quella del client ma senza i plugin React: qui il codice è
// Node puro. Comando: npm run lint
import js from "@eslint/js";
import globals from "globals";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["node_modules/**"]),
  {
    files: ["**/*.js"],
    extends: [js.configs.recommended],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      // Convenzione: un parametro non usato si prefixa con "_" (es. il `next`
      // obbligatorio ma inutilizzato dei gestori di errore Express).
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
]);
