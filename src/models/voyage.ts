import mongoose, { Schema, Document } from "mongoose";

export type VoyageStatus = "Active" | "Inactive" | "Completed" | "Cancelled";

export interface IVoyage extends Document {
  bus: mongoose.Types.ObjectId;
  route: mongoose.Types.ObjectId;
  validator: mongoose.Types.ObjectId;
  driver: mongoose.Types.ObjectId; // Driver user reference
  departureTime: Date;
  arrivalTime: Date;
  status: VoyageStatus;
}

const VoyageSchema: Schema = new Schema(
  {
    bus: { type: Schema.Types.ObjectId, ref: "Bus", required: true },
    route: { type: Schema.Types.ObjectId, ref: "Routing", required: true },
    validator: { type: Schema.Types.ObjectId, ref: "User", required: true },
    driver: { type: Schema.Types.ObjectId, ref: "User", required: true }, // Driver user reference
    departureTime: { type: Date, required: true },
    arrivalTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ["Departed", "Boarding", "Active", "Inactive", "Cancelled","Scheduled","Arrived"],
      default: "Active",
    },
  },
  { timestamps: true }
);

export default mongoose.model<IVoyage>("Voyage", VoyageSchema);