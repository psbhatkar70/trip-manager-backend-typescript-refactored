import { Router } from "express";
import { profileinfo, protection } from "../Controllers/authController.js";
import { addCommentToReview, createReview, getAllreviews, getReviewsCarSingle, getTripReviewSingle } from "../services/reviewController.js";

const router=Router();

router.route('/create/:tripid').post(protection, profileinfo ,createReview);
router.route('/getall{/:ownerid}').get(protection, profileinfo ,getAllreviews);
router.route('/getforcar/:carid').get(protection, profileinfo ,getReviewsCarSingle);
router.route('/addComment/:reviewid').post(protection, profileinfo ,addCommentToReview);
router.route('/getfortrip/:tripid').get(protection, profileinfo ,getTripReviewSingle);

export default router;