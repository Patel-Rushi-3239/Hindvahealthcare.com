/* ============================================
   Auth Routes - Login & Register
   ============================================ */
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ success: false, message: 'Your account is inactive. Contact Admin.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

// GET /api/auth/me - Get current user
router.get('/me', authenticate, async (req, res) => {
  res.json({ success: true, user: req.user });
});

// POST /api/auth/seed - Create initial admin (one-time use)
router.post('/seed', async (req, res) => {
  try {
    const existingAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (existingAdmin) {
      return res.status(400).json({ success: false, message: 'Admin already exists.' });
    }

    const hashedPassword = await bcrypt.hash('admin123', 12);
    const admin = await prisma.user.create({
      data: {
        name: 'Hindva Admin',
        email: 'admin@hindvahealthcare.com',
        mobile: '9316077512',
        password: hashedPassword,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    const { password: _, ...adminWithoutPassword } = admin;
    res.json({
      success: true,
      message: 'Admin created successfully! Login with: admin@hindvahealthcare.com / admin123',
      user: adminWithoutPassword,
    });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ success: false, message: 'Error creating admin.' });
  }
});

module.exports = router;
