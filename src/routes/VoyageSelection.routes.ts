import express from "express";
import { createVoyageselection, getVoyageselection, getVoyageSelectionSeats } from "../controllers/VoyageSelection.Controller";

const VoyageselectionRoutes = express.Router();

VoyageselectionRoutes.get("/", getVoyageselection);
VoyageselectionRoutes.get("/:id/seats", getVoyageSelectionSeats);
VoyageselectionRoutes.post("/", createVoyageselection);

export default VoyageselectionRoutes;
