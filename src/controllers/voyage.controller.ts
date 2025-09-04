import { Request, Response } from "express";
import Voyage from "../models/voyage";

// GET all voyages
export const getVoyages = async (req: Request, res: Response) => {
  try {
    const voyages = await Voyage.find();
    res.json(voyages);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch voyages" });
  }
};

// CREATE new voyage
export const createVoyage = async (req: Request, res: Response) => {
  try {
    const voyage = new Voyage(req.body);
    const saved = await voyage.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: "Failed to create voyage" });
  }
};

// UPDATE voyage
export const updateVoyage = async (req: Request, res: Response) => {
  try {
    const updated = await Voyage.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: "Voyage not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: "Failed to update voyage" });
  }
};

// DELETE voyage
export const deleteVoyage = async (req: Request, res: Response) => {
  try {
    const deleted = await Voyage.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Voyage not found" });
    res.json({ message: "Voyage deleted" });
  } catch (err) {
    res.status(400).json({ error: "Failed to delete voyage" });
  }
};
