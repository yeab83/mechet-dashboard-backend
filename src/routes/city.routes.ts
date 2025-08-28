import { Router } from "express";
import { createCity, getCities, updateCity, deleteCity } from "../controllers/city.controller";

const cityrouter = Router();

cityrouter.post("/", createCity);
cityrouter.get("/", getCities);
cityrouter.patch("/:id", updateCity);
cityrouter.delete("/:id", deleteCity);

export default cityrouter;
