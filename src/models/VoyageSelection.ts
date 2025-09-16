import mongoose, { Schema, Document } from "mongoose";

export interface IVoyageSelection extends Document {
  voyage: mongoose.Types.ObjectId;
  busPlateNo: string;
  driver: string;
  departureTime: Date;
  arrivalTime: Date;
  validator: string;
  status: "Active" | "Inactive" | "Completed" | "Cancelled" | "Boarding";
  totalSeats: number;
  availableSeats: number;
}

const voyageSelectionSchema = new Schema<IVoyageSelection>({
  voyage: { type: Schema.Types.ObjectId, ref: 'Voyage', required: true },
  busPlateNo: { type: String, required: true },
  driver: { type: String, required: true },
  departureTime: { type: Date, required: true },
  arrivalTime: { type: Date, required: true },
  validator: { type: String },
  status: { type: String, enum: ["Active", "Inactive", "Completed", "Cancelled", "Boarding"], default: "Active" },
  totalSeats: { type: Number, default: 40 },
  availableSeats: { type: Number, default: 40 },
});

export default mongoose.model<IVoyageSelection>("VoyageSelection", voyageSelectionSchema);
