import crypto from 'node:crypto';

import mongoose from 'mongoose';

import Complaint, { COMPLAINT_STATUSES } from '../models/Complaint.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

const COMPLAINT_PRIORITIES = ['low', 'medium', 'high'];
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;
const MAX_SEARCH_LENGTH = 100;
const MAX_REMARK_LENGTH = 1000;
const PUBLIC_USER_FIELDS = 'name email role department studentId';

const TEXT_FIELD_RULES = {
  title: { label: 'Title', maxLength: 150 },
  description: { label: 'Description', maxLength: 2000 },
  category: { label: 'Category', maxLength: 100 },
  location: { label: 'Location', maxLength: 200 },
};

const STUDENT_EDITABLE_FIELDS = Object.keys(TEXT_FIELD_RULES);
const ADMIN_EDITABLE_FIELDS = [
  ...STUDENT_EDITABLE_FIELDS,
  'priority',
  'assignedTo',
];

const ALLOWED_STATUS_TRANSITIONS = {
  pending: ['under_review', 'in_progress', 'rejected'],
  under_review: ['in_progress', 'rejected'],
  in_progress: ['resolved', 'rejected'],
  resolved: [],
  rejected: [],
};

function populateUserReferences(target) {
  return target.populate([
    { path: 'createdBy', select: PUBLIC_USER_FIELDS },
    { path: 'assignedTo', select: PUBLIC_USER_FIELDS },
  ]);
}

function sendValidationErrors(res, errors) {
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors,
  });
}

function handleValidationError(error, res, next) {
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(
      (validationError) => validationError.message,
    );

    return sendValidationErrors(res, errors);
  }

  return next(error);
}

function parseTextField(value, { label, maxLength }) {
  if (typeof value !== 'string') {
    return { error: `${label} must be a string` };
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return { error: `${label} is required` };
  }

  if (trimmedValue.length > maxLength) {
    return { error: `${label} cannot exceed ${maxLength} characters` };
  }

  return { value: trimmedValue };
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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function generateTicketId() {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase();

  return `CMP-${datePart}-${randomPart}`;
}

async function createComplaintWithUniqueTicket(complaintData) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await Complaint.create({
        ...complaintData,
        ticketId: generateTicketId(),
      });
    } catch (error) {
      if (error?.code === 11000 && error?.keyPattern?.ticketId) {
        continue;
      }

      throw error;
    }
  }

  throw new Error('Unable to generate a unique complaint ticket ID');
}

function isValidComplaintId(id) {
  return mongoose.isValidObjectId(id);
}

async function createComplaint(req, res, next) {
  try {
    const body = req.body ?? {};

    if (typeof body !== 'object' || Array.isArray(body)) {
      return sendValidationErrors(res, ['Request body must be a JSON object']);
    }

    const errors = [];
    const values = {};

    for (const [field, rule] of Object.entries(TEXT_FIELD_RULES)) {
      const result = parseTextField(body[field], rule);

      if (result.error) {
        errors.push(result.error);
      } else {
        values[field] = result.value;
      }
    }

    if (errors.length > 0) {
      return sendValidationErrors(res, errors);
    }

    const createdAt = new Date();
    const complaint = await createComplaintWithUniqueTicket({
      ...values,
      status: 'pending',
      priority: 'medium',
      createdBy: req.user.id,
      history: [
        {
          status: 'pending',
          remark: 'Complaint created',
          actor: req.user.id,
          changedAt: createdAt,
        },
      ],
    });

    await populateUserReferences(complaint);

    return res.status(201).json({
      success: true,
      message: 'Complaint created successfully',
      ticketId: complaint.ticketId,
      complaint,
    });
  } catch (error) {
    return handleValidationError(error, res, next);
  }
}

