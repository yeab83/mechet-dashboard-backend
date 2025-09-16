// models/Ticket.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface ITicket extends Document {
  name: string;
  voyage: string;
  seatNo: string;
  farePrice: number;
  issuedBy: string;
  paymentStatus: 'Paid' | 'Unpaid' | 'Pending' | 'Refunded';
  passengerId: mongoose.Types.ObjectId;
  voyageId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ticketSchema = new Schema<ITicket>({
  name: {
    type: String,
    required: [true, 'Passenger name is required'],
    trim: true,
    maxlength: [100, 'Passenger name cannot exceed 100 characters']
  },
  voyage: {
    type: String,
    required: [true, 'Voyage is required'],
    trim: true
  },
  seatNo: {
    type: String,
    required: [true, 'Seat number is required'],
    trim: true
  },
  farePrice: {
    type: Number,
    required: [true, 'Fare price is required'],
    min: [0, 'Fare price cannot be negative']
  },
  issuedBy: {
    type: String,
    required: [true, 'Issued by is required'],
    trim: true
  },
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Unpaid', 'Pending', 'Refunded'],
    default: 'Pending'
  },
  passengerId: {
    type: Schema.Types.ObjectId,
    ref: 'Passenger',
    required: true
  },
  voyageId: {
    type: Schema.Types.ObjectId,
    ref: 'VoyageSelection',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
ticketSchema.index({ name: 1 });
ticketSchema.index({ voyage: 1 });
ticketSchema.index({ paymentStatus: 1 });
ticketSchema.index({ createdAt: -1 });

export default mongoose.model<ITicket>('Ticket', ticketSchema);