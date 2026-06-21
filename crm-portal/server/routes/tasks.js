/* ============================================
   Task Management Routes
   ============================================ */
const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate, adminOnly } = require('../middleware/auth');

// GET /api/tasks - List tasks
router.get('/', authenticate, async (req, res) => {
  try {
    const where = {};

    if (req.user.role === 'MR') {
      where.assignedToId = req.user.id;
    }

    if (req.query.status) where.status = req.query.status;
    if (req.query.assignedTo && req.user.role === 'ADMIN') {
      where.assignedToId = parseInt(req.query.assignedTo);
    }
    if (req.query.taskType) where.taskType = req.query.taskType;

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignedTo: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
    });

    res.json({ success: true, data: tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ success: false, message: 'Error fetching tasks.' });
  }
});

// POST /api/tasks - Create task (Admin)
router.post('/', authenticate, adminOnly, async (req, res) => {
  try {
    const { title, description, assignedToId, priority, taskType, dueDate } = req.body;

    if (!title || !assignedToId) {
      return res.status(400).json({ success: false, message: 'Title and assigned MR are required.' });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        assignedToId: parseInt(assignedToId),
        createdById: req.user.id,
        priority: priority || 'MEDIUM',
        taskType: taskType || 'ONE_TIME',
        dueDate: dueDate ? new Date(dueDate) : null,
        status: 'PENDING',
      },
      include: {
        assignedTo: { select: { name: true } },
      },
    });

    res.status(201).json({ success: true, message: 'Task assigned successfully.', data: task });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ success: false, message: 'Error creating task.' });
  }
});

// PUT /api/tasks/:id/status - Update task status (MR can mark complete, Admin can do anything)
router.put('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const taskId = parseInt(req.params.id);

    // Verify MR can only update their own tasks
    if (req.user.role === 'MR') {
      const task = await prisma.task.findUnique({ where: { id: taskId } });
      if (!task || task.assignedToId !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: { status },
    });

    res.json({ success: true, message: 'Task updated successfully.', data: updated });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ success: false, message: 'Error updating task.' });
  }
});

// DELETE /api/tasks/:id - Delete task (Admin)
router.delete('/:id', authenticate, adminOnly, async (req, res) => {
  try {
    await prisma.task.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true, message: 'Task deleted successfully.' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ success: false, message: 'Error deleting task.' });
  }
});

module.exports = router;
