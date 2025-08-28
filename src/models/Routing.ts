import mongoose, { Document, Schema } from "mongoose";

export type RoutingStatus = "Active" | "Inactive";

export interface IRouting extends Document {
  routeName: string;
  from: string;
  to: string;
  distance: number;
  waypoints?: string;
  costPrice: string;
  estimatedTime: string;
  status: RoutingStatus;
}

const RoutingSchema: Schema = new Schema(
  {
    routeName: { type: String, required: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
    distance: { type: Number, required: true },
    waypoints: { type: String },
    costPrice: { type: String, required: true },
    estimatedTime: { type: String, required: true },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  },
  { timestamps: true }
);

export default mongoose.model<IRouting>("Routing", RoutingSchema);
