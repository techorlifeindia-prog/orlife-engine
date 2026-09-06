# ☁️ Oracle Cloud Deployment Guide (Evolution API)

This guide walks you through deploying **Evolution API (WhatsApp Engine)** on an **Oracle Cloud Always Free / Compute VM** using Docker Compose.

---

## 1. Prerequisites on Oracle Cloud Instance
Connect to your Oracle Cloud VM via SSH:
```bash
ssh -i /path/to/your-key.key ubuntu@<YOUR_ORACLE_VM_IP>
```

Update system and install Docker & Docker Compose:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose-v2
sudo usermod -aG docker $USER
```

---

## 2. Firewall / Ingress Rules Setup
In your **Oracle Cloud Security List** (VCN Security Rules):
- Add an **Ingress Rule**:
  - **Source CIDR:** `0.0.0.0/0`
  - **IP Protocol:** `TCP`
  - **Destination Port Range:** `8080`

Also open port 8080 in Ubuntu `iptables`:
```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 8080 -j ACCEPT
sudo netfilter-persistent save
```

---

## 3. Deploying Evolution API
Create a deployment folder on your server:
```bash
mkdir -p ~/evolution-api && cd ~/evolution-api
```

Upload or copy `docker-compose.evolution.yml` to `~/evolution-api/docker-compose.yml`, then start the containers:
```bash
docker compose up -d
```

---

## 4. Verify Server Health
Check running containers:
```bash
docker ps
```

Verify Evolution API is responding:
```bash
curl http://localhost:8080
```

---

## 5. Connect Next.js Dashboard to Oracle Server
In your Next.js `.env.local` file, update the IP address:
```env
EVOLUTION_API_URL=http://<YOUR_ORACLE_VM_IP>:8080
EVOLUTION_GLOBAL_KEY=42960089370CC00550B1B63C056D42A4
```
Restart Next.js dev server (`npm run dev`) and test connecting WhatsApp accounts from your Dashboard!
