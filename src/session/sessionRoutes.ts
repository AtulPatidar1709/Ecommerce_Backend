import { Router } from 'express'
import { createUserSession, deleteSession, getAllUserSessions } from './sessionController';
import checkAuth from '../middlewares/authMiddleware';

const sessionRoutes = Router();

sessionRoutes.get("/", checkAuth, getAllUserSessions);
sessionRoutes.post("/", createUserSession);
sessionRoutes.post("/delete", checkAuth, deleteSession);

export default sessionRoutes;