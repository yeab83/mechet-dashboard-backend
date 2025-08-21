import mongoose, { Document, Schema, Model } from "mongoose";

export type UserStatus = "Active" | "Inactive";

export interface IUser extends Document {
  fname: string;
  email: string;
  phone: string;
    password: string;
  role: string;
  status: UserStatus;
  avatarUrl?: string;
}

const UserSchema = new Schema<IUser>(
  {
    fname: { type: String, required: true },
    email: { type: String, unique: true },
    password: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    role: { type: String, required: true },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    avatarUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

const UserModel: Model<IUser> =
  (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>("User", UserSchema);

export default UserModel;
