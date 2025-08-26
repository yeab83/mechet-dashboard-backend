import { Request, Response } from 'express';
import Bus from '../models/bus';

export const getBuses = async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string) || '';
    const query: any = {};
    if (q) {
      const regex = new RegExp(q, 'i');
      const numeric = Number(q);
      const or: any[] = [
        { motorNo: regex },
        { chassisNo: regex },
        { sideNumber: regex },
        { busPlateNumber: regex },
        { status: regex },
      ];
      if (!Number.isNaN(numeric)) {
        or.push({ capacity: numeric }, { manufacturedYear: numeric });
      }
      query.$or = or;
    }

    const buses = await Bus.find(query).sort({ createdAt: -1 });
    res.json(buses);
  } catch (err: any) {
    console.error('Error fetching buses:', err);
    res.status(500).json({ message: 'Error fetching buses' });
  }
};

export const getBusById = async (req: Request, res: Response) => {
  try {
    const bus = await Bus.findById(req.params.id);
    if (!bus) return res.status(404).json({ message: 'Bus not found' });
    res.json(bus);
  } catch (err: any) {
    console.error('Error fetching bus:', err);
    res.status(500).json({ message: 'Error fetching bus' });
  }
};

export const createBus = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    
    // Validate required fields
    const { motorNo, chassisNo, capacity, manufacturedYear, busPlateNumber } = payload;
    if (!motorNo || !chassisNo || !capacity || !manufacturedYear || !busPlateNumber) {
      return res.status(400).json({ 
        message: 'motorNo, chassisNo, capacity, manufacturedYear, and busPlateNumber are required' 
      });
    }

    const created = await Bus.create(payload);
    res.status(201).json(created);
  } catch (err: any) {
    if (err && err.code === 11000) {
      return res.status(409).json({ 
        message: 'Bus with this motor number, chassis number, or plate number already exists' 
      });
    }
    console.error('Error creating bus:', err);
    res.status(500).json({ message: 'Error creating bus' });
  }
};

export const updateBus = async (req: Request, res: Response) => {
  try {
    const updated = await Bus.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Bus not found' });
    res.json(updated);
  } catch (err: any) {
    if (err && err.code === 11000) {
      return res.status(409).json({ 
        message: 'Bus with this motor number, chassis number, or plate number already exists' 
      });
    }
    console.error('Error updating bus:', err);
    res.status(500).json({ message: 'Error updating bus' });
  }
};

export const deleteBus = async (req: Request, res: Response) => {
  try {
    const deleted = await Bus.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Bus not found' });
    res.json({ message: 'Bus deleted successfully' });
  } catch (err: any) {
    console.error('Error deleting bus:', err);
    res.status(500).json({ message: 'Error deleting bus' });
  }
};