console.log("Hello");
/*const pm2 = require("pm2");

const WEBHOOK_URL = "https://webhook.notifine.com/beep/RcWM02gS";

function notify(title, message) {
  fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, message })
  }).catch(() => {});
}

pm2.connect(err => {
  if (err) {
    console.error("Gagal connect PM2", err);
    process.exit(2);
  }

  pm2.launchBus((err, bus) => {
    if (err) return;

    bus.on("process:event", data => {
      const { event, process } = data;
      const name = process.name;

      if (!["app1", "app2"].includes(name)) return;

      if (event === "online") {
        notify("PM2 App Online 🚀", `${name} ONLINE (pid ${process.pid})`);
      }

      if (event === "exit") {
        notify("PM2 App Crash ❌", `${name} EXIT (code ${process.exit_code})`);
      }

      if (event === "restart") {
        notify("PM2 App Restart 🔁", `${name} direstart oleh PM2`);
      }
    });
  });
});*/
