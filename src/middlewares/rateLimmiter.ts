import { HttpError } from 'http-errors';
import { NextFunction, Request, Response } from "express";

type RateLimitEntry = {
  startTime: number;
  count: number;
};

const rateLimitStore: Record<string, RateLimitEntry> = {};

function rateLimit({
  windowSize,
  numberOfRequests,
}: {
  windowSize: number; // in ms
  numberOfRequests: number;
}) {
  return function (req: Request, res: Response, next: NextFunction) {
    const currTime = Date.now();
    const ip = req.ip;
   
    if(ip === undefined) {
      return next(new HttpError("System is undefined"));
    }
    if (!rateLimitStore[ip]) {
      rateLimitStore[ip] = {
        startTime: currTime,
        count: 1,
      };
      return next();
    }

    const entry = rateLimitStore[ip];

    if (currTime - entry.startTime > windowSize) {
      // reset window
      rateLimitStore[ip] = {
        startTime: currTime,
        count: 1,
      };
      return next();
    }

    entry.count++;

    if (entry.count > numberOfRequests) {
      return res.status(429).json({ error: "Too many requests" });
    }

    return next();
  };
}

export default rateLimit;