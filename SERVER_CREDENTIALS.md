# 🚀 OrLife Connect - Oracle Cloud Server Credentials & Deployment Guide

## 📌 Server Details
- **Production URL:** `https://api.orlifeindia.com`
- **Server Public IP:** `129.225.118.77`
- **Operating System:** Ubuntu 22.04 LTS
- **Region:** India South (Hyderabad) — `ap-hyderabad-1`
- **SSH Private Key Path:** `C:\Project\orlife-connect\oracle-ssh-key.key`
- **GitHub Repository:** `https://github.com/techorlifeindia-prog/orlife-engine`

---

## 🔑 1-Click Connection Scripts (Double Click to Run)

### 1️⃣ Connect to Server (SSH)
Just double-click **`connect_server.bat`** in the project folder, or run:
```cmd
ssh -i C:\Project\orlife-connect\oracle-ssh-key.key ubuntu@129.225.118.77
```

### 2️⃣ 1-Click Code Update & Auto-Deploy
Just double-click **`deploy_update.bat`** in the project folder to automatically push local code, pull on server, rebuild & restart services.

---

## ⚡ Useful Server Management Commands

### Check PM2 App Status
```bash
pm2 status
```

### View Live Logs
```bash
pm2 logs
```

### Restart All Services
```bash
pm2 restart all
```

### Restart Nginx Web Server
```bash
sudo systemctl reload nginx
```

---

## 📂 File Locations on Oracle Server
- **App Code:** `/app`
- **WhatsApp Baileys Engine:** `/app/whatsapp-engine`
- **Nginx Config:** `/etc/nginx/sites-available/api.orlifeindia.com`
- **SSL Certificate:** `/etc/letsencrypt/live/api.orlifeindia.com/`
