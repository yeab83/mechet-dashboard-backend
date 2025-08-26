// src/controllers/roleController.ts
import { Request, Response } from "express";
import RoleModel from "../models/role"; // adjust path if needed

/**
 * Create a new role
 */
export const createRole = async (req: Request, res: Response) => {
  try {
    const { name, user_id, permissions } = req.body;

    if (!name) return res.status(400).json({ message: "Name is required" });

    const role = new RoleModel({ name, user_id, permissions: Array.isArray(permissions) ? permissions : [] });
    await role.save();

    res.status(201).json({ message: "Role created successfully", role });
  } catch (error) {
    res.status(500).json({ message: "Error creating role", error });
  }
};

/**
 * Get all roles
 */
export const getRoles = async (_req: Request, res: Response) => {
  try {
    const roles = await RoleModel.find();
    res.status(200).json(roles);
  } catch (error) {
    res.status(500).json({ message: "Error fetching roles", error });
  }
};

/**
 * Update a role by id
 */
export const updateRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, permissions } = req.body;
    const update: any = {};
    if (typeof name === "string") update.name = name;
    if (Array.isArray(permissions)) update.permissions = permissions;

    const role = await RoleModel.findByIdAndUpdate(id, update, { new: true });
    if (!role) return res.status(404).json({ message: "Role not found" });
    res.status(200).json(role);
  } catch (error) {
    res.status(500).json({ message: "Error updating role", error });
  }
};

/**
 * Delete a role by id
 */
export const deleteRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const role = await RoleModel.findByIdAndDelete(id);
    if (!role) return res.status(404).json({ message: "Role not found" });
    res.status(200).json({ message: "Role deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting role", error });
  }
};

/**
 * Get a role by user_id
 */
export const getRoleByUser = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;
    const role = await RoleModel.findOne({ user_id });

    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    res.status(200).json(role);
  } catch (error) {
    res.status(500).json({ message: "Error fetching role", error });
  }
};

/**
 * Role-based login (redirect based on role name)
 */
export const roleLogin = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ message: "user_id is required" });
    }

    const role = await RoleModel.findOne({ user_id });

    if (!role) {
      return res.status(404).json({ message: "Role not found for this user" });
    }

    // Role-based redirection logic
    switch (role.name) {
      case "Admin":
        return res.status(200).json({ message: "Login successful", redirectTo: "/admin-dashboard" });

      case "Driver":
        return res.status(200).json({ message: "Login successful", redirectTo: "/driver-dashboard" });

      case "Ticketer and Validator":
        return res.status(200).json({ message: "Login successful", redirectTo: "/ticket-validator-dashboard" });

      case "Supervisor":
        return res.status(200).json({ message: "Login successful", redirectTo: "/supervisor-dashboard" });

      default:
        return res.status(403).json({ message: "Role not recognized" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error during role login", error });
  }
};
