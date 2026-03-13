import { Router } from "express";

import { admin, protect } from "../middleware/protect.js";

import { createHero, deleteHero, getActiveHeroes, getAllHeroes, updateHero } from "../Controllers/heroController.js";
import fileupload from "../db/fileupload.js";

const heroRouter = Router();

heroRouter.post("/", protect, admin, fileupload.any(), createHero);
heroRouter.put("/edit/:id", protect, admin, fileupload.any(), updateHero);
heroRouter.delete("/:id", protect, admin, deleteHero);
heroRouter.get("/", getAllHeroes);
heroRouter.get("/active", getActiveHeroes);



export default heroRouter;