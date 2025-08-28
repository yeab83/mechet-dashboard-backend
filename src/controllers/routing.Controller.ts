import { Request, Response } from "express";
import Routing, { IRouting } from "../models/Routing";

// GET all routings
export const getRoutings = async (_req: Request, res: Response): Promise<void> => {
  try {
    const routings: IRouting[] = await Routing.find();
    res.json(routings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// GET single routing
export const getRoutingById = async (req: Request, res: Response): Promise<void> => {
  try {
    const routing = await Routing.findById(req.params.id);
    if (!routing) {
      res.status(404).json({ message: "Routing not found" });
      return;
    }
    res.json(routing);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// CREATE new routing
export const createRouting = async (req: Request, res: Response): Promise<void> => {
  try {
    const routing = new Routing(req.body as IRouting);
    await routing.save();
    res.status(201).json(routing);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

// UPDATE routing
export const updateRouting = async (req: Request, res: Response): Promise<void> => {
  try {
    const routing = await Routing.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!routing) {
      res.status(404).json({ message: "Routing not found" });
      return;
    }
    res.json(routing);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

// DELETE routing
export const deleteRouting = async (req: Request, res: Response): Promise<void> => {
  try {
    const routing = await Routing.findByIdAndDelete(req.params.id);
    if (!routing) {
      res.status(404).json({ message: "Routing not found" });
      return;
    }
    res.json({ message: "Routing deleted" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
