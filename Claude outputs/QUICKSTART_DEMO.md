# Ganesh Utsav MVP - Phase 1 Live Demo

## 🎯 What's Running Now

Both the backend and frontend servers are operational and ready for testing:

- **Backend**: http://localhost:5000 (Express + Socket.io)
- **Frontend**: http://localhost:5173 (React + Vite)
- **Database**: In-memory demo mode (data resets on server restart)

## 🔗 Access the Application

### Home Page
Navigate to: http://localhost:5173

This shows the landing page with the status dashboard and feature overview.

### Admin Dashboard (New)
Navigate to: http://localhost:5173/portal/demo/admin

**Login credentials:**
- Email: `admin@test.com`
- Token: `test-token`

## 📋 Admin Dashboard Tabs

Once logged in, you'll see these new tabs:

### 1. **Overview Tab** (📊)
- **New Components**: `DashboardMetrics.jsx`
- Shows key metrics:
  - Total Donations count
  - Pending Photos count  
  - Total Events
  - Audio Tracks count
  - Real-time metrics dashboard with currency formatting
  - Auto-refreshing every 30 seconds

### 2. **Donations Tab** (🙏)
- **New Components**: `DonationLeaderboard.jsx`
- Features:
  - **Leaderboard**: Top donors with medal badges (🥇🥈🥉)
  - **Time Window Selector**: daily, weekly, monthly, yearly, all-time
  - **Real-time Updates**: Via Socket.io
  - **All Donations Table**: Complete donation history with status badges
  - Quick Receive/Reject actions for pending donations

### 3. **Photos Tab** (📸)  
- **New Components**: `GalleryAdminPanel.jsx`
- Features:
  - **Photo List**: Thumbnails of pending photos
  - **Full Preview**: Selected photo shown with details
  - **Approval Workflow**:
    - Approve button (turns photo to published status)
    - Reject button (removes from pending)
  - **Photo Details**: Name, phone, email, caption, upload date
  - **Real-time Updates**: List refreshes after approval/rejection

### 4. **Analytics Tab** (📈)
- **New Components**: `DonationAnalytics.jsx`
- Features:
  - **Line Chart**: Donation trends over time
  - **Pie Chart**: Donation type distribution
  - **Bar Chart**: Daily/weekly donation counts
  - **Breakdown Table**: Detailed statistics
  - **Time Period Selection**: 7, 30, 90, 365 days
  - Currency formatting with commas

### 5. **Events Tab** (📅)
- Existing events management
- Trigger notifications to users

### 6. **Audio Tab** (🎵)
- Existing audio library management
- Shows featured tracks

## 🎬 Backend API Endpoints (Now Available)

### Gallery Endpoints
```
POST   /api/portal/:tenantSlug/gallery/upload
       - Upload photo with automatic watermarking
       - Expects: multipart/form-data with image file

GET    /api/portal/:tenantSlug/gallery/:photoId
       - Get single photo details

POST   /api/portal/:tenantSlug/gallery/:photoId/like
       - Like a photo (broadcasts via Socket.io)

POST   /api/portal/:tenantSlug/gallery/:photoId/view
       - Increment view count

GET    /api/portal/:tenantSlug/gallery/stats
       - Get gallery statistics and metrics

GET    /api/portal/:tenantSlug/gallery/pending
       - Get pending photos awaiting approval
```

### Donation Endpoints
```
GET    /api/portal/:tenantSlug/donations/stats
       - Get donation statistics

GET    /api/portal/:tenantSlug/donations/leaderboard?timeWindow=all-time
       - Get top donors leaderboard
       - Time windows: daily, weekly, monthly, yearly, all-time

GET    /api/portal/:tenantSlug/donations/analytics?daysBack=30
       - Get analytics data with trends
```

### Admin Actions
```
PATCH  /api/portal/:tenantSlug/gallery/:photoId/approve
       - Approve pending photo for publication

PATCH  /api/portal/:tenantSlug/gallery/:photoId/reject
       - Reject a pending photo

PATCH  /api/portal/:tenantSlug/donations/:donationId
       - Update donation status
```

## 🧪 Testing the Features

### 1. Test Photo Upload with Watermarking
Use Postman or curl to test the gallery upload:
```bash
curl -X POST http://localhost:5000/api/portal/demo/gallery/upload \
  -F "image=@/path/to/image.jpg" \
  -F "uploaderName=John Doe" \
  -F "uploaderPhone=9876543210" \
  -F "uploaderEmail=john@example.com" \
  -F "caption=Beautiful photo"
```

**Result**: Photo gets watermarked with donor name and date, stored with both original and watermarked versions.

