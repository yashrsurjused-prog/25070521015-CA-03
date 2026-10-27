import mongoose from 'mongoose';

export const LOST_FOUND_TYPES = ['lost', 'found'];
export const LOST_FOUND_STATUSES = [
  'open',
  'claimed',
  'returned',
  'rejected',
];

const claimSchema = new mongoose.Schema(
  {
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Claimant is required'],
    },
    message: {
      type: String,
      trim: true,
      maxlength: [500, 'Claim message cannot exceed 500 characters'],
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'approved', 'rejected'],
        message: '{VALUE} is not a valid claim status',
      },
      default: 'pending',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    reviewNote: {
      type: String,
      trim: true,
      maxlength: [1000, 'Claim review note cannot exceed 1000 characters'],
    },
  },
  { _id: false },
);

const lostFoundItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    type: {
      type: String,
      required: [true, 'Item type is required'],
      enum: {
        values: ['lost', 'found'],
        message: '{VALUE} is not a valid item type',
      },
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      maxlength: [100, 'Category cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
      maxlength: [200, 'Location cannot exceed 200 characters'],
    },
    eventDate: {
      type: Date,
    },
    imageUrl: {
      type: String,
      trim: true,
      maxlength: [2048, 'Image URL cannot exceed 2048 characters'],
      match: [
        /^https?:\/\/.+/i,
        'Image URL must start with http:// or https://',
      ],
    },
    status: {
      type: String,
      enum: {
        values: LOST_FOUND_STATUSES,
        message: '{VALUE} is not a valid item status',
      },
      default: 'open',
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter is required'],
    },
    claim: {
      type: claimSchema,
    },
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    moderatedAt: {
      type: Date,
    },
    moderationReason: {
      type: String,
      trim: true,
      maxlength: [1000, 'Moderation reason cannot exceed 1000 characters'],
    },
  },
  { timestamps: true },
);

lostFoundItemSchema.index({ type: 1, status: 1, createdAt: -1 });
lostFoundItemSchema.index({ reportedBy: 1, status: 1, createdAt: -1 });
lostFoundItemSchema.index({ category: 1, status: 1, createdAt: -1 });
lostFoundItemSchema.index({ 'claim.requestedBy': 1 });

const LostFoundItem = mongoose.model('LostFoundItem', lostFoundItemSchema);

export default LostFoundItem;
