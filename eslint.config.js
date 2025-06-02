// @see: https://eslint.nodejs.cn/docs
// @see: https://eslint.nodejs.cn/docs

import globals from "globals"
import eslint from "@eslint/js"
import tseslint from "typescript-eslint"
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended"
import prettier from "eslint-plugin-prettier"
import prettierConfig from "./.prettierrc.cjs"

export default [
  {
    /** 忽略格式检查的文件列表 */
    ignores: [
      "node_modules",
      "dist",
      ".gitignore",
      "package-lock.json",
      "dist-ssr",
      "*.local",
      ".npmrc",
      ".DS_Store",
      "dev-dist",
      "*.d.ts",
      "logs",
      "temp",
      "robot",
    ],
  },
  /** JS 推荐配置 */
  eslint.configs.recommended,
  /** Prettier 配置 */
  eslintPluginPrettierRecommended,

  /** 自定义规则 */
  {
    files: ["**/*.{cjs,mjs,js,jsx,tsx,ts,less}"],
    languageOptions: {
      parser: tseslint.parser,
      globals: { ...globals.node },
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      prettier: prettier,
    },
    rules: {
      "prettier/prettier": ["error", prettierConfig], // 让 ESLint 执行 Prettier 规则

      // 允许 console 用于调试
      "no-console": "off",

      // 关闭未定义变量报错（适用于 Node.js）
      "no-undef": "off",

      // 不使用的变量不报错（避免对未使用的变量严格限制）
      "no-unused-vars": "off",

      // 禁止使用不规范的空格
      "no-irregular-whitespace": "off",

      // new 操作符使用时需要括号
      "new-parens": 2,

      // 禁止使用 Array 构造函数
      "no-array-constructor": 2,

      // 禁止使用 caller 和 callee
      "no-caller": 2,

      // 禁止在类中使用重复名称的成员
      "no-dupe-class-members": 2,

      // 禁止在对象字面量中使用重复的键
      "no-dupe-keys": 2,

      // 禁止 case 语句落空
      "no-fallthrough": 2,

      // 禁止 eval
      "no-eval": 2,

      // 禁止不必要的布尔转换
      "no-extra-boolean-cast": 2,

      // 禁止不必要的括号
      "no-extra-parens": [2, "functions"],

      // 禁止对函数声明重新赋值
      "no-func-assign": 2,

      // 禁止使用 `var`
      "no-var": "error",

      // 建议使用 `const`
      "prefer-const": "warn",
    },
  },
]
