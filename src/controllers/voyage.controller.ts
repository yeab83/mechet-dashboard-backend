import { Request, Response } from "express";
import Voyage from "../models/voyage";
import Bus from "../models/bus";
import Routing from "../models/Routing";
import User from "../models/user";

// GET all voyages
export const getVoyages = async (req: Request, res: Response) => {
  try {
    const voyages = await Voyage.find()
      .populate('bus', 'busPlateNumber driver motorNo chassisNo capacity manufacturedYear sideNumber status')
      .populate('route', 'routeName from to distance waypoints costPrice estimatedTime status')
      .populate('validator', 'fname email phone role status')
      .populate('driver', 'fname email phone role status')
      .sort({ createdAt: -1 });
    
    res.json(voyages);
  } catch (err) {
    console.error('Error fetching voyages:', err);
    res.status(500).json({ error: "Failed to fetch voyages" });
  }
};

// GET single voyage by ID
export const getVoyageById = async (req: Request, res: Response) => {
  try {
    const voyage = await Voyage.findById(req.params.id)
      .populate('bus', 'busPlateNumber driver motorNo chassisNo capacity manufacturedYear sideNumber status')
      .populate('route', 'routeName from to distance waypoints costPrice estimatedTime status')
      .populate('validator', 'fname email phone role status')
      .populate('driver', 'fname email phone role status');
    
    if (!voyage) {
      return res.status(404).json({ error: "Voyage not found" });
    }
    
    res.json(voyage);
  } catch (err) {
    console.error('Error fetching voyage:', err);
    res.status(500).json({ error: "Failed to fetch voyage" });
  }
};

// CREATE new voyage
export const createVoyage = async (req: Request, res: Response) => {
  try {
    const { bus, route, validator, driver, departureTime, arrivalTime, status } = req.body;

    // Validate required fields
    if (!bus || !route || !validator || !driver || !departureTime || !arrivalTime) {
      return res.status(400).json({ 
        error: "bus, route, validator, driver, departureTime, and arrivalTime are required" 
      });
    }

    // Verify that bus, route, and validator exist
    const busExists = await Bus.findById(bus);
    if (!busExists) {
      return res.status(400).json({ error: "Bus not found" });
    }

    const routeExists = await Routing.findById(route);
    if (!routeExists) {
      return res.status(400).json({ error: "Route not found" });
    }

    const validatorExists = await User.findById(validator);
    if (!validatorExists) {
      return res.status(400).json({ error: "Validator user not found" });
    }
    if (validatorExists.role !== 'Ticketer and Validator') {
      return res.status(400).json({ error: "Selected user is not a Ticketer and Validator" });
    }

    // Verify driver exists and has role Driver
    const driverExists = await User.findById(driver);
    if (!driverExists) {
      return res.status(400).json({ error: "Driver user not found" });
    }
    if (driverExists.role !== 'Driver') {
      return res.status(400).json({ error: "Selected user is not a Driver" });
    }

    // Convert time strings like "08:00pm " to Date
    const parseTimeToDate = (input: string): Date => {
      const trimmed = (input || '').trim().toLowerCase();
      if (!trimmed) throw new Error('Empty time');
      if (/\d{4}-\d{2}-\d{2}t\d{2}:\d{2}/.test(trimmed)) {
        return new Date(input);
      }
      const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/);
      if (!match) throw new Error('Invalid time format');
      let hour = parseInt(match[1], 10);
      const minute = parseInt(match[2], 10);
      const period = match[3];
      if (period === 'pm' && hour !== 12) hour += 12;
      if (period === 'am' && hour === 12) hour = 0;
      const d = new Date();
      d.setSeconds(0, 0);
      d.setHours(hour, minute, 0, 0);
      return d;
    };

    let departureDate: Date;
    let arrivalDate: Date;
    try {
      departureDate = parseTimeToDate(departureTime);
      arrivalDate = parseTimeToDate(arrivalTime);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid date format. Use datetime-local or HH:MMam/pm' });
    }

    const voyage = new Voyage({
      bus,
      route,
      validator,
      driver,
      departureTime: departureDate,
      arrivalTime: arrivalDate,
      status: status || "Active"
    });

    const saved = await voyage.save();
    
    // Populate the saved voyage with related data
    const populatedVoyage = await Voyage.findById(saved._id)
      .populate('bus', 'busPlateNumber driver motorNo chassisNo capacity manufacturedYear sideNumber status')
      .populate('route', 'routeName from to distance waypoints costPrice estimatedTime status')
      .populate('validator', 'fname email phone role status')
      .populate('driver', 'fname email phone role status');

    res.status(201).json(populatedVoyage);
  } catch (err: any) {
    console.error('Error creating voyage:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    res.status(400).json({ error: "Failed to create voyage" });
  }
};

// UPDATE voyage
export const updateVoyage = async (req: Request, res: Response) => {
  try {
    const { bus, route, validator, driver, departureTime, arrivalTime, status } = req.body;

    // If updating references, validate they exist
    if (bus) {
      const busExists = await Bus.findById(bus);
      if (!busExists) {
        return res.status(400).json({ error: "Bus not found" });
      }
    }

    if (route) {
      const routeExists = await Routing.findById(route);
      if (!routeExists) {
        return res.status(400).json({ error: "Route not found" });
      }
    }

    if (validator) {
      const validatorExists = await User.findById(validator);
      if (!validatorExists) {
        return res.status(400).json({ error: "Validator user not found" });
      }
      if (validatorExists.role !== 'Ticketer and Validator') {
        return res.status(400).json({ error: "Selected user is not a Ticketer and Validator" });
      }
    }

    if (driver) {
      const driverExists = await User.findById(driver);
      if (!driverExists) {
        return res.status(400).json({ error: "Driver user not found" });
      }
      if (driverExists.role !== 'Driver') {
        return res.status(400).json({ error: "Selected user is not a Driver" });
      }
    }

    // Build update data with parsed dates
    const updateData: any = { ...req.body };
    const tryParse = (val: string | undefined): Date | undefined => {
      if (!val) return undefined;
      const trimmed = val.trim().toLowerCase();
      const isoLike = /\d{4}-\d{2}-\d{2}t\d{2}:\d{2}/.test(trimmed);
      if (isoLike) return new Date(val);
      const m = trimmed.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/);
      if (!m) return new Date(val);
      let hour = parseInt(m[1], 10);
      const minute = parseInt(m[2], 10);
      const period = m[3];
      if (period === 'pm' && hour !== 12) hour += 12;
      if (period === 'am' && hour === 12) hour = 0;
      const d = new Date();
      d.setSeconds(0, 0);
      d.setHours(hour, minute, 0, 0);
      return d;
    };

    if (typeof departureTime === 'string') {
      updateData.departureTime = tryParse(departureTime);
    }
    if (typeof arrivalTime === 'string') {
      updateData.arrivalTime = tryParse(arrivalTime);
    }

    const updated = await Voyage.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true }
    )
      .populate('bus', 'busPlateNumber driver motorNo chassisNo capacity manufacturedYear sideNumber status')
      .populate('route', 'routeName from to distance waypoints costPrice estimatedTime status')
      .populate('validator', 'fname email phone role status')
      .populate('driver', 'fname email phone role status');

    if (!updated) return res.status(404).json({ error: "Voyage not found" });
    res.json(updated);
  } catch (err: any) {
    console.error('Error updating voyage:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
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
