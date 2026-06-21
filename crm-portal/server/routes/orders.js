/* ============================================
   Order Management Routes
   ============================================ */
const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate, adminOnly } = require('../middleware/auth');

// GET /api/orders - List orders
router.get('/', authenticate, async (req, res) => {
  try {
    const where = {};

    if (req.user.role === 'MR') {
      where.mrId = req.user.id;
    }

    if (req.query.status) where.status = req.query.status;
    if (req.query.doctorId) where.doctorId = parseInt(req.query.doctorId);
    if (req.query.mrId && req.user.role === 'ADMIN') where.mrId = parseInt(req.query.mrId);

    const orders = await prisma.order.findMany({
      where,
      include: {
        doctor: { select: { id: true, doctorName: true } },
        mr: { select: { id: true, name: true } },
        offer: { select: { id: true, offerName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(req.query.limit) || 50,
    });

    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ success: false, message: 'Error fetching orders.' });
  }
});

// POST /api/orders - Place order (MR)
router.post('/', authenticate, async (req, res) => {
  try {
    const { doctorId, products, totalAmount, offerId } = req.body;

    if (!doctorId || !products || !totalAmount) {
      return res.status(400).json({ success: false, message: 'Doctor, products, and total amount are required.' });
    }

    const order = await prisma.order.create({
      data: {
        doctorId: parseInt(doctorId),
        mrId: req.user.id,
        products,
        totalAmount: parseFloat(totalAmount),
        offerId: offerId ? parseInt(offerId) : null,
        status: 'PENDING',
      },
      include: {
        doctor: { select: { doctorName: true } },
      },
    });

    res.status(201).json({ success: true, message: 'Order placed successfully.', data: order });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, message: 'Error placing order.' });
  }
});

// PUT /api/orders/:id/status - Update order status (Admin)
router.put('/:id/status', authenticate, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['PENDING', 'APPROVED', 'DISPATCHED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    const order = await prisma.order.update({
      where: { id: parseInt(req.params.id) },
      data: { status },
      include: {
        doctor: { select: { doctorName: true } },
        mr: { select: { name: true } },
      },
    });

    res.json({ success: true, message: `Order ${status.toLowerCase()} successfully.`, data: order });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ success: false, message: 'Error updating order.' });
  }
});

module.exports = router;
