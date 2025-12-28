import { OAuth2Client } from "google-auth-library";
import { config } from "../../config/config";

const CLIENT_ID = config.googel_client_id as string

const client = new OAuth2Client({
  clientId: CLIENT_ID,
});

export async function verifyIdToken(idToken: string) {

  const LoginTicket = await client.verifyIdToken({
    idToken,
    audience: CLIENT_ID,
  });

  const userData = LoginTicket.getPayload();

  if (!userData) {
    throw new Error("Invalid Google ID token");
  }

  return userData;
}