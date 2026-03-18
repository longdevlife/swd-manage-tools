import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import prisma from "./db.js";

// Build absolute callback URL for Vercel serverless compatibility
// GOOGLE_CALLBACK_URL must be set as env var on Vercel dashboard
const getCallbackURL = () => {
  return process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback";
};

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: getCallbackURL(),
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const avatar = profile.photos?.[0]?.value;
        const full_name = profile.displayName;

        let user = await prisma.user.findUnique({ where: { google_id: profile.id } });

        if (!user) {
          user = await prisma.user.findUnique({ where: { email } });

          if (user) {
            user = await prisma.user.update({
              where: { user_id: user.user_id },
              data: { google_id: profile.id, avatar },
            });
          } else {
            let roleRecord = await prisma.role.findUnique({ where: { role_name: "MEMBER" }});
            if (!roleRecord) {
               roleRecord = await prisma.role.create({ data: { role_name: "MEMBER" }});
            }

            user = await prisma.user.create({
              data: {
                full_name,
                email,
                google_id: profile.id,
                avatar,
                user_roles: {
                  create: [{ role_id: roleRecord.role_id }]
                }
              },
            });
          }
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.user_id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { user_id: id } });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
