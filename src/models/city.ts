import mongoose, { Schema, Document } from "mongoose";

export interface ICity extends Document {
  name: string;

  status: "Active" | "Inactive";
}

const CitySchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true },
   
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  },
  { timestamps: true }
);

export default mongoose.model<ICity>("City", CitySchema);
