import { Request, Response } from "express";
import bcrypt from "bcrypt";
import UserModel from "../models/user";
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

// Update current user profile
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ msg: "Unauthorized" });
    
    const { fname, email, phone } = req.body;
    
    // Validation
    if (!fname || !email || !phone) {
      return res.status(400).json({ 
        success: false,
        msg: "Name, email, and phone are required" 
      });
    }

    // Check if email is already taken by another user
    const existingUser = await UserModel.findOne({ 
      email: email.toLowerCase(),
      _id: { $ne: req.userId }
    });
    
    if (existingUser) {
      return res.status(409).json({ 
        success: false,
        msg: "Email is already taken by another user" 
      });
    }

    // Check if phone is already taken by another user
    const existingPhone = await UserModel.findOne({ 
      phone: phone,
      _id: { $ne: req.userId }
    });
    
    if (existingPhone) {
      return res.status(409).json({ 
        success: false,
        msg: "Phone number is already taken by another user" 
      });
    }

    // Update user profile
    const updatedUser = await UserModel.findByIdAndUpdate(
      req.userId,
      {
        fname: fname.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim()
      },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ 
        success: false,
        msg: "User not found" 
      });
    }

    res.json({
      success: true,
      msg: "Profile updated successfully",
      user: updatedUser
    });

  } catch (error: any) {
    console.error('Error updating profile:', error);
    
    let errorMessage = 'Failed to update profile';
    let statusCode = 500;
    
    if (error.name === 'ValidationError') {
      statusCode = 400;
      errorMessage = `Validation Error: ${error.message}`;
    } else if (error.name === 'CastError') {
      statusCode = 400;
      errorMessage = `Invalid data format: ${error.message}`;
    }
    
    res.status(statusCode).json({
      success: false,
      msg: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Change password for current user
export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ msg: "Unauthorized" });
    
    const { oldPassword, newPassword, confirmPassword } = req.body;
    
    // Validation
    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ 
        success: false,
        msg: "All password fields are required" 
      });
    }

    // Check if new password and confirm password match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ 
        success: false,
        msg: "New password and confirm password do not match" 
      });
    }

    // Check password strength
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false,
        msg: "New password must be at least 6 characters long" 
      });
    }

    // Get user from database
    const user = await UserModel.findById(req.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        msg: "User not found" 
      });
    }

    // Verify old password
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      return res.status(400).json({ 
        success: false,
        msg: "Current password is incorrect" 
      });
    }

    // Check if new password is different from old password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ 
        success: false,
        msg: "New password must be different from current password" 
      });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await UserModel.findByIdAndUpdate(
      req.userId,
      { password: hashedNewPassword },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      msg: "Password changed successfully"
    });

  } catch (error: any) {
    console.error('Error changing password:', error);
    
    let errorMessage = 'Failed to change password';
    let statusCode = 500;
    
    if (error.name === 'ValidationError') {
      statusCode = 400;
      errorMessage = `Validation Error: ${error.message}`;
    } else if (error.name === 'CastError') {
      statusCode = 400;
      errorMessage = `Invalid data format: ${error.message}`;
    }
    
    res.status(statusCode).json({
      success: false,
      msg: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};





// Get all users
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await UserModel.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Error fetching users" });
  }
};

// GET all drivers
export const getDrivers = async (req: Request, res: Response) => {
  try {
    const drivers = await UserModel.find({ role: "Driver" }).select('_id fname email phone role status');
    res.json(drivers);
  } catch (err) {
    console.error('Error fetching drivers:', err);
    res.status(500).json({ message: "Error fetching drivers" });
  }
};

// GET all validators
export const getValidators = async (req: Request, res: Response) => {
  try {
    const validators = await UserModel.find({ role: "Ticketer and Validator" }).select('_id fname email phone role status');
    res.json(validators);
  } catch (err) {
    console.error('Error fetching validators:', err);
    res.status(500).json({ message: "Error fetching validators" });
  }
};

// GET users by role
export const getUsersByRole = async (req: Request, res: Response) => {
  try {
    const { role } = req.params;
    const users = await UserModel.find({ role: role }).select('_id fname email phone role status');
    res.json(users);
  } catch (err) {
    console.error('Error fetching users by role:', err);
    res.status(500).json({ message: "Error fetching users by role" });
  }
};

