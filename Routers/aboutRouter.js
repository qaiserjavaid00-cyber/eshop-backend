import { Router } from "express";

import { admin, protect } from "../middleware/protect.js";
import { getAbout, updateAbout } from "../Controllers/aboutController.js";
import videoUpload from "../db/videoUpload.js";

const aboutRouter = Router();

aboutRouter.put(
    "/upload",
    protect,
    admin,
    videoUpload.single("video"),
    updateAbout
);

aboutRouter.get(
    "/",
    getAbout
);

export default aboutRouter;