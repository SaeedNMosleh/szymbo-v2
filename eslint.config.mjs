import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import importPlugin from "eslint-plugin-import";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...nextVitals,
  ...nextTypescript,
  {
    ignores: ["components/ui/**"]
  },
  ...compat.extends(
    "standard",
    "plugin:tailwindcss/recommended",
    "prettier"
  ),
  {
    plugins: {
      import: importPlugin
    },
    rules: {
      "import/order": "off",
      "import/no-unresolved": "error",
      "import/named": "error",
      "import/default": "error",
      "import/namespace": "error",
      "import/no-duplicates": "error",
      "no-unused-vars": "off",
      "react-hooks/immutability": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/static-components": "off"
    },
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module"
      }
    },
    linterOptions: {
      noInlineConfig: false
    }
  }
];

export default eslintConfig;