// GET all available roles
export const getAvailableRoles = async (_req: Request, res: Response) => {
  try {
    const roles = await UserModel.distinct('role');
    res.json(roles);
  } catch (err) {
    console.error('Error fetching roles:', err);
    res.status(500).json({ message: "Error fetching roles" });
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
    const updatedUser = await UserModel.findByIdAndUpdate(id, updateData, { new: true });

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
    const deletedUser = await UserModel.findByIdAndDelete(id);

    if (!deletedUser) return res.status(404).json({ message: "User not found" });

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting user" });
  }
};

// Forgot password - send verification code
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    
    // Validation
    if (!phone) {
      return res.status(400).json({ 
        success: false,
        msg: "Phone number is required" 
      });
    }

    // Find user by phone number
    const user = await UserModel.findOne({ phone: phone.trim() });
    if (!user) {
      return res.status(404).json({ 
        success: false,
        msg: "No account found with this phone number" 
      });
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiration time (10 minutes from now)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Store verification code in user document
    await UserModel.findByIdAndUpdate(user._id, {
      resetPasswordCode: verificationCode,
      resetPasswordExpires: expiresAt
    });

    // In a real application, you would send SMS here
    // For now, we'll just log it and return it in development
    console.log(`Verification code for ${phone}: ${verificationCode}`);
    
    // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
    // await sendSMS(phone, `Your verification code is: ${verificationCode}`);

    res.json({
      success: true,
      msg: "Verification code sent to your phone number",
      // Only return code in development
      ...(process.env.NODE_ENV === 'development' && { verificationCode })
    });

  } catch (error: any) {
    console.error('Error in forgot password:', error);
    res.status(500).json({
      success: false,
      msg: 'Failed to process forgot password request'
    });
  }
};

// Verify reset code
export const verifyResetCode = async (req: Request, res: Response) => {
  try {
    const { phone, code } = req.body;
    
    // Validation
    if (!phone || !code) {
      return res.status(400).json({ 
        success: false,
        msg: "Phone number and verification code are required" 
      });
    }

    // Find user by phone number
    const user = await UserModel.findOne({ phone: phone.trim() });
    if (!user) {
      return res.status(404).json({ 
        success: false,
        msg: "No account found with this phone number" 
      });
    }

    // Check if reset code exists and is not expired
    if (!user.resetPasswordCode || !user.resetPasswordExpires) {
      return res.status(400).json({ 
        success: false,
        msg: "No reset code found. Please request a new one." 
      });
    }

    if (new Date() > user.resetPasswordExpires) {
      return res.status(400).json({ 
        success: false,
        msg: "Verification code has expired. Please request a new one." 
      });
    }

    // Verify the code
    if (user.resetPasswordCode !== code) {
      return res.status(400).json({ 
        success: false,
        msg: "Invalid verification code" 
      });
    }

    // Code is valid, generate a temporary token for password reset
    const resetToken = jwt.sign(
      { userId: user._id, type: 'password_reset' }, 
      process.env.JWT_SECRET as string, 
      { expiresIn: '15m' }
    );

    res.json({
      success: true,
      msg: "Verification code is valid",
      resetToken
    });

  } catch (error: any) {
    console.error('Error verifying reset code:', error);
    res.status(500).json({
      success: false,
      msg: 'Failed to verify reset code'
    });
  }
};

// Reset password with token
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body;
    
    // Validation
    if (!resetToken || !newPassword || !confirmPassword) {
      return res.status(400).json({ 
        success: false,
        msg: "Reset token, new password, and confirm password are required" 
      });
    }

    // Verify reset token
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET as string) as { userId: string; type: string };
    } catch (error) {
      return res.status(400).json({ 
        success: false,
        msg: "Invalid or expired reset token" 
      });
    }

    if (decoded.type !== 'password_reset') {
      return res.status(400).json({ 
        success: false,
        msg: "Invalid reset token" 
      });
    }

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ 
        success: false,
        msg: "New password and confirm password do not match" 
      });
    }

    // Check password strength
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false,
        msg: "New password must be at least 6 characters long" 
      });
    }

    // Find user
    const user = await UserModel.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        msg: "User not found" 
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset code
    await UserModel.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      resetPasswordCode: undefined,
      resetPasswordExpires: undefined
    });

    res.json({
      success: true,
      msg: "Password reset successfully"
    });

  } catch (error: any) {
    console.error('Error resetting password:', error);
    res.status(500).json({
      success: false,
      msg: 'Failed to reset password'
    });
  }
};
