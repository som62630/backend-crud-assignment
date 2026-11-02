import mongoose from 'mongoose';
import Post from '../models/Post.js';
function fields(body, partial = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const keys = Object.keys(body);
  if (!keys.length || keys.some(key => !['title', 'content'].includes(key))) return null;
  if (!partial && (!keys.includes('title') || !keys.includes('content'))) return null;
  for (const key of keys) if (typeof body[key] !== 'string' || !body[key].trim() || body[key].trim().length > (key === 'title' ? 200 : 10000)) return null;
  return Object.fromEntries(keys.map(key => [key, body[key].trim()]));
}
export function validateId(req, res, next) {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) return res.status(400).json({ message: 'Invalid post ID' });
  next();
}
export async function createPost(req, res) {
  const data = fields(req.body);
  if (!data) return res.status(400).json({ message: 'Provide title and content only, as non-empty strings' });
  const post = await Post.create({ ...data, author: req.session.userId });
  res.status(201).json({ post });
}
export async function getPosts(req, res) {
  const page = Number(req.query.page ?? 1), limit = Number(req.query.limit ?? 20);
  if (!Number.isSafeInteger(page) || page < 1 || page > 1000000 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) return res.status(400).json({ message: 'page must be 1–1000000 and limit 1–100' });
  const [posts, total] = await Promise.all([Post.find().sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).populate('author', 'name'), Post.countDocuments()]);
  res.json({ posts, page, total });
}
export async function getPost(req, res) {
  const post = await Post.findById(req.params.id).populate('author', 'name');
  if (!post) return res.status(404).json({ message: 'Post not found' });
  res.json({ post });
}
export async function updatePost(req, res) {
  const data = fields(req.body, true);
  if (!data) return res.status(400).json({ message: 'Provide title and/or content only, as non-empty strings' });
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Post not found' });
  if (post.author.toString() !== req.session.userId) return res.status(403).json({ message: 'Only the author can update this post' });
  Object.assign(post, data);
  await post.save();
  res.json({ post });
}
export async function deletePost(req, res) {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Post not found' });
  if (post.author.toString() !== req.session.userId) return res.status(403).json({ message: 'Only the author can delete this post' });
  await post.deleteOne();
  res.status(204).end();
}
