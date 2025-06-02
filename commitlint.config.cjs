// @see https://commitlint.js.org/
// @see https://cz-git.qbb.sh/zh/guide/
const { defineConfig } = require("cz-git")
const { resolve } = require("path")
const fs = require("fs")

//#region scope本地缓存设置,每次新增的自定义scope都会追加到scope选项末尾
/**项目配置的默认scope*/
const defaultScopeArr = ["core", "deps", "config", "auth", "api", "util", "readme"]

/**本地缓存文件，可在本地git仓库中查看或删除(需要在资源管理器中打开隐藏文件夹)*/
const __SCOPE_CACHE_PATH = resolve(__dirname, "./.git/scope-cache.json")

/**用正则过滤只包含英文逗号、下划线、字母（中英文）、数字的有效 scope*/
const isValidScope = (scope) => {
  const regex = /^[a-zA-Z0-9\u4e00-\u9fa5_-]+$/ // 只允许字母、数字、下划线、中文、逗号
  return regex.test(scope)
}

/**将自定义scope写入缓存*/
const setCacheScope = (scope) => {
  if (!scope) return

  const localScope = defaultScopeArr.map((s) => s.trim().toLowerCase())
  // 分割并去除空白的 scope 项
  const scopes = scope
    .toLowerCase()
    .split(",")
    .map((s) => s.trim()) // 去除空格
    .filter(isValidScope) // 过滤有效的 scope
    .filter((s) => !localScope.includes(s)) // 过滤掉本地的 scope
  // console.log("项目defaultScope", localScope)
  // console.log("去重后的缓存scopes", scopes)

  if (scopes.length === 0) return // 如果没有有效的 scope，直接返回

  // 读取已有的缓存
  let cacheScopes = []
  if (fs.existsSync(__SCOPE_CACHE_PATH)) {
    cacheScopes = JSON.parse(fs.readFileSync(__SCOPE_CACHE_PATH, "utf8"))
  }

  // 将新的 scope 添加到缓存中并去重
  const newScopes = new Set([...cacheScopes, ...scopes])
  fs.writeFileSync(__SCOPE_CACHE_PATH, JSON.stringify([...newScopes], null, 2), "utf8")
}

/**获取缓存的scope并与项目的scope合并*/
const getCacheScope = () => {
  if (!fs.existsSync(__SCOPE_CACHE_PATH)) {
    return defaultScopeArr
  } else {
    const cacheScopeArr = JSON.parse(fs.readFileSync(__SCOPE_CACHE_PATH, "utf8"))
    return [...new Set([...defaultScopeArr, ...cacheScopeArr])]
  }
}
//#endregion

