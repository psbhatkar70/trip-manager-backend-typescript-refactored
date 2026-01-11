import type { Request , Response } from "express";
import { supabase } from "../Models/database.js";
import type { RecordWithTtl } from "node:dns";
import { error } from "node:console";

export const createReview = async ( req:Request , res:Response)=>{
    try {
        if(!req.profile){
            return res.status(401).json({
                message:"User does not exist"
            })
        }
        const { id  , role }=req.profile;
        // if(role ==="owner") return res.status(403).json({message:"Owner's can't review their own trips."})
        if(!req.body){
            return res.status(400).json({
                message:"Request body must be provided"
            })
        }
        const {rating , review , car_rating ,type}= req.body;

        const tripId = req.params.tripid;

        const { data ,error }= await supabase
        .rpc("create_review_rpc",{
            p_trip_id:tripId ,
            p_user_id :id,
            p_rating :rating,
            p_review :review,
            p_car_rating: car_rating,
            p_type:type
        })
        if(error){
            if(error.code==="23505") return res.status(409).json({message:"Review for this trip is already added cant add more than one"});
            if(error.code==="P0001") return res.status(400).json({message:"Rating must be between 0 and 5",error:error});
            return res.status(400).json({
                error
            });
        }

        return res.status(201).json({
            status:"Success",
            data:data
        });
        
        
    } catch (error) {
        return res.status(500).json({
            error:error
        });
    }
}


export const getAllreviews= async(req:Request , res:Response)=>{
    try {
        if(!req.profile){
            return res.status(401).json({
                message:"User does not exist"
            })
        }
        const { id }=req.profile;
        if(!req.params.ownerid){
            const owner_id=id;

            const {data ,error }=await supabase
            .from("reviews")
            .select()
            .eq("owner_id",owner_id);

            if(error || !data){
                return res.status(400).json({
                    status:"Fail",
                    error:error
                })
            }

            return res.status(200).json({
                data:data
            })
        }else if(req.params.ownerid){
            const owner_id=req.params.ownerid;

            const {data ,error }=await supabase
            .from("reviews")
            .select()
            .eq("owner_id",owner_id);

            if(error || !data){
                return res.status(400).json({
                    status:"Fail",
                    error:error
                })
            }

            return res.status(200).json({
                data:data
            })
        }


        return res.status(403).json({
            error:"No user found!"
        })
        
    } catch (error) {
        return res.status(500).json({
            error:error
        });
    }
}

export const getReviewsCarSingle= async (req:Request , res:Response)=>{
    try {
         if(!req.profile){
            return res.status(401).json({
                message:"User does not exist"
            })
        }
        const carId= req.params.carid;

        const { data , error }=await supabase
        .from("reviews")
        .select()
        .eq("car_id",carId);

        if(error ){
            return res.status(400).json({
                error:error,
            });
        }else if(!data){
            return res.status(404).json({message:"The car does not have any reviews yet."});
        };

        return res.status(200).json({
            data:data
        });


    } catch (error) {
        return res.status(500).json({
            error:error
        });
    }
}

export const addCommentToReview = async (req:Request , res:Response)=>{
    try {
        if(!req.profile){
            return res.status(401).json({
                message:"User does not exist"
            })
        }

        const { id , role } = req.profile;

        if(role !=="owner"){
            return res.status(401).json({
                message:"Only owner's can add comment on reviews."
            })
        }
        if(!req.body){
            return res.status(400).json({
                message:"Request body must be provided"
            })
        }
        const reviewId = req.params.reviewid;
        const {comment }=req.body;
        if(!comment){
            return res.status(400).json({
                message:"Comment must be provided."
            })
        }
        const { error }= await supabase
        .from("reviews")
        .update({
            "comment_by_owner":comment
        })
        .match({
            "id":reviewId,
            "owner_id":id
        })

        if(error){
            return res.status(400).json({
                error:error,
                message:"Trip does not exist or it does not belong to you."
            })
        };

        return res.status(201).json({
            status:"Success"
        });
    } catch (error) {
        return res.status(500).json({
            error:error
        });
    }
}


export const getTripReviewSingle =async (req:Request , res:Response)=>{
    try {
         if(!req.profile){
            return res.status(401).json({
                message:"User does not exist"
            })
        }
        const tripId= req.params.tripid;

        const { data , error }=await supabase
        .from("reviews")
        .select()
        .eq("trip_id",tripId);

        if(error ){
            return res.status(400).json({
                error:error,
            });
        }else if(!data){
            return res.status(404).json({message:"The trip does not have any reviews yet."});
        };

        return res.status(200).json({
            data:data
        });


    } catch (error) {
        return res.status(500).json({
            error:error
        });
    }
}
