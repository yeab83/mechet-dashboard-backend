import express from "express";
import { createVoyageselection, getVoyageselection } from "../controllers/VoyageSelection.Controller";

const VoyageselectionRoutes = express.Router();

VoyageselectionRoutes.get("/", getVoyageselection);
VoyageselectionRoutes.post("/", createVoyageselection);

export default VoyageselectionRoutes;
