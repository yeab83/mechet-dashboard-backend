import { Router } from "express";
import { getVoyages, getVoyageById, createVoyage, updateVoyage, deleteVoyage } from "../controllers/voyage.controller";

const Voyagerouter = Router();

Voyagerouter.get("/", getVoyages);
Voyagerouter.get("/:id", getVoyageById);
Voyagerouter.post("/", createVoyage);
Voyagerouter.patch("/:id", updateVoyage);
Voyagerouter.delete("/:id", deleteVoyage);

export default Voyagerouter;
