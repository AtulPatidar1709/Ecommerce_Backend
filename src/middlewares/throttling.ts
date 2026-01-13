import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";

type ThrottleOptions = {
  leading?: boolean;
  trailing?: boolean;
};

type ThrottleEntry = {
  last: number;
};

const store: Record<string, ThrottleEntry> = {};

function throttling(timeDelay = 1000, options: ThrottleOptions = {}) {
  
   const { leading = true, trailing = false } = options;

  return function (req: Request, res: Response, next: NextFunction) {
    const now = Date.now();
    const key = req.ip;

    if(key === undefined) {
      return next(createHttpError(429, "System is undefined"))
    }

    if (!store[key]) {
      store[key] = { last: 0 };
    }

    const entry = store[key];

    // Skip leading call
    if (!leading && entry.last === 0) {
      entry.last = now;
      return res.status(429).json({ error: "Throttled" });
    }

    if (now - entry.last >= timeDelay) {
      entry.last = now;
      return next();
    }

    // Trailing behavior → reject
    if (trailing) {
      return res.status(429).json({ error: "Too many requests" });
    }

    return res.status(429).json({ error: "Throttled" });

  };
}

export default throttling;
