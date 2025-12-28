import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import { Address } from "./addressModel";
import { User } from "../user/userTypes";

const getAllAddresses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as User;
    
    const { _id } = user;

    if (!_id) {
      return next(createHttpError(400, "Please Logged In first."));
    }

    const addresses = await Address.find({ userId: _id });

    if (!addresses) {
      return next(createHttpError(201, "No Address Found."));
    }

    return res.status(200).json({
      message: "Address fetch successfully.",
      addresses: addresses
    });

  } catch (error) {
    return next(createHttpError(400, "Something went wrong."));
  }
}

const getAddressesById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (id) {
      return next(createHttpError(400, "Please Provide Product Id."));
    }

    const address = await Address.findById(id);

    if (!address) {
      return next(createHttpError(201, "No Address Found."));
    }

    return res.status(200).json({
      message: "Address fetch successfully.",
      address: address
    });

  } catch (error) {
    return next(createHttpError(400, "Something went wrong."));
  }
}

const createAddress = async (req: Request, res: Response, next: NextFunction) => {
  try {

    if (!req.user) {
      return next(createHttpError(400, "User Not exists."));
    }

    const { _id } = req.user;

    console.log("Create Address Response ", req.body);
    console.log("User Id at Create Address ", _id);

    const { line1, line2, city, state, zipCode, number } = req.body;

    if (!_id || !line1 || !city || !state || !zipCode || !number) {
      return next(createHttpError(400, "Please Provide All Fields."));
    }

    const address = await Address.create({
      userId: _id,
      line1,
      line2,
      city,
      state,
      zipCode,
      number
    });

    if (!address) {
      return next(createHttpError(201, "No Address Found."));
    }

    return res.status(200).json({
      message: "Address fetch successfully.",
      address: address
    });

  } catch (error) {
    return next(createHttpError(501, "Something went wrong."));
  }
}

const deleteAddress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.body;

    console.log("req data in address Delete ", id);

    if (!id) {
      return next(createHttpError(400, "Please Provide Product Id."));
    }

    await Address.findByIdAndDelete({ _id: id });

    return res.status(203).json({
      message: "Address Deleted successfully.",
    });

  } catch (error) {
    return next(createHttpError(501, "Something went wrong."));
  }
}

export { getAllAddresses, getAddressesById, createAddress, deleteAddress };