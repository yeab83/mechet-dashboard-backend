import mongoose, { Schema, Document } from "mongoose";

export interface ISeat extends Document {
  voyageId: mongoose.Types.ObjectId;
  number: string;
  status: "available" | "booked";
}

const seatSchema = new Schema<ISeat>({
  voyageId: { type: Schema.Types.ObjectId, ref: "Voyage", required: true },
  number: { type: String, required: true },
  status: { type: String, enum: ["available", "booked"], default: "available" },
});

export default mongoose.model<ISeat>("Seat", seatSchema);
