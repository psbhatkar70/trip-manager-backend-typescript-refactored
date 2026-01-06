// import { createTrip, getAllTrips ,getSingleTrip ,cancelTrip } from "../Controllers/tripControllers.js";
import { Router } from "express";
import { cancelTripByUser, createTrip, deleteTrip, getAllTrips, getSingleTrip } from "../Controllers/tripControllers.js";
import { profileinfo, protection } from "../Controllers/authController.js";
import { stats } from "../Controllers/aggregateControllers.js";

const router=Router();

router.route('/create').post(protection, profileinfo,createTrip);
router.route('/getall').get(protection, profileinfo,getAllTrips);
router.route('/:tripid').get(protection,profileinfo, getSingleTrip).delete(protection,profileinfo, deleteTrip);
router.route('/stats').get(protection, profileinfo, stats);
router.route('/cancel/:tripid').get(protection, profileinfo, cancelTripByUser);



export default router;