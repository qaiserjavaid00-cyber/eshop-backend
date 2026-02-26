import { Router } from "express";

import { admin, protect } from "../middleware/protect.js";
import { create, deleteSub, list, singleSubById } from "../Controllers/subController.js";

const subRouter = Router();

subRouter.post("/create", create);
subRouter.get("/list", list);
subRouter.delete("/:id", deleteSub);
subRouter.get("/:id", singleSubById);


export default subRouter;