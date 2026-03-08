const express = require('express');
const Report = require('../models/Report');
const User = require('../models/User');
const adminauthenticate = require('../middleware/admin');
const authenticate = require('../middleware/auth');
const router = express.Router();

// Report a user
router.post('/report', authenticate , async (req, res) => {
  try {
    const { reportedUserId, reason } = req.body;
    const reporterUserId = req.user.id; // Get the reporter's user ID from the authentication token

    const report = new Report({
      reportedUserId,
      reporterUserId,
      reason,
    });

    await report.save();
    res.status(201).json({ message: 'Report submitted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit report', error: err.message });
  }
});

// Admin endpoint to view all reports
router.get('/admin/reports', adminauthenticate, async (req, res) => {
  try {
    const reports = await Report.find({status: { $in: ['reported', 'banned', 'pending'] }  }).populate('reportedUserId reporterUserId');
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch reports', error: err.message });
  }
});

router.put('/admin/reports/:reportId', adminauthenticate, async (req, res) => {
    const { reportId } = req.params;
    const { status } = req.body; // The status can be 'banned' or 'deactivated'
  
    try {
      const report = await Report.findById(reportId);
      if (!report) {
        console.log(`Report not found with ID: ${reportId}`);
        return res.status(404).json({ message: 'Report not found.' });
      }
  
      // Validate the status
      if (!['banned', 'deactivated'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
      }
  
      // Update the status of the report
      report.status = status;
      await report.save();
  
      // Take action on the reported user (ban or deactivate)
      const user = await User.findById(report.reportedUserId);
      if (!user) {
        console.log(`User not found with ID: ${report.reportedUserId}`);
        return res.status(404).json({ message: 'User not found.' });
      }
  
      if (status === 'banned') {
        user.isBanned = true;
      } else if (status === 'deactivated') {
        user.isActive = false;
      }
      await user.save();
  
      res.status(200).json({ message: 'Report status updated successfully.' });
    } catch (err) {
      console.error('Error occurred:', err);
      res.status(500).json({ message: 'Failed to update report status', error: err.message });
    }
  });

  router.put('/admin/reports/:reportId/unban', adminauthenticate, async (req, res) => {
    try {
        const { reportId } = req.params;

        // Find the report
        const report = await Report.findById(reportId);
        if (!report) {
            return res.status(404).json({ message: 'Report not found.' });
        }

        // Find the reported user
        const user = await User.findById(report.reportedUserId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Unban the user
        user.isBanned = false;
        await user.save();

        report.status = 'resolved'; 
        await report.save();

        res.status(200).json({ message: 'User has been unbanned successfully.' });
    } catch (err) {
        console.error('Error unbanning user:', err);
        res.status(500).json({ message: 'Failed to unban user', error: err.message });
    }
});

  

module.exports = router;
