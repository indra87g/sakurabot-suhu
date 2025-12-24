module.exports = {
  apps: [
    {
      name: "app1",
      cwd: "./app1",
      script: "npm",
      args: "start",
      interpreter: "none"
    },
    {
      name: "app2",
      cwd: "./app2",
      script: "npm",
      args: "start",
      interpreter: "none"
    },
    {
      name: "script1",
      script: "./script1.js",
      watch: false,
      autorestart: false
    }
  ]
};
