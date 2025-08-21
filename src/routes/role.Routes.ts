// src/routes/roleRoutes.ts
import { Router } from "express";
import { createRole, getRoles, getRoleByUser, roleLogin } from "../controllers/role.Controller";

const Rolerouter = Router();

Rolerouter.post("/", createRole);
Rolerouter.get("/", getRoles);
Rolerouter.get("/:user_id", getRoleByUser);
Rolerouter.post("/login", roleLogin);

export default Rolerouter;
