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
      name: "app3",
      cwd: "./app3",
      script: "index.js",
      instances: 1
    },
    {
      name: "script1",
      script: "./script1.js",
      watch: false,
      autorestart: false
    }
  ]
};
