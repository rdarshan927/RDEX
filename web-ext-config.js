module.exports = {
  ignoreFiles: [
    ".git",
    ".gitignore",
    "node_modules",
    "OPTIMIZATION.md",
    "LINK_FIXES.md",
    "TESTING_GUIDE.md",
    "web-ext-config.js",
    "package-lock.json",
    "screenshots"
  ],
  sourceDir: ".",
  artifactsDir: "web-ext-artifacts",
  build: {
    overwriteDest: true
  },
  sign: {
    apiKey: process.env.WEB_EXT_API_KEY,
    apiSecret: process.env.WEB_EXT_API_SECRET
  }
};
