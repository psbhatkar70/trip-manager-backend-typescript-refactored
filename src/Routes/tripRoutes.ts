// import { createTrip, getAllTrips ,getSingleTrip ,cancelTrip } from "../Controllers/tripControllers.js";
import { Router } from "express";
import { createTrip } from "../Controllers/tripControllers.js";
import { profileinfo, protection } from "../Controllers/authController.js";

const router=Router();

router.route('/create').post(protection, profileinfo,createTrip);
// router.route('/:id').get(getSingleTrip).put(cancelTrip);

export default router;