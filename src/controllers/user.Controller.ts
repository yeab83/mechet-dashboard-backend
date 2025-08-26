import { Request, Response } from "express";
import bcrypt from "bcrypt";
import User from "../models/User";
import UserModel from "../models/User";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../middleware/auth";


export const register = async (req: Request, res: Response) => {
  try {
    const { fname, email, phone, password , role } = req.body;
// console.log(req.body);

    // check if user exists
    const existingUser = await UserModel.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) return res.status(400).json({ msg: "User already exists" });

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create user
    const newUser = new UserModel({role, fname, email, phone, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ msg: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ msg: "Server error" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { phone, password } = req.body;

    const user = await UserModel.findOne({ phone });
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    // create token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET as string, { expiresIn: "1d" });

    res.json({ token, user: { id: user._id, name: user.fname, email: user.email, phone: user.phone, role: user.role } });
  } catch (error) {
    res.status(500).json({ msg: "Server error" });
  }
};

export const me = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ msg: "Unauthorized" });
    const user = await UserModel.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ msg: "Server error" });
  }
};





// Get all users
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Error fetching users" });
  }
};



// Update user
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body } as any;
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }
    const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    res.json(updatedUser);
  } catch (err) {
    console.error("Error updating user", err);
    res.status(500).json({ message: "Error updating user" });
  }
};

// Delete user
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) return res.status(404).json({ message: "User not found" });

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting user" });
  }
};