module.exports = defineConfig({
  extends: ["@commitlint/config-conventional"],
  parserPreset: {
    parserOpts: {
      /**提交信息正则，可自定义，此处代表：type(scope): subject，即类型(范围)：主题
       * scope为可选，且限定格式只包含英文逗号(用于单次提交多个scope)、下划线、字母（中英文）、数字
       * 若自定义，需要注意和rules中的type-enum和prompt中的types相匹配，否则会校验报错type或subject为空
       */
      headerPattern: /^([\w-]+)(?:\(([\w\u4e00-\u9fa5a-zA-Z0-9,_-]+)\))?:\s([\s\S]+)$/,
      headerCorrespondence: ["type", "scope", "subject"],
    },
  },
  rules: {
    "scope-case": [2, "always", ["lower-case", "camel-case", "kebab-case"]], // scope 小写，允许中文
    "subject-case": [0], // 关闭 subject 大小写规则
    "type-empty": [2, "never"], // 确保 type 不为空
    "subject-empty": [2, "never"], // 确保 subject 不为空
    "type-enum": [
      2,
      "always",
      [
        "init", // 初始化
        "feat", // 新增功能
        "fix", // 修复缺陷
        "docs", // 文档变更
        "style", // 代码格式（不影响功能，例如空格、分号等格式修正）
        "refactor", // 代码重构（不包括 bug 修复、功能新增）
        "perf", // 性能优化
        "test", // 添加疏漏测试或已有测试改动
        "build", // 构建流程、外部依赖变更（如升级 npm 包、修改 webpack 配置等）
        "ci", // 持续集成相关的提交（修改 CI 配置文件、构建流程、自动化测试等）
        "chore", // 对构建过程或辅助工具和库的更改（不影响源文件、测试用例）
        "revert", // 回滚提交的代码
      ],
    ],
  },
  prompt: {
    alias: { fd: "docs: fix typos" },
    messages: {
      type: "选择你要提交的类型 :",
      scope: "选择一个提交范围（可为空，可自定义，空格键或右键可多选，回车键确认）:",
      customScope:
        "请输入自定义的提交范围（仅支持用下划线、中文字符、小写英文字符、数字，且用 , 分隔）:",
      subject: "填写简短精炼的变更描述 :\n",
      body: "填写更加详细的变更描述（可选）。使用 | 换行 :\n",
      breaking: "列举非兼容性重大的变更（可选）。使用 | 换行 :\n",
      // footerPrefixesSelect: "选择关联issue前缀（可选）:",
      customFooterPrefix: "输入自定义issue前缀 :",
      footer: "列举关联issue (可选) 例如: #31, #I3244 :\n",
      confirmCommit: "是否提交或修改commit ?",
    },
    types: [
      {
        value: "init",
        name: "🛠️  init:      初始化 | Project initialization",
        emoji: ":hammer_and_wrench:",
      },
      { value: "feat", name: "✨ feat:      新增功能 | A new feature", emoji: ":sparkles:" },
      { value: "fix", name: "🐛 fix:       修复缺陷 | A bug fix", emoji: ":bug:" },
      {
        value: "docs",
        name: "📖 docs:      文档更新 | Documentation only changes",
        emoji: ":book:",
      },
      {
        value: "style",
        name: "💅 style:     代码格式（不影响功能，例如空格、分号等格式修正） | Changes that do not affect the meaning of the code",
        emoji: ":nail_care:",
      },
      {
        value: "refactor",
        name: "🔨 refactor:  代码重构（不包括 bug 修复、功能新增） | A code change that neither fixes a bug nor adds a feature",
        emoji: ":wrench:",
      },
      {
        value: "perf",
        name: "🚀 perf:      性能优化 | A code change that improves performance",
        emoji: ":rocket:",
      },
      {
        value: "test",
        name: "🧪 test:      测试相关，添加疏漏测试或已有测试改动 | Adding missing tests or correcting existing tests",
        emoji: ":test_tube:",
      },
      {
        value: "build",
        name: "📦 build:     构建流程、外部依赖变更（如升级 npm 包、修改 webpack 配置等） | Changes that affect the build system or external dependencies",
        emoji: ":package:",
      },
      {
        value: "ci",
        name: "🤖 ci:        持续集成相关的提交（修改 CI 配置文件、构建流程、自动化测试等） | Changes to our CI configuration files and scripts",
        emoji: ":robot:",
      },
      {
        value: "chore",
        name: "🔧 chore:     对构建过程或辅助工具和库的更改（不影响源文件、测试用例） | Other changes that do not modify src or test files",
        emoji: ":wrench:",
      },
      {
        value: "revert",
        name: "⏪ revert:    回退提交的代码 | Revert to a commit",
        emoji: ":rewind:",
      },
    ],
    useEmoji: true,
    emojiAlign: "center", // 设置 Emoji 字符 的 位于头部位置["left" | "center" | "right"]
    useAI: false,
    aiNumber: 1,
    themeColorCode: "",
    scopes: getCacheScope(),
    // @see: https://github.com/Zhengqbbb/cz-git#options
    formatMessageCB: ({ defaultMessage, scope }) => {
      // eslint-disable-next-line no-control-regex
      setCacheScope(scope.replaceAll(/\x1B\[[0-9;]*[mG]/g, ""))
      return defaultMessage
    },
    allowCustomScopes: true,
    allowEmptyScopes: true,
    customScopesAlign: "bottom",
    customScopesAlias: "自定义",
    emptyScopesAlias: "空",
    upperCaseSubject: false,
    markBreakingChangeMode: false, //描述 : 添加额外的问题重大变更(BREAKING CHANGES)提问，询问是否需要添加 "!" 标识于头部
    allowBreakingChanges: ["feat", "fix"], //仅这两项允许破坏性提交
    breaklineNumber: 100,
    breaklineChar: "|",
    skipQuestions: [],
    // issuePrefixes: [
    //   // 如果使用 gitee 作为开发管理
    //   { value: "link", name: "link:     链接 ISSUES 进行中" },
    //   { value: "closed", name: "closed:   标记 ISSUES 已完成" },
    // ],
    customIssuePrefixAlign: "top",
    emptyIssuePrefixAlias: "skip",
    customIssuePrefixAlias: "custom",
    allowCustomIssuePrefix: true,
    allowEmptyIssuePrefix: true,
    confirmColorize: true,
    scopeOverrides: undefined,
    defaultBody: "",
    defaultIssues: "",
    defaultScope: "",
    defaultSubject: "",
    enableMultipleScopes: true, //是否开启在选择 模块范围 时使用多选模式
  },
})
