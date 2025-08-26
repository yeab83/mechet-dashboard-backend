import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IBus extends Document {
  motorNo: string;
  chassisNo: string;
  capacity: number;
  manufacturedYear: number;
  sideNumber?: string;
  busPlateNumber: string;
  status: 'Active' | 'Inactive';
  createdAt: Date;
  updatedAt: Date;
}

const BusSchema = new Schema<IBus>(
  {
    motorNo: { type: String, required: true, unique: true },
    chassisNo: { type: String, required: true, unique: true },
    capacity: { type: Number, required: true },
    manufacturedYear: { type: Number, required: true },
    sideNumber: { type: String, default: '' },
    busPlateNumber: { type: String, required: true, unique: true },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  },
  { timestamps: true }
);

const BusModel: Model<IBus> =
  (mongoose.models.Bus as Model<IBus>) || mongoose.model<IBus>('Bus', BusSchema);

export default BusModel;