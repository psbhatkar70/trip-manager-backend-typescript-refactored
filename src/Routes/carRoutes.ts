import { Router } from "express";
import { createCar, deleteCar, editCar, getAllCars, getSingleCar } from "../Controllers/carControllers.js";
import { profileinfo, protection } from "../Controllers/authController.js";
createCar


const router=Router();

router.route('/create').post(protection, profileinfo ,createCar);
router.route('/getall').get(protection, profileinfo, getAllCars);
router.route('/:carid').get(protection, profileinfo, getSingleCar);
router.route('/update/:carid').patch(protection, profileinfo, editCar);
router.route('/delete/:carid').patch(protection, profileinfo, deleteCar);

export default router;