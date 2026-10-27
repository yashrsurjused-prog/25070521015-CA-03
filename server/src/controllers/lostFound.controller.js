import mongoose from 'mongoose';

import LostFoundItem, {
  LOST_FOUND_STATUSES,
  LOST_FOUND_TYPES,
} from '../models/LostFoundItem.js';
import Notification from '../models/Notification.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;
const MAX_SEARCH_LENGTH = 100;
const MAX_CLAIM_MESSAGE_LENGTH = 500;
const MAX_REVIEW_NOTE_LENGTH = 1000;
const MAX_IMAGE_URL_LENGTH = 2048;
const PUBLIC_USER_FIELDS = 'name email role department studentId';

const TEXT_FIELD_RULES = {
  title: { label: 'Title', maxLength: 150 },
  category: { label: 'Category', maxLength: 100 },
  description: { label: 'Description', maxLength: 2000 },
  location: { label: 'Location', maxLength: 200 },
};

const CONTENT_FIELDS = [
  ...Object.keys(TEXT_FIELD_RULES),
  'type',
  'eventDate',
  'imageUrl',
];

const ALLOWED_STATUS_TRANSITIONS = {
  open: ['claimed', 'rejected'],
  claimed: ['open', 'returned', 'rejected'],
  returned: [],
  rejected: [],
};

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

