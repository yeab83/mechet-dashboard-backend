import { Router } from 'express';
import { createRouting, deleteRouting, getRoutingById, getRoutings, updateRouting } from '../controllers/routing.Controller';



const Busrouter = Router();


Busrouter.get('/', getRoutings);
Busrouter.get('/:id',getRoutingById );
Busrouter.post('/', createRouting);
Busrouter.patch('/:id',updateRouting);
Busrouter.delete('/:id', deleteRouting);


export default Busrouter;