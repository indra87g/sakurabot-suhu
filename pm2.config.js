module.exports = {
  apps: [
    {
      name: "app1",
      cwd: "./app1",
      script: "npm",
      args: "start",
      interpreter: "none",
      env_file: "./app1/.env"
    },
    {
      name: "app2",
      cwd: "./app2",
      script: "npm",
      args: "start",
      interpreter: "none",
      env_file: "./app2/.env"
    },
    {
      name: "script1",
      script: "./script1.js",
      watch: false,
      autorestart: false,
      env_file: "./.env"
    }
  ]
};
