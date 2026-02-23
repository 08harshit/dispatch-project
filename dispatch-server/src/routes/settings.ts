import { Router, Request, Response } from "express";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Settings
 *   description: User profile and preferences
 */

/**
 * @swagger
 * /settings/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: User profile data
 *   put:
 *     summary: Update user profile
 *     tags: [Settings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName: { type: string }
 *               companyName: { type: string }
 *               phone: { type: string }
 *               timezone: { type: string }
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.get("/profile", (_req: Request, res: Response) => {
    res.json({ success: true, data: null, message: "Get profile" });
});

router.put("/profile", (_req: Request, res: Response) => {
    res.json({ success: true, message: "Profile updated" });
});

/**
 * @swagger
 * /settings/password:
 *   put:
 *     summary: Change user password
 *     tags: [Settings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string, format: password }
 *               newPassword: { type: string, format: password }
 *     responses:
 *       200:
 *         description: Password changed
 */
router.put("/password", (_req: Request, res: Response) => {
    res.json({ success: true, message: "Password changed" });
});

/**
 * @swagger
 * /settings/notifications:
 *   get:
 *     summary: Get notification preferences
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: Notification preferences
 *   put:
 *     summary: Update notification preferences
 *     tags: [Settings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: boolean }
 *               push: { type: boolean }
 *               urgentOnly: { type: boolean }
 *     responses:
 *       200:
 *         description: Preferences updated
 */
router.get("/notifications", (_req: Request, res: Response) => {
    res.json({ success: true, data: { email: true, push: true, urgentOnly: false } });
});

router.put("/notifications", (_req: Request, res: Response) => {
    res.json({ success: true, message: "Notification preferences updated" });
});

export default router;
