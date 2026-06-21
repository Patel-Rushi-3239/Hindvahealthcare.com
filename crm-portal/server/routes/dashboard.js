/* ============================================
   Dashboard Routes (Admin + MR)
   ============================================ */
const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

// GET /api/dashboard/stats - Get dashboard statistics
router.get('/stats', authenticate, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // First day of current month
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    if (req.user.role === 'ADMIN') {
      // Admin dashboard stats
      const [totalDoctors, totalMRs, todayVisits, monthlyOrders, pendingTasks, pendingOrders, categoryStats] = await Promise.all([
        prisma.doctor.count({ where: { status: 'ACTIVE' } }),
        prisma.user.count({ where: { role: 'MR', status: 'ACTIVE' } }),
        prisma.visit.count({ where: { visitDate: { gte: today, lt: tomorrow } } }),
        prisma.order.aggregate({
          where: { date: { gte: monthStart } },
          _sum: { totalAmount: true },
          _count: true,
        }),
        prisma.task.count({ where: { status: 'PENDING' } }),
        prisma.order.count({ where: { status: 'PENDING' } }),
        prisma.doctor.groupBy({
          by: ['category'],
          _count: true,
          where: { status: 'ACTIVE' },
        }),
      ]);

      res.json({
        success: true,
        data: {
          totalDoctors,
          totalMRs,
          todayVisits,
          monthlyOrderAmount: monthlyOrders._sum.totalAmount || 0,
          monthlyOrderCount: monthlyOrders._count || 0,
          pendingTasks,
          pendingOrders,
          categoryStats,
        },
      });
    } else {
      // MR dashboard stats
      const [myDoctors, todayVisits, monthlyOrders, pendingTasks, scheduledFollowups] = await Promise.all([
        prisma.doctor.count({ where: { assignedMrId: req.user.id, status: 'ACTIVE' } }),
        prisma.visit.count({
          where: { mrId: req.user.id, visitDate: { gte: today, lt: tomorrow } },
        }),
        prisma.order.aggregate({
          where: { mrId: req.user.id, date: { gte: monthStart } },
          _sum: { totalAmount: true },
          _count: true,
        }),
        prisma.task.count({ where: { assignedToId: req.user.id, status: 'PENDING' } }),
        prisma.visit.count({
          where: {
            mrId: req.user.id,
            nextVisitDate: { gte: today, lt: tomorrow },
          },
        }),
      ]);

      res.json({
        success: true,
        data: {
          myDoctors,
          todayVisits,
          monthlyOrderAmount: monthlyOrders._sum.totalAmount || 0,
          monthlyOrderCount: monthlyOrders._count || 0,
          pendingTasks,
          scheduledFollowups,
        },
      });
    }
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Error fetching dashboard stats.' });
  }
});

// GET /api/dashboard/recent-orders - Recent orders
router.get('/recent-orders', authenticate, async (req, res) => {
  try {
    const where = {};
    if (req.user.role === 'MR') where.mrId = req.user.id;

    const orders = await prisma.order.findMany({
      where,
      include: {
        doctor: { select: { doctorName: true } },
        mr: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Recent orders error:', error);
    res.status(500).json({ success: false, message: 'Error fetching recent orders.' });
  }
});

// GET /api/dashboard/top-mrs - Top performing MRs (Admin only)
router.get('/top-mrs', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const topMRs = await prisma.user.findMany({
      where: { role: 'MR', status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        territory: true,
        _count: { select: { ordersPlaced: true, visits: true, doctorsAssigned: true } },
      },
      orderBy: { ordersPlaced: { _count: 'desc' } },
      take: 10,
    });

    res.json({ success: true, data: topMRs });
  } catch (error) {
    console.error('Top MRs error:', error);
    res.status(500).json({ success: false, message: 'Error fetching top MRs.' });
  }
});

module.exports = router;
