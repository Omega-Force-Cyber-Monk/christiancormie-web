import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "node_modules"] },
  js.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    extends: [...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-explicit-any": "error",
      "no-alert": "error",
      "no-console": "error",
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/*/internal/*"],
              message:
                "Do not import private implementation details from another feature. Move shared code to a shared module.",
            },
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.name='fetch']",
          message: "Use RTK Query baseApi instead of direct fetch in app code.",
        },
        {
          selector:
            "CallExpression[callee.object.name='window'][callee.property.name='confirm']",
          message: "Use the shared confirmation dialog instead of window.confirm().",
        },
        {
          selector:
            "CallExpression[callee.object.name='window'][callee.property.name='alert']",
          message: "Use Sonner or contextual error UI instead of window.alert().",
        },
        {
          selector:
            "AssignmentExpression[left.object.name='document'][left.property.name='title']",
          message:
            "Use the centralized route metadata document-title system instead of setting document.title in components.",
        },
      ],
    },
  },
  {
    files: ["src/lib/logger/logger.ts"],
    rules: {
      "no-console": "off",
    },
  },
  {
    files: ["src/router/metadata/useDocumentTitle.ts"],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
);
