import { Router } from "express";
import { ApimService } from "../services/apim.js";

export const apisRouter = Router();

apisRouter.get("/", async (req, res, next) => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    res.json(await ApimService.listApis(search));
  } catch (e) {
    next(e);
  }
});

apisRouter.get("/:name/operations", async (req, res, next) => {
  try {
    res.json(await ApimService.listOperations(req.params.name));
  } catch (e) {
    next(e);
  }
});

export const tagsRouter = Router();
tagsRouter.get("/", async (_req, res, next) => {
  try {
    res.json(await ApimService.listTags());
  } catch (e) {
    next(e);
  }
});
