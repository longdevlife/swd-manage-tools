import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import prisma from "./db.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const avatar = profile.photos?.[0]?.value;

        // Tìm user theo googleId trước
        let user = await prisma.user.findUnique({ where: { googleId: profile.id } });

        if (!user) {
          // Tìm theo email (trường hợp đã đăng ký trước bằng email/pass)
          user = await prisma.user.findUnique({ where: { email } });

          if (user) {
            // Link googleId vào account cũ
            user = await prisma.user.update({
              where: { id: user.id },
              data: { googleId: profile.id, avatar },
            });
          } else {
            // Tạo mới hoàn toàn
            user = await prisma.user.create({
              data: {
                name: profile.displayName,
                email,
                googleId: profile.id,
                avatar,
                role: "MEMBER",
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

// Serialize/deserialize chỉ lưu id vào session
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
