import { Router } from "express";
import { carSchedule, createCar, deleteCar, editCar, getAllCars, getSingleCar, toggleStatus } from "../Controllers/carControllers.js";
import { profileinfo, protection } from "../Controllers/authController.js";



const router=Router();

router.route('/create').post(protection, profileinfo ,createCar);
router.route('/getall/:ownerid').get(protection, profileinfo, getAllCars);
router.route('/:carid').get(protection, profileinfo, getSingleCar);
router.route('/:carid/schedule').get(protection, profileinfo, carSchedule);
router.route('/update/:carid').patch(protection, profileinfo, editCar).get(protection,profileinfo,toggleStatus);
router.route('/delete/:carid').patch(protection, profileinfo, deleteCar);

export default router;