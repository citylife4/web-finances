# 🚀 Quick Deploy Guide for 1GB RAM VPS

This guide is specifically for deploying on small VPS instances with **1 CPU and 1GB RAM**.

## ⚡ Quick Fix (If Build is Hanging)

Your build is hanging at the Vite transformation step. Here's the solution:

### Option 1: Build Frontend Separately (Recommended)

```bash
# 1. Enable swap FIRST (critical!)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 2. Verify swap is active
free -h
# Should show 2GB swap

# 3. Stop all running containers to free memory
docker stop $(docker ps -aq)

# 4. Build frontend only (will use all available memory)
make build-frontend-only

# 5. Build backend
docker-compose -f docker-compose.yml build backend

# 6. Start all services with memory limits
make prod-lowmem
```

### Option 2: One Command (Requires Good Swap)

```bash
# 1. Enable 2GB swap (if not done already)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 2. Stop all containers
docker stop $(docker ps -aq)

# 3. Deploy with memory optimizations
make prod-lowmem
```

## 📊 Monitoring During Build

Open another terminal and monitor memory:

```bash
watch -n 1 free -m
```

You should see:
- **Physical RAM**: ~900-1000MB used during build
- **Swap**: 200-500MB used during build peak
- **Total**: Should stay under ~1.5GB combined

## ⚙️ Optimizations Applied

| Optimization | Impact |
|-------------|--------|
| Node.js heap: 896MB | Maximum memory for build process |
| No TypeScript checking | Saves ~300-400MB during build |
| Single vendor chunk | Reduces rollup memory overhead |
| UV_THREADPOOL_SIZE=1 | Limits concurrent file operations |
| Disabled source maps | Saves ~100-150MB |
| esbuild minification | Faster, less memory than terser |

## 🔧 Runtime Memory Limits

After deployment, containers are limited to:

```yaml
MongoDB:  384MB (256MB cache)
Backend:  384MB (256MB Node heap)  
Frontend: 256MB (nginx is very light)
Total:    ~1024MB (fits in 1GB with overhead)
```

## ❌ Troubleshooting

### Build still hangs or crashes?

**1. Check swap:**
```bash
free -h
swapon --show
```
If swap shows 0, it's not enabled!

**2. Kill hung build:**
```bash
docker-compose down
docker system prune -f
```

**3. Monitor build progress:**
```bash
# In one terminal
make build-frontend-only

# In another terminal  
docker stats
```

**4. If it absolutely won't build:**

Build on your local machine (with more RAM) and push to a registry:

```bash
# On your local machine with more RAM
docker build -t yourusername/finance-tracker-frontend -f Dockerfile.frontend --target production .
docker build -t yourusername/finance-tracker-backend -f backend/Dockerfile ./backend
docker push yourusername/finance-tracker-frontend
docker push yourusername/finance-tracker-backend

# On your VPS
docker pull yourusername/finance-tracker-frontend
docker pull yourusername/finance-tracker-backend
# Update docker-compose.yml to use these images instead of building
```

## ✅ Verification

After successful deployment:

```bash
# Check all services are running
docker ps

# Check memory usage
docker stats --no-stream

# Test the application
curl http://localhost:80
curl http://localhost:3001/api/health
```

Expected output:
- All 3 containers running
- Memory usage under 1GB total
- Frontend accessible on port 80
- Backend API responding on port 3001

## 🎯 Expected Build Time

- **With 2GB swap**: 3-7 minutes
- **Without swap**: Will likely fail/hang
- **Progress indicators**:
  - "transforming..." - This is the slow part (2-4 min)
  - "rendering chunks..." - Almost done (30-60 sec)
  - "computing gzip size..." - Final step (10-20 sec)

## 💡 Pro Tips

1. **Always enable swap on 1GB systems** - Docker builds need it
2. **Stop other services during build** - Frees 200-400MB
3. **Build during low-traffic times** - Less CPU contention
4. **Monitor with `htop`** - See real-time resource usage
5. **Consider 2GB RAM VPS** - Costs ~$2-3 more/month, much smoother

## 📞 Support

If you're still stuck:
1. Check `docker logs <container-name>`
2. Run `free -h` and share output
3. Run `docker stats` during build and share output
