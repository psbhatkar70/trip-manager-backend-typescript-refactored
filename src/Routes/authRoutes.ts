import { Router } from "express";
import { protection , signUp , login} from "../Controllers/authController.js";

const router = Router();

// router.route('/protection').get(protection);
router.route('/signup').post(signUp);
router.route('/login').post(login);


export default router;