/* ============================================
   Doctor Transfer Routes (Admin Only)
   ============================================ */
const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate, adminOnly } = require('../middleware/auth');

// GET /api/transfers - List all transfers
router.get('/', authenticate, adminOnly, async (req, res) => {
  try {
    const transfers = await prisma.doctorTransfer.findMany({
      include: {
        doctor: { select: { id: true, doctorName: true } },
        fromMr: { select: { id: true, name: true } },
        toMr: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: transfers });
  } catch (error) {
    console.error('Get transfers error:', error);
    res.status(500).json({ success: false, message: 'Error fetching transfers.' });
  }
});

// POST /api/transfers - Transfer doctor (Admin)
router.post('/', authenticate, adminOnly, async (req, res) => {
  try {
    const { doctorId, fromMrId, toMrId, transferType, endDate, reason } = req.body;

    if (!doctorId || !fromMrId || !toMrId) {
      return res.status(400).json({ success: false, message: 'Doctor, from MR, and to MR are required.' });
    }

    // Create transfer record
    const transfer = await prisma.doctorTransfer.create({
      data: {
        doctorId: parseInt(doctorId),
        fromMrId: parseInt(fromMrId),
        toMrId: parseInt(toMrId),
        transferType: transferType || 'PERMANENT',
        endDate: endDate ? new Date(endDate) : null,
        reason,
      },
      include: {
        doctor: { select: { doctorName: true } },
        fromMr: { select: { name: true } },
        toMr: { select: { name: true } },
      },
    });

    // If permanent transfer, update doctor's assigned MR
    if (transferType === 'PERMANENT' || !transferType) {
      await prisma.doctor.update({
        where: { id: parseInt(doctorId) },
        data: { assignedMrId: parseInt(toMrId) },
      });
    }

    res.status(201).json({ success: true, message: 'Doctor transferred successfully.', data: transfer });
  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({ success: false, message: 'Error transferring doctor.' });
  }
});

module.exports = router;
