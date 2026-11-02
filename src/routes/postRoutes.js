import { Router } from 'express';
import { createPost, getPosts, getPost, updatePost, deletePost, validateId } from '../controllers/postController.js';
import { requireAuth } from '../middleware/auth.js';
const router = Router();
router.route('/').get(getPosts).post(requireAuth, createPost);
router.route('/:id').all(validateId).get(getPost).patch(requireAuth, updatePost).delete(requireAuth, deletePost);
export default router;
