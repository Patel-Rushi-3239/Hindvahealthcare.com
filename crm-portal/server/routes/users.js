/* ============================================
   User (MR) Management Routes - Admin Only
   ============================================ */
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { authenticate, adminOnly } = require('../middleware/auth');

// GET /api/users - List all MRs (Admin)
router.get('/', authenticate, adminOnly, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'MR' },
      select: {
        id: true, name: true, email: true, mobile: true,
        territory: true, status: true, createdAt: true,
        _count: { select: { doctorsAssigned: true, ordersPlaced: true, visits: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Error fetching users.' });
  }
});

// GET /api/users/:id - Get single MR
router.get('/:id', authenticate, adminOnly, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id) },
      select: {
        id: true, name: true, email: true, mobile: true,
        territory: true, status: true, role: true, createdAt: true,
        doctorsAssigned: { select: { id: true, doctorName: true, category: true } },
      },
    });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, message: 'Error fetching user.' });
  }
});

// POST /api/users - Create MR (Admin)
router.post('/', authenticate, adminOnly, async (req, res) => {
  try {
    const { name, email, mobile, password, territory } = req.body;

    if (!name || !email || !mobile || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, mobile, and password are required.' });
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { mobile }] },
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User with this email or mobile already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, mobile, password: hashedPassword, role: 'MR', territory, status: 'ACTIVE' },
    });

    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json({ success: true, message: 'MR created successfully.', data: userWithoutPassword });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, message: 'Error creating user.' });
  }
});

// PUT /api/users/:id - Update MR (Admin)
router.put('/:id', authenticate, adminOnly, async (req, res) => {
  try {
    const { name, email, mobile, territory, status, password } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (mobile) updateData.mobile = mobile;
    if (territory !== undefined) updateData.territory = territory;
    if (status) updateData.status = status;
    if (password) updateData.password = await bcrypt.hash(password, 12);

    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: updateData,
    });

    const { password: _, ...userWithoutPassword } = user;
    res.json({ success: true, message: 'MR updated successfully.', data: userWithoutPassword });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Error updating user.' });
  }
});

// DELETE /api/users/:id - Delete MR (Admin)
router.delete('/:id', authenticate, adminOnly, async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true, message: 'MR deleted successfully.' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Error deleting user.' });
  }
});

module.exports = router;
