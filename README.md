# Nginx Reverse Proxy with Docker Compose

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-20.10%2B-blue)](https://www.docker.com/)
[![Nginx](https://img.shields.io/badge/Nginx-1.25-green)](https://nginx.org/)

Production-ready demonstration of Nginx as a reverse proxy with load balancing, caching, rate limiting, and comprehensive monitoring capabilities.

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Configuration](#-configuration)
- [Testing & Verification](#-testing--verification)
- [Monitoring](#-monitoring)
- [Troubleshooting](#-troubleshooting)
- [Advanced Topics](#-advanced-topics)

---

## ✨ Features

### Core Functionality
- **Reverse Proxy**: Routes traffic to backend applications with intelligent path handling
- **Load Balancing**: Distributes requests across 3 Node.js instances using `least_conn` algorithm
- **Static File Serving**: Nginx serves static assets directly, reducing backend load
- **Proxy Caching**: Intelligent caching with configurable TTL and cache keys
- **Rate Limiting**: Protects API endpoints from abuse (10 req/s for API, 50 req/s general)
- **Health Checks**: Docker-native health monitoring for all services
- **Monitoring**: Built-in Nginx stats endpoint and JSON-formatted access logs

### Security
- Security headers (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection)
- Hidden Nginx version (`server_tokens off`)
- Blocks access to hidden files (`.htaccess`, `.git`, etc.)
- Rate limiting on API endpoints
- Separate monitoring port (8080) for internal metrics

### Performance
- Gzip compression for text content (HTML, CSS, JS, JSON)
- Keepalive connections to upstreams
- Optimized proxy buffering
- Static asset caching with 1-year expiry and `immutable` flag
- Event-driven architecture with `epoll`

---

## 🏗️ Architecture

```
                                    ┌─────────────┐
                                    │   Client    │
                                    └──────┬──────┘
                                           │
                                           ▼
                                    ┌─────────────┐
                                    │    Nginx    │
                                    │   :80 :8080 │
                                    │ Reverse Proxy│
                                    └──────┬──────┘
                                           │
                       ┌───────────────────┼───────────────────┐
                       │                   │                   │
                       ▼                   ▼                   ▼
                ┌──────────┐        ┌──────────┐       ┌──────────┐
                │  App1    │        │  App2    │       │  App2    │
                │ (Flask)  │        │ Node.js  │       │ Node.js  │
                │  :5000   │        │ Instance │       │ Instance │
                │          │        │  1, 2, 3 │       │  1, 2, 3 │
                └──────────┘        └──────────┘       └──────────┘
```

### Services Overview

| Service | Technology | Port | Instances | Purpose |
|---------|-----------|------|-----------|---------|
| Nginx | Nginx 1.25 Alpine | 80, 443, 8080 | 1 | Reverse proxy, load balancer, static file server |
| App1 | Python 3.11 + Flask | 5000 | 1 | Single instance REST API |
| App2 | Node.js 18 + Express | 3000 | 3 | Load-balanced REST API |

---

## 🚀 Quick Start

### Prerequisites

- **Docker** 20.10+ ([Install Docker](https://docs.docker.com/get-docker/))
- **Docker Compose** 2.0+ (included with Docker Desktop)
- **Git** (for cloning the repository)

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd nginx-reverse-proxy
```

2. **Start all services**
```bash
docker-compose up -d
```

3. **Verify all services are running**
```bash
docker-compose ps
```

Expected output:
```
NAME          STATUS                    PORTS
app1-flask    Up (healthy)              5000/tcp
app2-node-1   Up (healthy)              3000/tcp
app2-node-2   Up (healthy)              3000/tcp
app2-node-3   Up (healthy)              3000/tcp
nginx-proxy   Up (healthy)              0.0.0.0:80->80/tcp, 0.0.0.0:8080->8080/tcp
```

4. **Test the setup**
```bash
# Test Flask app
curl http://localhost/app1/

# Test Node.js app (load balanced)
curl http://localhost/app2/

# Check Nginx status
curl http://localhost:8080/nginx_status
```

---

## 📁 Project Structure

```
nginx-reverse-proxy/
├── docker-compose.yml          # Service orchestration
├── Dockerfile                  # Custom Nginx image
├── nginx.conf                  # Main Nginx configuration
├── README.md                   # This file
│
├── conf.d/                     # Nginx server configurations
│   ├── default.conf            # Main server block with routing
│   └── upstream.conf           # Backend definitions and load balancing
│
├── app1/                       # Flask application
│   ├── Dockerfile
│   ├── app.py                  # Flask REST API
│   ├── requirements.txt        # Python dependencies
│   └── static/
│       └── example.txt
│
├── app2/                       # Node.js application
│   ├── Dockerfile
│   ├── server.js               # Express REST API
│   ├── package.json            # Node dependencies
│   └── static/
│       └── example.txt
│
└── logs/                       # Nginx logs (auto-created)
    └── nginx/
        ├── access.log          # JSON-formatted access logs
        └── error.log           # Error logs
```

---

## ⚙️ Configuration

### Nginx Configuration Files

#### `nginx.conf` - Global Settings
- **Worker processes**: Auto-scaled to CPU cores
- **Connections**: 1024 per worker
- **Logging**: JSON format with upstream metrics
- **Caching**: 2 cache zones (app1: 100MB, app2: 50MB)
- **Rate limiting**: 2 zones (API: 10 req/s, General: 50 req/s)

#### `conf.d/upstream.conf` - Backend Definitions
```nginx
# Single instance (Flask)
upstream app1_backend {
    server app1:5000;
    keepalive 32;
}

# Load balanced (Node.js)
upstream app2_backend {
    least_conn;  # Route to server with fewest connections
    server app2:3000;
    server app2_instance2:3000;
    server app2_instance3:3000;
    keepalive 32;
}
```

**Load Balancing Methods:**
- `least_conn` (current): Routes to server with fewest active connections
- `round_robin` (default): Distributes requests equally in rotation
- `ip_hash`: Same client always goes to same server (session persistence)
- `hash $request_uri`: Same URL always goes to same server (cache optimization)

#### `conf.d/default.conf` - Routing Rules

**Path Mapping:**
| Client Request | Proxied To | Purpose |
|----------------|-----------|---------|
| `/app1/` | `http://app1:5000/` | Flask application |
| `/app1/static/` | Direct file serving | Static assets (CSS, JS, images) |
| `/app1/health` | `http://app1:5000/health` | Health check |
| `/app2/` | Load balanced to app2 instances | Node.js application |
| `/app2/api/` | Load balanced with rate limit | API endpoints (10 req/s) |
| `/app2/static/` | Direct file serving | Static assets |
| `/nginx_status` | Internal stats | Monitoring (port 8080) |

---

## 🧪 Testing & Verification

### 1. Basic Connectivity

```bash
# Test Flask app
curl http://localhost/app1/
# Expected: JSON response with "Welcome to App1 (Flask)"

# Test Node.js app
curl http://localhost/app2/
# Expected: JSON response with "Welcome to App2 (Node.js)" and instance ID
```

### 2. Load Balancing

```bash
# Send 10 requests and observe different instance IDs
for i in {1..10}; do
  curl -s http://localhost/app2/ | grep -o '"instance":"[0-9]"'
done
```

**Expected output:**
```
"instance":"1"
"instance":"2"
"instance":"3"
"instance":"1"
...
```

### 3. Proxy Caching

```bash
# First request (cache MISS)
curl -I http://localhost/app1/cached
# X-Cache-Status: MISS

# Second request within 5 minutes (cache HIT)
curl -I http://localhost/app1/cached
# X-Cache-Status: HIT
```

### 4. Static File Serving

```bash
# Nginx serves these directly (not proxied to backend)
curl http://localhost/app1/static/example.txt
curl http://localhost/app2/static/example.txt
```

### 5. Rate Limiting

```bash
# Send 20 API requests rapidly
for i in {1..20}; do
  curl -w "\n" http://localhost/app2/api/data &
done
wait
```

**Expected:** Some requests return `429 Too Many Requests`

### 6. Health Checks

```bash
# Application health
curl http://localhost/app1/health
curl http://localhost/app2/health

# Nginx health
curl http://localhost:8080/health
```

---

## 📊 Monitoring

### Nginx Status Page

```bash
curl http://localhost:8080/nginx_status
```

**Output:**
```
Active connections: 2
Reading: 0 Writing: 1 Waiting: 1
Accepts: 1234 Handled: 1234 Requests: 5678
```

**Metrics explanation:**
- **Active connections**: Current active client connections
- **Reading**: Nginx is reading request headers
- **Writing**: Nginx is writing responses
- **Waiting**: Keep-alive connections waiting for requests
- **Accepts/Handled**: Total connections accepted/handled
- **Requests**: Total requests processed

### Access Logs Analysis

Logs are in JSON format for easy parsing:

```bash
# View recent requests
tail -f logs/nginx/access.log

# Parse with jq (if installed)
cat logs/nginx/access.log | jq .

# Top 10 IP addresses
cat logs/nginx/access.log | jq -r '.remote_addr' | sort | uniq -c | sort -rn | head -10

# Average response time
cat logs/nginx/access.log | jq -r '.request_time' | awk '{sum+=$1; count++} END {print sum/count " seconds"}'

# Requests with errors (4xx, 5xx)
cat logs/nginx/access.log | jq 'select(.status >= 400)'

# Upstream response times
cat logs/nginx/access.log | jq '{uri: .request, upstream_time: .upstream_response_time, total_time: .request_time}'
```

### Container Health

```bash
# Check status of all containers
docker-compose ps

# View logs for specific service
docker-compose logs -f nginx
docker-compose logs -f app1
docker-compose logs -f app2

# Resource usage
docker stats
```


## 📚 Additional Resources

- [Nginx Documentation](https://nginx.org/en/docs/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Load Balancing with Nginx](https://nginx.org/en/docs/http/load_balancing.html)
- [Nginx Caching Guide](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_cache)