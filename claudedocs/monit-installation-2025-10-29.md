# Monit Installation and Configuration - 2025-10-29

## Overview
Installed and configured Monit 5.33.0 for automated service monitoring and auto-restart on SVLentes VPS (srv1050504).

## System Information
- **OS**: Ubuntu 24.04.3 LTS (Noble Numbat)
- **Monit Version**: 5.33.0
- **Installation Date**: 2025-10-29
- **Check Interval**: 60 seconds

## Services Monitored (11 total)

### Web & Applications
1. **Nginx** (Web Server/Reverse Proxy)
   - Ports: 80 (HTTP), 443 (HTTPS)
   - CPU limit: 80% for 3 cycles → alert
   - RAM limit: 512MB → alert
   - Auto-restart if down

2. **SVLentes Next.js Application**
   - Port: 5000
   - CPU limit: 90% for 3 cycles → alert
   - RAM limit: 3GB → restart
   - Auto-restart if down

3. **PM2 Process Manager**
   - Manages Node.js applications
   - CPU limit: 80% for 3 cycles → alert
   - RAM limit: 1GB → alert

### Databases
4. **MySQL**
   - Port: 3306 (localhost)
   - CPU limit: 85% for 3 cycles → alert
   - RAM limit: 2GB → alert
   - Auto-restart if down

5. **PostgreSQL 16**
   - Port: 5432 (localhost)
   - CPU limit: 85% for 3 cycles → alert
   - RAM limit: 2GB → alert
   - Auto-restart if down

### Docker Containers
6. **Docker Container: postgres**
   - Port: 5433
   - Restarts container if no response for 3 cycles

7. **Docker Container: n8n** (Automation)
   - Port: 5678
   - Restarts container if no response for 3 cycles

### System Services
8. **SSH Server**
   - Port: 22
   - CPU limit: 50% → alert
   - Auto-restart if down

9. **Filesystem Monitoring**
   - Root (`/`): Alert if usage > 85%
   - `/var`: Alert if usage > 85%

10. **System Resources**
    - RAM: Alert if usage > 90%
    - Load Average: Alert if 1min > 4.0, 5min > 3.0, 15min > 2.5
    - CPU: Alert if usage > 90% for 5 cycles

## Web Interface

**Access:**
- URL: http://72.60.247.97:2812 or http://localhost:2812
- Username: `admin`
- Password: `peYGSaiHO73TrEBkia7EjmHgLaFwZBOe`

**Features:**
- Real-time dashboard with service status
- CPU, memory, disk usage graphs
- Event history
- Manual control (start/stop/restart services)

## Email Alerts

**Configuration:**
- Recipient: sudo311008@gmail.com
- SMTP Server: Gmail (smtp.gmail.com:587)

**Pending Action:** Configure Gmail app password in `/etc/monit/monitrc`

Until configured, alerts are queued in `/var/lib/monit/events/`

## File Locations

```
/etc/monit/
├── monitrc                          # Main configuration
├── monitrc.backup.20251029          # Original backup
└── conf.d/                          # Service-specific configs
    ├── nginx.conf
    ├── mysql.conf
    ├── postgresql.conf
    ├── svlentes-nextjs.conf
    ├── pm2.conf
    ├── sshd.conf
    ├── docker-postgres.conf
    ├── docker-n8n.conf
    ├── filesystem.conf
    └── system-resources.conf

/var/log/monit.log                   # Monit log file
/var/lib/monit/events/               # Event queue
/root/MONIT_README.md                # Full documentation
/root/MONIT_QUICK_REFERENCE.txt      # Quick reference guide
```

## Common Commands

```bash
# View status of all services
monit status

# View summary
monit summary

# Reload configuration
monit reload

# Test syntax
monit -t

# Restart a service
monit restart nginx

# View logs in real-time
tail -f /var/log/monit.log

# Systemd control
systemctl status monit
systemctl restart monit
```

## Resource Limits Summary

| Service | CPU Limit | RAM Limit | Action |
|---------|-----------|-----------|--------|
| Nginx | 80% (3 cycles) | 512MB | Alert |
| MySQL | 85% (3 cycles) | 2GB | Alert |
| PostgreSQL | 85% (3 cycles) | 2GB | Alert |
| Next.js | 90% (3 cycles) | 3GB | Restart |
| PM2 | 80% (3 cycles) | 1GB | Alert |
| SSH | 50% (3 cycles) | - | Alert |
| System | 90% (5 cycles) | 90% RAM | Alert |
| Disk / | - | 85% usage | Alert |
| Load Avg | 4.0 (1min) | - | Alert |

**Cycle Duration:** 60 seconds  
**Restart Policy:** 5 restarts in 5 cycles = timeout (prevents infinite loops)

## Auto-Restart Features

Monit automatically restarts services if:
- Process dies/crashes
- Service fails to respond on monitored port
- Protocol checks fail (HTTP, MySQL, PostgreSQL, SSH)

Successfully tested during installation - MySQL was detected as stopped and automatically restarted.

## Security

- Configuration file permissions: 600 (root only)
- Strong password for web interface
- Web interface accepts connections from any IP (can be restricted to localhost if needed)
- UFW firewall is inactive (no additional firewall rules needed)

## Next Steps

1. Configure Gmail app password for email alerts
2. Access web interface to explore dashboard
3. Adjust resource limits based on actual usage patterns
4. Consider restricting web interface to localhost only if remote access not needed

## Testing

All configurations validated with `monit -t` - syntax OK  
Monit service active and running  
All 11 services being monitored successfully

## Documentation

Full documentation available in:
- `/root/MONIT_README.md` - Complete guide
- `/root/MONIT_QUICK_REFERENCE.txt` - Quick reference card

## Status

✅ **Monit is now actively protecting the VPS 24/7**

Monitoring:
- 11 services every 60 seconds
- CPU, RAM, disk, load average
- Ready to alert on threshold violations
- Ready to auto-restart failed services
- Web interface serving real-time metrics
- Event queue active for pending email alerts
