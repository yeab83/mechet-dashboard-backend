import { Router } from 'express';
import { createBus, deleteBus, getBusById, getBuses, updateBus } from '../controllers/bus.Controller';



const Busrouter = Router();


Busrouter.get('/', getBuses);
Busrouter.get('/:id', getBusById);
Busrouter.post('/', createBus);
Busrouter.put('/:id',updateBus);
Busrouter.delete('/:id', deleteBus);


export default Busrouter;