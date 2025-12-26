const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// 1) Mets ici l'URI de TA base de dev
const MONGODB_URI = "mongodb+srv://gst:gst@gst.5lqrkh8.mongodb.net/gst-dev?appName=gst";

// 2) Choisis ici le login / mot de passe du gérant
const USERNAME = "dev";
const PASSWORD = "dev"; // change-le !

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connecté à MongoDB");

  const userSchema = new mongoose.Schema(
    {
      username: { type: String, required: true, unique: true, lowercase: true, trim: true },
      passwordHash: { type: String, required: true },
      role: {
        type: String,
        enum: ["manager", "admin", "staff"],
        default: "admin",
      },
    },
    { timestamps: true }
  );

  const User = mongoose.model("User", userSchema);

  const existing = await User.findOne({ username: USERNAME.toLowerCase() });
  if (existing) {
    console.log("Un utilisateur avec ce username existe déjà, arrêt.");
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  await User.create({
    username: USERNAME.toLowerCase(),
    passwordHash,
    role: "manager",
  });

  console.log(`Gérant créé avec succès : ${USERNAME}`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});