function isValidItemId(id) {
  return mongoose.isValidObjectId(id);
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

function parseType(value) {
  if (typeof value !== 'string' || !LOST_FOUND_TYPES.includes(value)) {
    return {
      error: `Type must be one of: ${LOST_FOUND_TYPES.join(', ')}`,
    };
  }

  return { value };
}

function parseOptionalEventDate(value) {
  if (value === undefined) {
    return {};
  }

  if (value === null) {
    return { value: null };
  }

  if (typeof value !== 'string' || !value.trim()) {
    return { error: 'Event date must be a valid date string or null' };
  }

  const parsedDate = new Date(value.trim());

  if (Number.isNaN(parsedDate.getTime())) {
    return { error: 'Event date must be a valid date' };
  }

  if (parsedDate.getTime() > Date.now() + 5 * 60 * 1000) {
    return { error: 'Event date cannot be in the future' };
  }

  return { value: parsedDate };
}

function parseOptionalImageUrl(value) {
  if (value === undefined) {
    return {};
  }

  if (value === null) {
    return { value: null };
  }

  if (typeof value !== 'string') {
    return { error: 'Image URL must be a string or null' };
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return { value: null };
  }

  if (trimmedValue.length > MAX_IMAGE_URL_LENGTH) {
    return {
      error: `Image URL cannot exceed ${MAX_IMAGE_URL_LENGTH} characters`,
    };
  }

  try {
    const parsedUrl = new URL(trimmedValue);

    if (!['http:', 'https:'].includes(parsedUrl.protocol) || !parsedUrl.host) {
      return { error: 'Image URL must use http:// or https://' };
    }
  } catch {
    return { error: 'Image URL must be a valid URL' };
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

function parseFilterDate(value, name, errors, endOfDay = false) {
  if (value === undefined) {
    return null;
  }

  if (typeof value !== 'string' || !value.trim()) {
    errors.push(`${name} must be a valid date`);
    return null;
  }

  const trimmedValue = value.trim();
  const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;
  const normalizedValue = dateOnlyPattern.test(trimmedValue)
    ? `${trimmedValue}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`
    : trimmedValue;
  const parsedDate = new Date(normalizedValue);

  if (Number.isNaN(parsedDate.getTime())) {
    errors.push(`${name} must be a valid date`);
    return null;
  }

  return parsedDate;
}

function populateItemReferences(target) {
  return target.populate([
    { path: 'reportedBy', select: PUBLIC_USER_FIELDS },
    { path: 'claim.requestedBy', select: PUBLIC_USER_FIELDS },
    { path: 'claim.reviewedBy', select: PUBLIC_USER_FIELDS },
    { path: 'moderatedBy', select: PUBLIC_USER_FIELDS },
  ]);
}

function referenceId(reference) {
  if (!reference) {
    return null;
  }

  if (reference._id) {
    return reference._id.toString();
  }

  return reference.toString();
}

function serializeItem(item, user) {
  const serializedItem = item.toObject ? item.toObject() : item;
  const isAdmin = user.role === 'admin';
  const isReporter = referenceId(serializedItem.reportedBy) === user.id;
  const isClaimant =
    referenceId(serializedItem.claim?.requestedBy) === user.id;

  if (!isAdmin) {
    delete serializedItem.moderatedBy;
    delete serializedItem.moderatedAt;
    delete serializedItem.moderationReason;

    if (!isReporter && !isClaimant) {
      delete serializedItem.claim;
    }
  }

  return serializedItem;
}

async function createNotification(userId, title, message) {
  if (!userId) {
    return;
  }

  await Notification.create({
    userId,
    title: title.slice(0, 150),
    message: message.slice(0, 1000),
  });
}

async function createNotifications(notifications) {
  const uniqueNotifications = notifications.filter(
    (notification, index, list) =>
      notification.userId &&
      list.findIndex(
        (candidate) =>
          candidate.userId.toString() === notification.userId.toString(),
      ) === index,
  );

  await Promise.all(
    uniqueNotifications.map((notification) =>
      createNotification(
        notification.userId,
        notification.title,
        notification.message,
      ),
    ),
  );
}

async function createItem(req, res, next) {
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

    const typeResult = parseType(body.type);
    if (typeResult.error) {
      errors.push(typeResult.error);
    } else {
      values.type = typeResult.value;
    }

    const eventDateResult = parseOptionalEventDate(body.eventDate);
    if (eventDateResult.error) {
      errors.push(eventDateResult.error);
    } else if (eventDateResult.value) {
      values.eventDate = eventDateResult.value;
    }

    const imageUrlResult = parseOptionalImageUrl(body.imageUrl);
    if (imageUrlResult.error) {
      errors.push(imageUrlResult.error);
    } else if (imageUrlResult.value) {
      values.imageUrl = imageUrlResult.value;
    }

    if (errors.length > 0) {
      return sendValidationErrors(res, errors);
    }

    const item = await LostFoundItem.create({
      ...values,
      status: 'open',
      reportedBy: req.user.id,
    });

    await populateItemReferences(item);

    return res.status(201).json({
      success: true,
      message: 'Lost-and-found item reported successfully',
      item: serializeItem(item, req.user),
    });
  } catch (error) {
    return handleValidationError(error, res, next);
  }
}

async function listItems(req, res, next) {
  try {
    const query = req.query ?? {};
    const errors = [];
    const filters = {};
    const isAdmin = req.user.role === 'admin';
    let requestedStatus;

    if (query.status !== undefined) {
      if (
        typeof query.status !== 'string' ||
        !LOST_FOUND_STATUSES.includes(query.status)
      ) {
        errors.push(
          `Status must be one of: ${LOST_FOUND_STATUSES.join(', ')}`,
        );
      } else {
        requestedStatus = query.status;
      }
    }

    if (isAdmin) {
      if (requestedStatus) {
        filters.status = requestedStatus;
      }
    } else if (requestedStatus && requestedStatus !== 'rejected') {
      filters.status = requestedStatus;
    } else if (requestedStatus === 'rejected') {
      filters.status = { $in: [] };
    } else {
      filters.status = { $ne: 'rejected' };
    }

    if (query.type !== undefined) {
      if (
        typeof query.type !== 'string' ||
        !LOST_FOUND_TYPES.includes(query.type)
      ) {
        errors.push(`Type must be one of: ${LOST_FOUND_TYPES.join(', ')}`);
      } else {
        filters.type = query.type;
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

    if (query.location !== undefined) {
      if (typeof query.location !== 'string') {
        errors.push('Location filter must be a string');
      } else {
        const location = query.location.trim();

        if (location.length > 200) {
          errors.push('Location filter cannot exceed 200 characters');
        } else if (location) {
          filters.location = new RegExp(
            `^${escapeRegExp(location)}$`,
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
            { title: searchPattern },
            { description: searchPattern },
          ];
        }
      }
    }

    const dateFrom = parseFilterDate(
      query.dateFrom,
      'dateFrom',
      errors,
      false,
    );
    const dateTo = parseFilterDate(query.dateTo, 'dateTo', errors, true);

    if (dateFrom && dateTo && dateFrom.getTime() > dateTo.getTime()) {
      errors.push('dateFrom cannot be later than dateTo');
    }

    if (dateFrom || dateTo) {
      filters.eventDate = {};
      if (dateFrom) {
        filters.eventDate.$gte = dateFrom;
      }
      if (dateTo) {
        filters.eventDate.$lte = dateTo;
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

    const [items, total] = await Promise.all([
      populateItemReferences(
        LostFoundItem.find(filters)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
      ),
      LostFoundItem.countDocuments(filters),
    ]);

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      count: items.length,
      items: items.map((item) => serializeItem(item, req.user)),
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

async function getItemById(req, res, next) {
  try {
    if (!isValidItemId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid lost-and-found item ID',
      });
    }

    const item = await LostFoundItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Lost-and-found item not found',
      });
    }

    if (req.user.role !== 'admin' && item.status === 'rejected') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this item',
      });
    }

    await populateItemReferences(item);

    return res.status(200).json({
      success: true,
      item: serializeItem(item, req.user),
    });
  } catch (error) {
    return next(error);
  }
}

