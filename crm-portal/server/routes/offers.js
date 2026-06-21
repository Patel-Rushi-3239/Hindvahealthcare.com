/* ============================================
   Offer Management Routes (Admin Only)
   ============================================ */
const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate, adminOnly } = require('../middleware/auth');

// GET /api/offers - List offers (both Admin & MR can see active offers)
router.get('/', authenticate, async (req, res) => {
  try {
    const where = {};

    // MRs can only see active offers
    if (req.user.role === 'MR') {
      where.status = 'ACTIVE';
      where.endDate = { gte: new Date() };
    }

    if (req.query.status && req.user.role === 'ADMIN') {
      where.status = req.query.status;
    }

    const offers = await prisma.offer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: offers });
  } catch (error) {
    console.error('Get offers error:', error);
    res.status(500).json({ success: false, message: 'Error fetching offers.' });
  }
});

// POST /api/offers - Create offer (Admin)
router.post('/', authenticate, adminOnly, async (req, res) => {
  try {
    const { offerName, description, startDate, endDate } = req.body;

    if (!offerName || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Offer name, start date, and end date are required.' });
    }

    const offer = await prisma.offer.create({
      data: {
        offerName,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: 'ACTIVE',
      },
    });

    res.status(201).json({ success: true, message: 'Offer created successfully.', data: offer });
  } catch (error) {
    console.error('Create offer error:', error);
    res.status(500).json({ success: false, message: 'Error creating offer.' });
  }
});

// PUT /api/offers/:id - Update offer (Admin)
router.put('/:id', authenticate, adminOnly, async (req, res) => {
  try {
    const { offerName, description, startDate, endDate, status } = req.body;
    const updateData = {};

    if (offerName) updateData.offerName = offerName;
    if (description !== undefined) updateData.description = description;
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) updateData.endDate = new Date(endDate);
    if (status) updateData.status = status;

    const offer = await prisma.offer.update({
      where: { id: parseInt(req.params.id) },
      data: updateData,
    });

    res.json({ success: true, message: 'Offer updated successfully.', data: offer });
  } catch (error) {
    console.error('Update offer error:', error);
    res.status(500).json({ success: false, message: 'Error updating offer.' });
  }
});

// DELETE /api/offers/:id - Delete offer (Admin)
router.delete('/:id', authenticate, adminOnly, async (req, res) => {
  try {
    await prisma.offer.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true, message: 'Offer deleted successfully.' });
  } catch (error) {
    console.error('Delete offer error:', error);
    res.status(500).json({ success: false, message: 'Error deleting offer.' });
  }
});

module.exports = router;
