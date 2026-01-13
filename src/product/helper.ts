import cloudinary from "../config/cloudinary";
import streamifier from 'streamifier';

export const uploadFromBuffer = (buffer: Buffer, folder: string, transformation?: any) =>
  new Promise<string>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, transformation },
      (err, result) => {
        if (err) return reject(err);
        resolve(result!.secure_url);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });