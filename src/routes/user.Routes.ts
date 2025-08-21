// routes/user.route.ts
import { Router } from "express";
import User from "../models/User";
import bcrypt from "bcrypt";

import {  deleteUser, getUsers, login, register, updateUser } from "../controllers/user.Controller";

const router = Router();


router.post("/register",register );


//login 
router.post("/login", login);

// GET all users
router.get("/",getUsers);

// POST create user

// PUT update user
router.patch("/:id", updateUser);

// DELETE user
router.delete("/:id",deleteUser );

export default router;