async function updateItem(req, res, next) {
  try {
    if (!isValidItemId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid lost-and-found item ID',
      });
    }

    const body = req.body ?? {};

    if (typeof body !== 'object' || Array.isArray(body)) {
      return sendValidationErrors(res, ['Request body must be a JSON object']);
    }

    const item = await LostFoundItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Lost-and-found item not found',
      });
    }

    const isAdmin = req.user.role === 'admin';

    if (!isAdmin) {
      if (item.reportedBy.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to update this item',
        });
      }

      if (item.status !== 'open') {
        return res.status(409).json({
          success: false,
          message: 'Only open listings can be edited',
        });
      }
    }

    const providedFields = Object.keys(body);
    const forbiddenFields = providedFields.filter(
      (field) => !CONTENT_FIELDS.includes(field),
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
      } else if (field === 'type') {
        const result = parseType(body.type);

        if (result.error) {
          errors.push(result.error);
        } else {
          updates.type = result.value;
        }
      } else if (field === 'eventDate') {
        const result = parseOptionalEventDate(body.eventDate);

        if (result.error) {
          errors.push(result.error);
        } else {
          updates.eventDate = result.value;
        }
      } else if (field === 'imageUrl') {
        const result = parseOptionalImageUrl(body.imageUrl);

        if (result.error) {
          errors.push(result.error);
        } else {
          updates.imageUrl = result.value;
        }
      }
    }

    if (errors.length > 0) {
      return sendValidationErrors(res, errors);
    }

    item.set(updates);
    await item.save();
    await populateItemReferences(item);

    return res.status(200).json({
      success: true,
      message: 'Lost-and-found item updated successfully',
      item: serializeItem(item, req.user),
    });
  } catch (error) {
    return handleValidationError(error, res, next);
  }
}

async function claimItem(req, res, next) {
  try {
    if (!isValidItemId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid lost-and-found item ID',
      });
    }

    const body = req.body ?? {};

    if (typeof body !== 'object' || Array.isArray(body)) {
      return sendValidationErrors(res, ['Request body must be a JSON object']);
    }

    const errors = [];
    let claimMessage;

    if (body.message !== undefined && body.message !== null) {
      if (typeof body.message !== 'string') {
        errors.push('Claim message must be a string');
      } else {
        claimMessage = body.message.trim();

        if (claimMessage.length > MAX_CLAIM_MESSAGE_LENGTH) {
          errors.push(
            `Claim message cannot exceed ${MAX_CLAIM_MESSAGE_LENGTH} characters`,
          );
        }
      }
    }

    if (errors.length > 0) {
      return sendValidationErrors(res, errors);
    }

    const item = await LostFoundItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Lost-and-found item not found',
      });
    }

    if (item.reportedBy.toString() === req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You cannot claim your own report',
      });
    }

    if (item.status !== 'open') {
      return res.status(409).json({
        success: false,
        message: 'Claims can only be submitted for open listings',
      });
    }

    if (
      item.claim &&
      ['pending', 'approved'].includes(item.claim.status)
    ) {
      return res.status(409).json({
        success: false,
        message: 'This item already has an active claim',
      });
    }

    item.claim = {
      requestedBy: req.user.id,
      message: claimMessage || undefined,
      requestedAt: new Date(),
      status: 'pending',
    };

    await item.save();

    await createNotification(
      item.reportedBy,
      'New claim request for your listing',
      `A student has requested to claim your listing "${item.title}". The claim is pending administrator verification.`,
    );

    await populateItemReferences(item);
    const serializedItem = serializeItem(item, req.user);

    return res.status(201).json({
      success: true,
      message:
        'Claim request submitted successfully. It requires administrator verification.',
      claim: serializedItem.claim,
      item: serializedItem,
    });
  } catch (error) {
    return handleValidationError(error, res, next);
  }
}

