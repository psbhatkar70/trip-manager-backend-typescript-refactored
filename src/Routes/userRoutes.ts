import { Router } from "express";
import { profileinfo, protection } from "../Controllers/authController.js";
import { getAllBusiness } from "../Controllers/userControllers.js";



const router=Router();

router.route('/bussinesses').get(protection, profileinfo ,getAllBusiness);

export default router;