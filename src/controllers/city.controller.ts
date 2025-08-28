import { Request, Response } from "express";
import City from "../models/city";

// Create city
export const createCity = async (req: Request, res: Response) => {
  try {
    const city = await City.create(req.body);
    res.status(201).json(city);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

// Get all cities
export const getCities = async (req: Request, res: Response) => {
  try {
    const cities = await City.find();
    res.status(200).json(cities);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// Update city
export const updateCity = async (req: Request, res: Response) => {
  try {
    const city = await City.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!city) return res.status(404).json({ message: "City not found" });
    res.status(200).json(city);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

// Delete city
export const deleteCity = async (req: Request, res: Response) => {
  try {
    const city = await City.findByIdAndDelete(req.params.id);
    if (!city) return res.status(404).json({ message: "City not found" });
    res.status(200).json({ message: "City deleted" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