async function updateItemStatus(req, res, next) {
  try {
    if (!isValidItemId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid lost-and-found item ID',
      });
    }

    const body = req.body ?? {};

    if (typeof body !== 'object' || Array.isArray(body)) {
      return sendValidationErrors(res, ['Request body must be a JSON object']);
    }

    const allowedFields = ['status', 'reason', 'reviewNote'];
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
    let reason;
    let reviewNote;

    if (
      typeof body.status !== 'string' ||
      !LOST_FOUND_STATUSES.includes(body.status)
    ) {
      errors.push(
        `Status must be one of: ${LOST_FOUND_STATUSES.join(', ')}`,
      );
    }

    if (body.reason !== undefined && body.reason !== null) {
      if (typeof body.reason !== 'string') {
        errors.push('Reason must be a string');
      } else {
        reason = body.reason.trim();

        if (reason.length > 1000) {
          errors.push('Reason cannot exceed 1000 characters');
        }
      }
    }

    if (body.reviewNote !== undefined && body.reviewNote !== null) {
      if (typeof body.reviewNote !== 'string') {
        errors.push('Review note must be a string');
      } else {
        reviewNote = body.reviewNote.trim();

        if (reviewNote.length > MAX_REVIEW_NOTE_LENGTH) {
          errors.push(
            `Review note cannot exceed ${MAX_REVIEW_NOTE_LENGTH} characters`,
          );
        }
      }
    }

    if (
      errors.length === 0 &&
      body.status === 'rejected' &&
      !reason
    ) {
      errors.push('A reason is required when rejecting a listing');
    }

    if (errors.length > 0) {
      return sendValidationErrors(res, errors);
    }

    const item = await LostFoundItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Lost-and-found item not found',
      });
    }

    const requestedStatus = body.status;

    if (
      item.status === 'open' &&
      requestedStatus === 'open' &&
      item.claim &&
      item.claim.status === 'pending'
    ) {
      const now = new Date();
      const claimantId = item.claim.requestedBy;

      item.claim.status = 'rejected';
      item.claim.reviewedBy = req.user.id;
      item.claim.reviewedAt = now;
      item.claim.reviewNote = reviewNote || reason || 'Claim rejected by administrator.';
      item.moderatedBy = req.user.id;
      item.moderatedAt = now;
      item.moderationReason = reason || reviewNote || undefined;

      await item.save();

      await createNotifications([
        {
          userId: claimantId,
          title: 'Item claim rejected',
          message: `Your claim for "${item.title}" was rejected by an administrator. The listing remains open for other claims.`,
        },
        {
          userId: item.reportedBy,
          title: 'Claim request rejected',
          message: `A claim for your listing "${item.title}" was rejected by an administrator. The listing remains open.`,
        },
      ]);

      await populateItemReferences(item);

      return res.status(200).json({
        success: true,
        message: 'Claim rejected and the listing remains open',
        item: serializeItem(item, req.user),
      });
    }

    if (item.status === requestedStatus) {
      return sendValidationErrors(res, [
        `Item already has status ${requestedStatus}`,
      ]);
    }

    const allowedNextStatuses = ALLOWED_STATUS_TRANSITIONS[item.status];

    if (!allowedNextStatuses.includes(requestedStatus)) {
      return sendValidationErrors(res, [
        `Cannot change status from ${item.status} to ${requestedStatus}`,
      ]);
    }

    if (
      requestedStatus === 'claimed' &&
      (!item.claim || item.claim.status !== 'pending')
    ) {
      return res.status(409).json({
        success: false,
        message: 'A pending claim is required before approving an item claim',
      });
    }

    if (
      requestedStatus === 'returned' &&
      (!item.claim || item.claim.status !== 'approved')
    ) {
      return res.status(409).json({
        success: false,
        message:
          'An approved claim is required before marking an item as returned',
      });
    }

    const previousStatus = item.status;
    const now = new Date();
    const claimantId = item.claim?.requestedBy;
    const claimWasActive =
      item.claim &&
      ['pending', 'approved'].includes(item.claim.status);
    const notifications = [];

    if (requestedStatus === 'claimed') {
      item.claim.status = 'approved';
      item.claim.reviewedBy = req.user.id;
      item.claim.reviewedAt = now;

      if (reviewNote) {
        item.claim.reviewNote = reviewNote;
      }

      notifications.push(
        {
          userId: item.claim.requestedBy,
          title: 'Item claim approved',
          message: `Your claim for "${item.title}" has been approved. The item is now marked as claimed and requires return verification.`,
        },
        {
          userId: item.reportedBy,
          title: 'Claim approved for your listing',
          message: `A claim for your listing "${item.title}" has been approved by an administrator.`,
        },
      );
    } else if (requestedStatus === 'open') {
      if (item.claim) {
        item.claim.status = 'rejected';
        item.claim.reviewedBy = req.user.id;
        item.claim.reviewedAt = now;

        if (reviewNote) {
          item.claim.reviewNote = reviewNote;
        }
      }

      notifications.push(
        {
          userId: claimantId,
          title: 'Item claim rejected',
          message: `Your claim for "${item.title}" was not approved. The listing has been reopened.`,
        },
        {
          userId: item.reportedBy,
          title: 'Your listing has been reopened',
          message: `Your listing "${item.title}" has been reopened by an administrator.`,
        },
      );
    } else if (requestedStatus === 'returned') {
      notifications.push(
        {
          userId: item.reportedBy,
          title: 'Your item has been returned',
          message: `Your listing "${item.title}" has been marked as returned.`,
        },
        {
          userId: claimantId,
          title: 'Claimed item marked as returned',
          message: `The item "${item.title}" linked to your approved claim has been marked as returned.`,
        },
      );
    } else if (requestedStatus === 'rejected') {
      if (item.claim && ['pending', 'approved'].includes(item.claim.status)) {
        item.claim.status = 'rejected';
        item.claim.reviewedBy = req.user.id;
        item.claim.reviewedAt = now;

        if (reviewNote || reason) {
          item.claim.reviewNote = reviewNote || reason;
        }
      }

      notifications.push(
        {
          userId: item.reportedBy,
          title: 'Your listing was rejected',
          message: `Your listing "${item.title}" was rejected. Reason: ${reason}`,
        },
        {
          userId: claimWasActive ? claimantId : null,
          title: 'Claim rejected because listing was rejected',
          message: `The listing "${item.title}" was rejected by an administrator, so your claim cannot proceed. Reason: ${reason}`,
        },
      );
    }

    item.status = requestedStatus;
    item.moderatedBy = req.user.id;
    item.moderatedAt = now;
    item.moderationReason = reason || reviewNote || undefined;

    await item.save();
    await createNotifications(notifications);
    await populateItemReferences(item);

    return res.status(200).json({
      success: true,
      message: `Item status changed from ${previousStatus} to ${requestedStatus}`,
      item: serializeItem(item, req.user),
    });
  } catch (error) {
    return handleValidationError(error, res, next);
  }
}

async function deleteItem(req, res, next) {
  try {
    if (!isValidItemId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid lost-and-found item ID',
      });
    }

    const item = await LostFoundItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Lost-and-found item not found',
      });
    }

    if (req.user.role !== 'admin') {
      if (item.reportedBy.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to delete this item',
        });
      }

      if (item.status !== 'open') {
        return res.status(409).json({
          success: false,
          message: 'Only open listings can be deleted',
        });
      }
    }

    await item.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Lost-and-found item deleted successfully',
      itemId: item._id,
    });
  } catch (error) {
    return next(error);
  }
}

export {
  claimItem,
  createItem,
  deleteItem,
  getItemById,
  listItems,
  updateItem,
  updateItemStatus,
};