async function listComplaints(req, res, next) {
  try {
    const query = req.query ?? {};
    const errors = [];
    const filters = {};

    if (req.user.role !== 'admin') {
      filters.createdBy = req.user.id;
    }

    if (query.status !== undefined) {
      if (
        typeof query.status !== 'string' ||
        !COMPLAINT_STATUSES.includes(query.status)
      ) {
        errors.push(`Status must be one of: ${COMPLAINT_STATUSES.join(', ')}`);
      } else {
        filters.status = query.status;
      }
    }

    if (query.priority !== undefined) {
      if (
        typeof query.priority !== 'string' ||
        !COMPLAINT_PRIORITIES.includes(query.priority)
      ) {
        errors.push(
          `Priority must be one of: ${COMPLAINT_PRIORITIES.join(', ')}`,
        );
      } else {
        filters.priority = query.priority;
      }
    }

    if (query.category !== undefined) {
      if (typeof query.category !== 'string') {
        errors.push('Category filter must be a string');
      } else {
        const category = query.category.trim();

        if (category.length > 100) {
          errors.push('Category filter cannot exceed 100 characters');
        } else if (category) {
          filters.category = new RegExp(
            `^${escapeRegExp(category)}$`,
            'i',
          );
        }
      }
    }

    if (query.search !== undefined) {
      if (typeof query.search !== 'string') {
        errors.push('Search keyword must be a string');
      } else {
        const search = query.search.trim();

        if (search.length > MAX_SEARCH_LENGTH) {
          errors.push(
            `Search keyword cannot exceed ${MAX_SEARCH_LENGTH} characters`,
          );
        } else if (search) {
          const searchPattern = new RegExp(escapeRegExp(search), 'i');

          filters.$or = [
            { ticketId: searchPattern },
            { title: searchPattern },
            { description: searchPattern },
            { category: searchPattern },
            { location: searchPattern },
          ];
        }
      }
    }

    const page = parsePositiveInteger(
      query.page,
      DEFAULT_PAGE,
      'Page',
      undefined,
      errors,
    );
    const limit = parsePositiveInteger(
      query.limit,
      DEFAULT_LIMIT,
      'Limit',
      MAX_LIMIT,
      errors,
    );

    if (errors.length > 0) {
      return sendValidationErrors(res, errors);
    }

    const skip = (page - 1) * limit;

    const [complaints, total] = await Promise.all([
      populateUserReferences(
        Complaint.find(filters)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
      ),
      Complaint.countDocuments(filters),
    ]);

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      count: complaints.length,
      complaints,
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

async function getComplaintById(req, res, next) {
  try {
    if (!isValidComplaintId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid complaint ID',
      });
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found',
      });
    }

    if (
      req.user.role !== 'admin' &&
      complaint.createdBy.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this complaint',
      });
    }

    await populateUserReferences(complaint);

    return res.status(200).json({
      success: true,
      complaint,
    });
  } catch (error) {
    return next(error);
  }
}

async function updateComplaint(req, res, next) {
  try {
    if (!isValidComplaintId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid complaint ID',
      });
    }

    const body = req.body ?? {};

    if (typeof body !== 'object' || Array.isArray(body)) {
      return sendValidationErrors(res, ['Request body must be a JSON object']);
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found',
      });
    }

    const isAdmin = req.user.role === 'admin';

    if (!isAdmin) {
      if (complaint.createdBy.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to update this complaint',
        });
      }

      if (complaint.status !== 'pending') {
        return res.status(409).json({
          success: false,
          message: 'Only pending complaints can be edited',
        });
      }
    }

    const providedFields = Object.keys(body);
    const allowedFields = isAdmin
      ? ADMIN_EDITABLE_FIELDS
      : STUDENT_EDITABLE_FIELDS;
    const forbiddenFields = providedFields.filter(
      (field) => !allowedFields.includes(field),
    );

    if (providedFields.length === 0) {
      return sendValidationErrors(res, [
        'At least one editable field must be provided',
      ]);
    }

    if (forbiddenFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'One or more fields cannot be updated',
        fields: forbiddenFields,
      });
    }

    const errors = [];
    const updates = {};

    for (const field of providedFields) {
      const textRule = TEXT_FIELD_RULES[field];

      if (textRule) {
        const result = parseTextField(body[field], textRule);

        if (result.error) {
          errors.push(result.error);
        } else {
          updates[field] = result.value;
        }
      } else if (field === 'priority') {
        if (
          typeof body.priority !== 'string' ||
          !COMPLAINT_PRIORITIES.includes(body.priority)
        ) {
          errors.push(
            `Priority must be one of: ${COMPLAINT_PRIORITIES.join(', ')}`,
          );
        } else {
          updates.priority = body.priority;
        }
      } else if (field === 'assignedTo') {
        if (body.assignedTo === null) {
          updates.assignedTo = null;
        } else if (
          typeof body.assignedTo !== 'string' ||
          !mongoose.isValidObjectId(body.assignedTo)
        ) {
          errors.push('Assigned user must be a valid user ID or null');
        } else {
          const assignedUserExists = await User.exists({
            _id: body.assignedTo,
          });

          if (!assignedUserExists) {
            errors.push('Assigned user does not exist');
          } else {
            updates.assignedTo = body.assignedTo;
          }
        }
      }
    }

    if (errors.length > 0) {
      return sendValidationErrors(res, errors);
    }

    complaint.set(updates);
    await complaint.save();
    await populateUserReferences(complaint);

    return res.status(200).json({
      success: true,
      message: 'Complaint updated successfully',
      complaint,
    });
  } catch (error) {
    return handleValidationError(error, res, next);
  }
}

