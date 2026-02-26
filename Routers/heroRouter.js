import { Router } from "express";

import { admin, protect } from "../middleware/protect.js";

import { getHero, updateHero } from "../Controllers/heroController.js";
import fileupload from "../db/fileupload.js";

const heroRouter = Router();

heroRouter.put("/", fileupload.any(), protect, admin, updateHero);
heroRouter.get("/", getHero);



export default heroRouter;