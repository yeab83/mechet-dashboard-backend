// src/routes/roleRoutes.ts
import { Router } from "express";
import { createRole, getRoles, getRoleByUser, roleLogin, updateRole, deleteRole } from "../controllers/role.Controller";

const Rolerouter = Router();

Rolerouter.post("/", createRole);
Rolerouter.get("/", getRoles);
Rolerouter.get("/:user_id", getRoleByUser);
Rolerouter.post("/login", roleLogin);
Rolerouter.put("/:id", updateRole);
Rolerouter.delete("/:id", deleteRole);

export default Rolerouter;
