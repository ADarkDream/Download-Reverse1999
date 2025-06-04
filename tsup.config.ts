import { defineConfig } from "tsup"
import dotenv from "dotenv"

dotenv.config({ path: ".env.production" })

// 手动挑选要注入的环境变量
const selectedKeys = ["NODE_ENV", "CONFIG_PATH", "MOMO_BASE_API", "PRINT_MOMO_RESPONSE"]

// 构造 define 配置
const defineVars = Object.fromEntries(
  selectedKeys.map((key) => [`process.env.${key}`, JSON.stringify(process.env[key])]),
)

export default defineConfig({
  entry: ["src/app.ts"],
  outDir: "dist",
  target: "node18",
  format: ["cjs"],
  clean: true,
  dts: false,
  sourcemap: false,
  tsconfig: "./tsconfig.json",
  define: defineVars,
})