async function updateComplaintStatus(req, res, next) {
  try {
    if (!isValidComplaintId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid complaint ID',
      });
    }

    const body = req.body ?? {};

    if (typeof body !== 'object' || Array.isArray(body)) {
      return sendValidationErrors(res, ['Request body must be a JSON object']);
    }

    const allowedFields = ['status', 'remarks'];
    const forbiddenFields = Object.keys(body).filter(
      (field) => !allowedFields.includes(field),
    );

    if (forbiddenFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'One or more fields cannot be updated',
        fields: forbiddenFields,
      });
    }

    const errors = [];

    if (
      typeof body.status !== 'string' ||
      !COMPLAINT_STATUSES.includes(body.status)
    ) {
      errors.push(`Status must be one of: ${COMPLAINT_STATUSES.join(', ')}`);
    }

    let remarks;

    if (body.remarks !== undefined) {
      if (typeof body.remarks !== 'string') {
        errors.push('Remarks must be a string');
      } else {
        remarks = body.remarks.trim();

        if (remarks.length > MAX_REMARK_LENGTH) {
          errors.push(
            `Remarks cannot exceed ${MAX_REMARK_LENGTH} characters`,
          );
        }
      }
    }

    if (errors.length === 0 && body.status === 'rejected' && !remarks) {
      errors.push('A reason in remarks is required when rejecting a complaint');
    }

    if (errors.length > 0) {
      return sendValidationErrors(res, errors);
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found',
      });
    }

    if (complaint.status === body.status) {
      return sendValidationErrors(res, [
        `Complaint already has status ${body.status}`,
      ]);
    }

    const allowedNextStatuses = ALLOWED_STATUS_TRANSITIONS[complaint.status];

    if (!allowedNextStatuses.includes(body.status)) {
      return sendValidationErrors(res, [
        `Cannot change status from ${complaint.status} to ${body.status}`,
      ]);
    }

    const previousStatus = complaint.status;

    complaint.status = body.status;
    complaint.history.push({
      previousStatus,
      status: body.status,
      remark: remarks || undefined,
      actor: req.user.id,
      changedAt: new Date(),
    });

    await complaint.save();

    const remarkText = remarks ? ` Remarks: ${remarks}` : '';
    const notificationMessage = [
      `Your complaint ${complaint.ticketId} status changed from`,
      `${previousStatus} to ${body.status}.${remarkText}`,
    ].join(' ');

    await Notification.create({
      userId: complaint.createdBy,
      title: `Complaint ${complaint.ticketId} status updated`,
      message: notificationMessage.slice(0, 1000),
    });

    await populateUserReferences(complaint);

    return res.status(200).json({
      success: true,
      message: 'Complaint status updated successfully',
      complaint,
    });
  } catch (error) {
    return handleValidationError(error, res, next);
  }
}

async function deleteComplaint(req, res, next) {
  try {
    if (!isValidComplaintId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid complaint ID',
      });
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found',
      });
    }

    if (req.user.role !== 'admin') {
      if (complaint.createdBy.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to delete this complaint',
        });
      }

      if (complaint.status !== 'pending') {
        return res.status(409).json({
          success: false,
          message: 'Only pending complaints can be deleted',
        });
      }
    }

    await complaint.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Complaint deleted successfully',
      ticketId: complaint.ticketId,
    });
  } catch (error) {
    return next(error);
  }
}

export {
  createComplaint,
  listComplaints,
  getComplaintById,
  updateComplaint,
  updateComplaintStatus,
  deleteComplaint,
};
