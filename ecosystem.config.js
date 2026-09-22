module.exports = {
  apps: [{
    name: "gdrive-downloader",
    script: "node_modules/next/dist/bin/next",
    args: "start -H 0.0.0.0 -p 3001",
    cwd: "C:\\websites\\GDrive_bulk_down",
    env: {
      PORT: 3001
    }
  }]
}