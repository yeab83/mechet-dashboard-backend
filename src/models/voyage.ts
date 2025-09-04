import mongoose, { Schema, Document } from "mongoose";

export type VoyageStatus = "Active" | "Inactive" | "Completed" | "Cancelled";

export interface IVoyage extends Document {
  busPlateNo: string;
  driver: string;
  routeName: string;
  departureTime: string;
  arrivalTime: string;
  validator: string;
  status: VoyageStatus;
}

const VoyageSchema: Schema = new Schema(
  {
    busPlateNo: { type: String, required: true },
    driver: { type: String, required: true },
    routeName: { type: String, required: true },
    departureTime: { type: String, required: true },
    arrivalTime: { type: String, required: true },
    validator: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Departed", "Boarding", "Active", "Inactive", "Cancelled","Scheduled","Arrived"],
      default: "Active",
    },
  },
  { timestamps: true }
);

export default mongoose.model<IVoyage>("Voyage", VoyageSchema);
