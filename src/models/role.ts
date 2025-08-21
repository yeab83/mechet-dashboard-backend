import mongoose, { Document, Schema, Model } from "mongoose";

export type UserStatus = "Active" | "Inactive";

export interface IRole extends Document {
  name: string;
  user_id: string;

}

const RoleSchema = new Schema<IRole>(
  {
    name: { type: String, required: true },
    user_id: { type: String, required: true },
      
  },
  { timestamps: true }
);

const RoleModel: Model<IRole> =
  (mongoose.models.role as Model<IRole>) || mongoose.model<IRole>("Role", RoleSchema);

export default RoleModel;
