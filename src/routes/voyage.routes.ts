import { Router } from "express";
import { getVoyages, createVoyage, updateVoyage, deleteVoyage } from "../controllers/voyage.controller";

const Voyagerouter = Router();

Voyagerouter.get("/", getVoyages);
Voyagerouter.post("/", createVoyage);
Voyagerouter.patch("/:id", updateVoyage);
Voyagerouter.delete("/:id", deleteVoyage);

export default Voyagerouter;
