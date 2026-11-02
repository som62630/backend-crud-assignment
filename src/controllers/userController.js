import bcrypt from 'bcryptjs';
import User from '../models/User.js';
const publicUser = user => ({ id: user.id, name: user.name, email: user.email });
const regenerate = req => new Promise((resolve, reject) => req.session.regenerate(err => err ? reject(err) : resolve()));
const save = req => new Promise((resolve, reject) => req.session.save(err => err ? reject(err) : resolve()));
export async function register(req, res) {
  const { name, email, password } = req.body ?? {};
  if (typeof name !== 'string' || !name.trim() || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password) > 72)
    return res.status(400).json({ message: 'Provide a name, valid email and password of at least 8 characters (at most 72 bytes)' });
  const user = await User.create({ name, email: email.trim().toLowerCase(), password: await bcrypt.hash(password, 12) });
  res.status(201).json({ message: 'Registered successfully', user: publicUser(user) });
}
export async function login(req, res) {
  const { email, password } = req.body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string') return res.status(400).json({ message: 'Email and password are required' });
  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
  if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ message: 'Invalid email or password' });
  await regenerate(req);
  req.session.userId = user.id;
  await save(req);
  res.json({ message: 'Logged in successfully', user: publicUser(user) });
}
export async function logout(req, res, next) {
  req.session.destroy(err => {
    if (err) return next(err);
    res.clearCookie('sid');
    res.json({ message: 'Logged out successfully' });
  });
}
