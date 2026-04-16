const prisma = require("../utils/prisma");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const SALT_ROUNDS = 12;

exports.createUser = async (email, password) => {
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: { email: email.toLowerCase().trim(), password: hashedPassword },
    select: { id: true, email: true, createdAt: true },
  });

  // Auto-enroll: create UserWord for all existing words
  const allWords = await prisma.word.findMany({ select: { id: true } });
  if (allWords.length > 0) {
    await prisma.userWord.createMany({
      data: allWords.map((w) => ({ userId: user.id, wordId: w.id })),
      skipDuplicates: true,
    });
  }

  return user;
};

exports.findUserByEmail = async (email) => {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
};

exports.findUserById = async (id) => {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, createdAt: true },
  });
};

exports.verifyPassword = async (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

exports.generateAccessToken = (user) => {
  return jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || "15m" },
  );
};

exports.generateRefreshToken = (user) => {
  return jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || "7d" },
  );
};

exports.verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

exports.createPasswordResetToken = async (email) => {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
  if (!user) return null;

  // Delete any existing tokens for this user
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.passwordResetToken.create({
    data: { token, userId: user.id, expiresAt },
  });

  return { token, user };
};

exports.verifyPasswordResetToken = async (token) => {
  const record = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: { select: { id: true, email: true } } },
  });

  if (!record || record.expiresAt < new Date()) {
    return null;
  }

  return record;
};

exports.resetPassword = async (token, newPassword) => {
  const record = await exports.verifyPasswordResetToken(token);
  if (!record) return false;

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.user.update({
    where: { id: record.userId },
    data: { password: hashedPassword },
  });

  await prisma.passwordResetToken.delete({ where: { id: record.id } });

  return true;
};