### 2. Test Admin Photo Approval
1. Navigate to Photos tab in admin dashboard
2. See pending photos in the list
3. Click a photo to view full preview
4. Click "Approve" or "Reject" button
5. Watch the list update in real-time

### 3. Test Leaderboard
1. Navigate to Donations tab
2. See top donors with medals
3. Change time window selector (daily, weekly, monthly, etc.)
4. Watch real-time updates via Socket.io

### 4. Test Analytics
1. Navigate to Analytics tab
2. View charts for donation trends
3. Change time period selector (7, 30, 90, 365 days)
4. See detailed breakdown table

### 5. Test Metrics Dashboard
1. Navigate to Overview tab
2. Watch metrics auto-refresh every 30 seconds
3. See real-time statistics

## ⚙️ Server Configuration

### Backend (server.js)
- **Port**: 5000
- **Mode**: Development with Demo Database
- **Socket.io**: Real-time updates enabled
- **Services**:
  - `WatermarkService`: Image processing and SVG watermarking
  - `LeaderboardService`: Donation ranking and caching
  - Auto-cache invalidation on status changes

### Frontend (React + Vite)
- **Port**: 5173
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Real-time**: Socket.io hooks
- **Charts**: Recharts library

## 📦 Key Implementations

### Image Watermarking (watermarkService.js)
- Automatic SVG watermark on photo upload
- Contains: Donor name + phone + date
- Configurable position (default: bottom-right)
- Customizable opacity and styling
- Batch processing support
- Thumbnail generation

### Donation Leaderboard (leaderboardService.js)
- Real-time donor rankings
- 5-minute cache with TTL
- MongoDB aggregation pipelines
- Time-window filtering (daily/weekly/monthly/yearly/all-time)
- Automatic cache invalidation on new donations
- Thread-safe operations

### Frontend Components
1. **GalleryUploadForm.jsx**: User photo upload
2. **GalleryAdminPanel.jsx**: Admin photo approval
3. **DonationLeaderboard.jsx**: Top donors display
4. **DonationAnalytics.jsx**: Trend analysis & charts
5. **DashboardMetrics.jsx**: Key metrics cards
6. **useSocket.js**: Real-time connection management

### Integration
- Fully integrated into TenantAdminDashboard
- Socket.io events for real-time updates
- Responsive design with Tailwind CSS
- Error handling and loading states

## 🚀 Next Steps

### Phase 2: Enhanced Features
- Bulk donation import
- Export to CSV/Excel
- Donation categories
- Pledge system

### Phase 3: Admin Dashboard Completion  
- Event calendar view
- Tenant settings page
- User permission management

### Phase 4: Production Readiness
- Validation middleware
- Error handling wrapper
- Comprehensive logging
- Unit & integration tests
- Security hardening
- Data persistence with real MongoDB

## 📝 Demo Mode Notes

**Current State**:
- ✅ Backend running without MongoDB (in-memory demo mode)
- ✅ Frontend fully functional with all new components
- ✅ Image watermarking service ready
- ✅ Leaderboard service ready
- ✅ Socket.io real-time events configured
- ⚠️ Data resets on server restart (no persistence)

**To Enable Full Persistence**:
1. Install MongoDB locally or use MongoDB Atlas cloud
2. Update `.env` with MongoDB connection string
3. Restart backend server
4. All data will persist across restarts

## 🔗 Important URLs

| Component | URL |
|-----------|-----|
| Home Page | http://localhost:5173 |
| Admin Dashboard | http://localhost:5173/portal/demo/admin |
| Backend Health | http://localhost:5000/health |
| API Base | http://localhost:5000/api |

## ✅ Testing Checklist

- [ ] Navigate to admin dashboard and login
- [ ] View dashboard metrics (Overview tab)
- [ ] View donation leaderboard (Donations tab)
- [ ] View analytics charts (Analytics tab)
- [ ] Upload a photo and see watermark applied
- [ ] Approve/reject photos (Photos tab)
- [ ] Change time windows in leaderboard
- [ ] Change time periods in analytics
- [ ] Check Socket.io real-time updates work
- [ ] Verify responsive design on mobile

## 📞 Troubleshooting

**Backend not responding?**
```bash
# Check if it's running
curl http://localhost:5000/health

# Restart both servers
pkill -f "node server"
pkill -f "vite"
npm run dev
```

**Frontend can't reach backend?**
- Check CORS configuration in `.env`
- Ensure both servers are running on correct ports
- Look at browser console for specific errors

**Images not watermarking?**
- Verify Sharp library is installed: `npm list sharp`
- Check image format (JPG, PNG supported)
- Check upload directory exists: `./uploads`

---

**Status**: ✅ Phase 1 Complete & Live
**Last Updated**: September 3, 2026  
**Ready for**: Feature testing and demo
