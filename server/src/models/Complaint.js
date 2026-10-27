import mongoose from 'mongoose';

export const COMPLAINT_STATUSES = [
  'pending',
  'under_review',
  'in_progress',
  'resolved',
  'rejected',
];

const historyEntrySchema = new mongoose.Schema(
  {
    previousStatus: {
      type: String,
      enum: {
        values: COMPLAINT_STATUSES,
        message: '{VALUE} is not a valid previous complaint status',
      },
    },
    status: {
      type: String,
      enum: {
        values: COMPLAINT_STATUSES,
        message: '{VALUE} is not a valid complaint status',
      },
      required: [true, 'History status is required'],
    },
    remark: {
      type: String,
      trim: true,
      maxlength: [1000, 'Remark cannot exceed 1000 characters'],
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const complaintSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      required: [true, 'Ticket ID is required'],
      unique: true,
      trim: true,
      maxlength: [50, 'Ticket ID cannot exceed 50 characters'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      maxlength: [100, 'Category cannot exceed 100 characters'],
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
      maxlength: [200, 'Location cannot exceed 200 characters'],
    },
    priority: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high'],
        message: '{VALUE} is not a valid priority',
      },
      default: 'medium',
    },
    status: {
      type: String,
      enum: {
        values: COMPLAINT_STATUSES,
        message: '{VALUE} is not a valid complaint status',
      },
      default: 'pending',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Complaint creator is required'],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    history: {
      type: [historyEntrySchema],
      default: [],
    },
  },
  { timestamps: true },
);

complaintSchema.index({ createdBy: 1, createdAt: -1 });
complaintSchema.index({ status: 1, createdAt: -1 });
complaintSchema.index({ assignedTo: 1 });

const Complaint = mongoose.model('Complaint', complaintSchema);

export default Complaint;
