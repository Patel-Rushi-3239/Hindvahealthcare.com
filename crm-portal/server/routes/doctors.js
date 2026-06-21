/* ============================================
   Doctor Management Routes
   ============================================ */
const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate, adminOnly } = require('../middleware/auth');

// GET /api/doctors - List doctors
router.get('/', authenticate, async (req, res) => {
  try {
    const where = {};

    // MR can only see their assigned doctors
    if (req.user.role === 'MR') {
      where.assignedMrId = req.user.id;
    }

    // Filter by category
    if (req.query.category) {
      where.category = req.query.category;
    }

    // Filter by assigned MR (admin)
    if (req.query.mrId && req.user.role === 'ADMIN') {
      where.assignedMrId = parseInt(req.query.mrId);
    }

    const doctors = await prisma.doctor.findMany({
      where,
      include: {
        assignedMr: { select: { id: true, name: true } },
        _count: { select: { visits: true, orders: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: doctors });
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({ success: false, message: 'Error fetching doctors.' });
  }
});

// GET /api/doctors/:id - Get single doctor
router.get('/:id', authenticate, async (req, res) => {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        assignedMr: { select: { id: true, name: true, mobile: true } },
        visits: { take: 10, orderBy: { visitDate: 'desc' }, include: { mr: { select: { name: true } } } },
        orders: { take: 10, orderBy: { date: 'desc' } },
      },
    });

    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found.' });

    // MR can only view their own assigned doctors
    if (req.user.role === 'MR' && doctor.assignedMrId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, data: doctor });
  } catch (error) {
    console.error('Get doctor error:', error);
    res.status(500).json({ success: false, message: 'Error fetching doctor.' });
  }
});

// POST /api/doctors - Add doctor
router.post('/', authenticate, async (req, res) => {
  try {
    const { doctorName, specialization, mobile, address, category } = req.body;

    if (!doctorName || !mobile) {
      return res.status(400).json({ success: false, message: 'Doctor name and mobile are required.' });
    }

    const doctor = await prisma.doctor.create({
      data: {
        doctorName,
        specialization,
        mobile,
        address,
        category: category || 'C',
        assignedMrId: req.user.role === 'MR' ? req.user.id : (req.body.assignedMrId || null),
      },
    });

    res.status(201).json({ success: true, message: 'Doctor added successfully.', data: doctor });
  } catch (error) {
    console.error('Create doctor error:', error);
    res.status(500).json({ success: false, message: 'Error adding doctor.' });
  }
});

// PUT /api/doctors/:id - Update doctor
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { doctorName, specialization, mobile, address, category, assignedMrId, status } = req.body;
    const updateData = {};

    if (doctorName) updateData.doctorName = doctorName;
    if (specialization !== undefined) updateData.specialization = specialization;
    if (mobile) updateData.mobile = mobile;
    if (address !== undefined) updateData.address = address;
    if (category) updateData.category = category;
    if (status) updateData.status = status;

    // Only admin can reassign doctors
    if (assignedMrId !== undefined && req.user.role === 'ADMIN') {
      updateData.assignedMrId = assignedMrId;
    }

    const doctor = await prisma.doctor.update({
      where: { id: parseInt(req.params.id) },
      data: updateData,
    });

    res.json({ success: true, message: 'Doctor updated successfully.', data: doctor });
  } catch (error) {
    console.error('Update doctor error:', error);
    res.status(500).json({ success: false, message: 'Error updating doctor.' });
  }
});

// DELETE /api/doctors/:id - Delete doctor (Admin only)
router.delete('/:id', authenticate, adminOnly, async (req, res) => {
  try {
    await prisma.doctor.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true, message: 'Doctor deleted successfully.' });
  } catch (error) {
    console.error('Delete doctor error:', error);
    res.status(500).json({ success: false, message: 'Error deleting doctor.' });
  }
});

module.exports = router;
