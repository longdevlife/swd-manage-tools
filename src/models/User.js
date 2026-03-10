import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // Định nghĩa schema tại đây
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);
export default User;
