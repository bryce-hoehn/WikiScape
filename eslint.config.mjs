import js from "@eslint/js";
import pluginReact from "eslint-plugin-react";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      ".expo/**",
      "node_modules/**",
      "ios/**",
      "android/**",
      "web-build/**",
      ".next/**",
      "coverage/**",
      "*.config.js",
      "*.config.mjs",
      "*.config.ts",
      "babel.config.js",
      "metro.config.js",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    plugins: {
      react: pluginReact,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      // Indentation - disabled because Prettier handles formatting
      // Using @typescript-eslint/indent instead for TypeScript files
      indent: "off",
      "@typescript-eslint/indent": "off", // Prettier handles this
      "no-tabs": "error",

      // TypeScript - relaxed rules
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",

      // React
      "react/react-in-jsx-scope": "off", // Not needed in React 17+
      "react/prop-types": "off", // Using TypeScript instead
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/rules-of-hooks": "error",

      // General
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "prefer-const": "warn",
      "no-var": "error",
      "no-unused-vars": "off", // Use TypeScript version instead
    },
  },
);
