// routes/passengerRoutes.ts
import express from 'express';
import {
  createPassenger,
  getAllPassengers,
  getPassengersByVoyage
} from '../controllers/PassengerDetails.Controller';

const router = express.Router();

// POST /api/passengerdetails - Create a new passenger
router.post('/', createPassenger);

// GET /api/passengerdetails - Get all passengers
router.get('/', getAllPassengers);

// GET /api/passengerdetails/voyage/:voyageId - Get passengers by voyage
router.get('/voyage/:voyageId', getPassengersByVoyage);

export default router;