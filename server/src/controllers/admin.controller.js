import Complaint from '../models/Complaint.js';
import LostFoundItem from '../models/LostFoundItem.js';
import User from '../models/User.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const MAX_SEARCH_LENGTH = 100;

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parsePositiveInteger(value, defaultValue, name, max, errors) {
  if (value === undefined) {
    return defaultValue;
  }

  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    errors.push(`${name} must be a positive integer`);
    return defaultValue;
  }

  const parsedValue = Number(value);

  if (!Number.isSafeInteger(parsedValue) || parsedValue < 1) {
    errors.push(`${name} must be a positive integer`);
    return defaultValue;
  }

  if (max !== undefined && parsedValue > max) {
    errors.push(`${name} cannot exceed ${max}`);
  }

  return parsedValue;
}

function sendValidationErrors(res, errors) {
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors,
  });
}

async function getAnalytics(req, res, next) {
  try {
    const [
      totalComplaints,
      pendingComplaints,
      underReviewComplaints,
      inProgressComplaints,
      resolvedComplaints,
      rejectedComplaints,
      totalLostFound,
      openLostFound,
      claimedLostFound,
      returnedLostFound,
      rejectedLostFound,
      complaintsByCategory,
      complaintsByStatus,
      lostFoundByStatus,
      lostFoundByType,
      recentComplaints,
      recentLostFound,
      resolvedComplaintsWithDates,
    ] = await Promise.all([
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: 'pending' }),
      Complaint.countDocuments({ status: 'under_review' }),
      Complaint.countDocuments({ status: 'in_progress' }),
      Complaint.countDocuments({ status: 'resolved' }),
      Complaint.countDocuments({ status: 'rejected' }),
      LostFoundItem.countDocuments(),
      LostFoundItem.countDocuments({ status: 'open' }),
      LostFoundItem.countDocuments({ status: 'claimed' }),
      LostFoundItem.countDocuments({ status: 'returned' }),
      LostFoundItem.countDocuments({ status: 'rejected' }),
      Complaint.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
      ]),
      Complaint.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      LostFoundItem.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      LostFoundItem.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Complaint.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('createdBy', 'name email role'),
      LostFoundItem.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('reportedBy', 'name email role'),
      Complaint.find({
        status: 'resolved',
        createdAt: { $exists: true },
        updatedAt: { $exists: true },
      }).select('createdAt updatedAt'),
    ]);

    let averageResolutionTimeHours = null;

    const validDurations = resolvedComplaintsWithDates
      .map((complaint) => {
        const start = complaint.createdAt?.getTime();
        const end = complaint.updatedAt?.getTime();

        if (!start || !end || end < start) {
          return null;
        }

        return (end - start) / (1000 * 60 * 60);
      })
      .filter((duration) => duration !== null);

    if (validDurations.length > 0) {
      const totalHours = validDurations.reduce((sum, duration) => sum + duration, 0);
      averageResolutionTimeHours = Number(
        (totalHours / validDurations.length).toFixed(2),
      );
    }

    const inProgressOrReview =
      underReviewComplaints + inProgressComplaints;

    return res.status(200).json({
      success: true,
      analytics: {
        complaints: {
          total: totalComplaints,
          pending: pendingComplaints,
          inProgress: inProgressOrReview,
          underReview: underReviewComplaints,
          inProgressOnly: inProgressComplaints,
          resolved: resolvedComplaints,
          rejected: rejectedComplaints,
          byCategory: complaintsByCategory,
          byStatus: complaintsByStatus,
        },
        lostFound: {
          total: totalLostFound,
          open: openLostFound,
          claimed: claimedLostFound,
          returned: returnedLostFound,
          rejected: rejectedLostFound,
          byStatus: lostFoundByStatus,
          byType: lostFoundByType,
        },
        recent: {
          complaints: recentComplaints,
          lostFound: recentLostFound,
        },
        averageResolutionTimeHours,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function getUsers(req, res, next) {
  try {
    const query = req.query ?? {};
    const errors = [];
    const filters = {};

    if (query.role !== undefined) {
      if (typeof query.role !== 'string' || !['student', 'admin'].includes(query.role)) {
        errors.push('Role must be one of: student, admin');
      } else {
        filters.role = query.role;
      }
    }

    if (query.search !== undefined) {
      if (typeof query.search !== 'string') {
        errors.push('Search keyword must be a string');
      } else {
        const search = query.search.trim();

        if (search.length > MAX_SEARCH_LENGTH) {
          errors.push(`Search keyword cannot exceed ${MAX_SEARCH_LENGTH} characters`);
        } else if (search) {
          const searchPattern = new RegExp(escapeRegExp(search), 'i');

          filters.$or = [
            { name: searchPattern },
            { email: searchPattern },
            { studentId: searchPattern },
            { department: searchPattern },
          ];
        }
      }
    }

    const page = parsePositiveInteger(query.page, DEFAULT_PAGE, 'Page', undefined, errors);
    const limit = parsePositiveInteger(query.limit, DEFAULT_LIMIT, 'Limit', MAX_LIMIT, errors);

    if (errors.length > 0) {
      return sendValidationErrors(res, errors);
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(filters)
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filters),
    ]);

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    return next(error);
  }
}

export { getAnalytics, getUsers };
