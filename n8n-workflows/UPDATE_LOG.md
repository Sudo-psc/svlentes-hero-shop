# n8n Update Log

## Update: 2025-10-19

### Previous Version
- **Version**: 1.114.4
- **Image**: n8nio/n8n:latest (older)

### New Version
- **Version**: 1.115.3
- **Image**: n8nio/n8n:latest (updated)

### Update Process
1. ✅ Pulled latest n8n image
2. ✅ Stopped old container
3. ✅ Removed old container
4. ✅ Started new container with same volume mounts
5. ✅ Verified health check: OK
6. ✅ Database migrations completed successfully

### Container Details
- **Container Name**: n8n
- **Port**: 5678 (0.0.0.0:5678->5678/tcp)
- **Data Volume**: /root/approuter/n8n/data:/home/node/.n8n
- **Restart Policy**: unless-stopped
- **Status**: Running

### Access
- **URL**: http://localhost:5678
- **Health**: http://localhost:5678/healthz

### Notes
- All workflows and data preserved (volume mount maintained)
- Database migrations ran automatically on startup
- No downtime expected for future updates using same process

### Rollback (if needed)
```bash
docker stop n8n && docker rm n8n
docker run -d \
  --name n8n \
  --restart unless-stopped \
  -p 5678:5678 \
  -v /root/approuter/n8n/data:/home/node/.n8n \
  n8nio/n8n:1.114.4
```

### Future Updates
```bash
docker pull n8nio/n8n:latest
docker stop n8n && docker rm n8n
docker run -d \
  --name n8n \
  --restart unless-stopped \
  -p 5678:5678 \
  -v /root/approuter/n8n/data:/home/node/.n8n \
  n8nio/n8n:latest
```
