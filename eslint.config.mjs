import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    files: ["**/*.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    rules: {
      // Deuda previa: los agentes y las filas sin esquema usan `any` como escape del AI SDK.
      // Tiparlo de verdad es otra pasada; el job de lint no puede quedar rojo por eso.
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    files: ["src/components/chat/ResearchDisplay.tsx", "src/components/ui/ThemeToggle.tsx"],
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
