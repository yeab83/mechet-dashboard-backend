// models/Passenger.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IPassenger extends Document {
  name: string;
  phone: string;
  email?: string;
  voyageId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const passengerSchema = new Schema<IPassenger>({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  phone: {
    type: String,
    required: [true, 'Phone is required'],
    trim: true,
    match: [/^[0-9+\-\s()]+$/, 'Please enter a valid phone number']
  },
  email: {
    type: String,
    required: false,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  voyageId: {
    type: Schema.Types.ObjectId,
    ref: 'Voyage',
    required: [true, 'Voyage ID is required']
  }
}, {
  timestamps: true
});

// Indexes for better performance
passengerSchema.index({ voyageId: 1 });
passengerSchema.index({ phone: 1 });

export default mongoose.model<IPassenger>('Passenger', passengerSchema);