import express from "express";
import { subscribe } from "../Controllers/subscriberController.js";

const subscriberRouter = express.Router();

subscriberRouter.post("/", subscribe);

export default subscriberRouter;