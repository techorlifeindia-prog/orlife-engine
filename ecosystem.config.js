module.exports = {
  apps: [
    {
      name: "orlife-connect-ui",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3002",
      cwd: "/app",
      env: {
        NODE_ENV: "production",
        PORT: 3002
      }
    },
    {
      name: "whatsapp-engine",
      script: "server.js",
      cwd: "/app/whatsapp-engine",
      env: {
        NODE_ENV: "production",
        PORT: 8080
      }
    }
  ]
};
