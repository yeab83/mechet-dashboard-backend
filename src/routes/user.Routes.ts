// routes/user.route.ts
import { Router } from "express";

import {  deleteUser, getUsers, getDrivers, getValidators, getUsersByRole, getAvailableRoles, login, register, updateUser, me, updateProfile, changePassword, forgotPassword, verifyResetCode, resetPassword } from "../controllers/user.Controller";
import { authenticateToken } from "../middleware/auth";

const router = Router();


router.post("/register",register );


//login 
router.post("/login", login);

// Forgot password routes
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-code", verifyResetCode);
router.post("/reset-password", resetPassword);

// GET current user profile (protected route)
router.get("/me", authenticateToken, me);

// PUT update current user profile (protected route)
router.put("/profile", authenticateToken, updateProfile);

// PUT change password for current user (protected route)
router.put("/change-password", authenticateToken, changePassword);

// GET all users
router.get("/",getUsers);

// GET all drivers
router.get("/drivers", getDrivers);

// GET all validators
router.get("/validators", getValidators);

// GET users by role
router.get("/role/:role", getUsersByRole);

// GET all available roles
router.get("/roles", getAvailableRoles);

// POST create user

// PUT update user
router.patch("/:id", updateUser);

// DELETE user
router.delete("/:id",deleteUser );

export default router;
