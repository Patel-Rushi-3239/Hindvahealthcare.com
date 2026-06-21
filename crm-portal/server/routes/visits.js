/* ============================================
   Visit Management Routes
   ============================================ */
const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate, adminOnly } = require('../middleware/auth');

// GET /api/visits - List visits
router.get('/', authenticate, async (req, res) => {
  try {
    const where = {};

    if (req.user.role === 'MR') {
      where.mrId = req.user.id;
    }

    if (req.query.doctorId) where.doctorId = parseInt(req.query.doctorId);
    if (req.query.mrId && req.user.role === 'ADMIN') where.mrId = parseInt(req.query.mrId);

    // Date filters
    if (req.query.date) {
      const date = new Date(req.query.date);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      where.visitDate = { gte: date, lt: nextDay };
    }

    const visits = await prisma.visit.findMany({
      where,
      include: {
        doctor: { select: { id: true, doctorName: true, category: true, address: true } },
        mr: { select: { id: true, name: true } },
      },
      orderBy: { visitDate: 'desc' },
      take: parseInt(req.query.limit) || 50,
    });

    res.json({ success: true, data: visits });
  } catch (error) {
    console.error('Get visits error:', error);
    res.status(500).json({ success: false, message: 'Error fetching visits.' });
  }
});

// GET /api/visits/today - Get today's visits for MR
router.get('/today', authenticate, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where = {
      visitDate: { gte: today, lt: tomorrow },
    };

    if (req.user.role === 'MR') {
      where.mrId = req.user.id;
    }

    const visits = await prisma.visit.findMany({
      where,
      include: {
        doctor: { select: { id: true, doctorName: true, category: true, address: true } },
        mr: { select: { id: true, name: true } },
      },
      orderBy: { visitDate: 'asc' },
    });

    res.json({ success: true, data: visits });
  } catch (error) {
    console.error('Get today visits error:', error);
    res.status(500).json({ success: false, message: 'Error fetching today\'s visits.' });
  }
});

// GET /api/visits/scheduled - Get upcoming scheduled visits (from nextVisitDate)
router.get('/scheduled', authenticate, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where = {
      nextVisitDate: { gte: today, lt: tomorrow },
    };

    if (req.user.role === 'MR') {
      where.mrId = req.user.id;
    }

    const visits = await prisma.visit.findMany({
      where,
      include: {
        doctor: { select: { id: true, doctorName: true, category: true, address: true, mobile: true } },
        mr: { select: { id: true, name: true } },
      },
      orderBy: { nextVisitDate: 'asc' },
    });

    res.json({ success: true, data: visits });
  } catch (error) {
    console.error('Get scheduled visits error:', error);
    res.status(500).json({ success: false, message: 'Error fetching scheduled visits.' });
  }
});

// POST /api/visits - Create visit entry (MR)
router.post('/', authenticate, async (req, res) => {
  try {
    const { doctorId, visitDate, visitType, remarks, orderTaken, nextVisitDate } = req.body;

    if (!doctorId || !visitType) {
      return res.status(400).json({ success: false, message: 'Doctor and visit type are required.' });
    }

    const visit = await prisma.visit.create({
      data: {
        doctorId: parseInt(doctorId),
        mrId: req.user.id,
        visitDate: visitDate ? new Date(visitDate) : new Date(),
        visitType,
        remarks,
        orderTaken: orderTaken || false,
        nextVisitDate: nextVisitDate ? new Date(nextVisitDate) : null,
      },
      include: {
        doctor: { select: { doctorName: true } },
      },
    });

    res.status(201).json({ success: true, message: 'Visit recorded successfully.', data: visit });
  } catch (error) {
    console.error('Create visit error:', error);
    res.status(500).json({ success: false, message: 'Error creating visit.' });
  }
});

module.exports = router;
