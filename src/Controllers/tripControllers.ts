import type { Request, Response  } from "express";
import { error } from "node:console";
import { supabase } from "../Models/database.js";

export const createTrip = async (req:Request , res:Response)=>{
    try {

        if(!req.profile){
            return res.status(401).json({
                message:"User does not exist"
            })
        }
        const { id , role ,full_name }=req.profile;
        if(role !== "owner"){
            return res.status(403).json({
                message:"Don't have access to create car"
            })
        }
        if (!req.body) {
            return res.status(400).json({ message: "Request body missing" });
        }

        const {business_name, car_id,  total_distance,  trip_start_date , trip_end_date ,customer_name} = req.body;
        if ( !total_distance || !trip_start_date || !trip_end_date ) {
            return res.status(400).json({
            message: "Missing required fields"
            });
        }

        const {data: cardata, error }=await supabase
        .from('Cars')
        .select()
        .match({
            'id':car_id,
            'owner_id':id
        })
        .single();



        // const {error }=await supabase
        // .from('trips')
        // .insert({
        //     car_number: car_number.split(" ").join('').toUpperCase(),
        //     owner_name: full_name,
        //     owner_id : id,
        //     car_id:car_id,
        //     car_name:car_name,
        //     business_name:business_name,
        //     trip_start_date:trip_start_date,
        //     trip_end_date:trip_end_date,
        //     customer_name:customer_name,
        //     total_distance:total_distance,
        //     total_cost:total_cost,
        //     profit:profit
        // });

        if(error){
            console.log(error)
            return res.status(400).json({
            message: error
            });
        }

        return res.status(201).json({
            status:"Success",
            msg:cardata
        });


    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status:"Failed to create",
            message:error
        });
    }
}

export const getAllTrips= async ( req :Request , res:Response)=>{
    try {
        if(!req.profile){
            return res.status(401).json({
                message:"User does not exist"
            })
        }
        const { id , role ,full_name }=req.profile;
        if(role !== "owner"){
            return res.status(403).json({
                message:"Don't have access to fetch cars"
            })
        }

        const {data , error }= await supabase
        .from('Cars')
        .select()
        .eq('owner_id',id);

        if(error) throw error;

        return res.status(200).json({
            status:"Success",
            data:{...data}
        })
    } catch (error) {
         return res.status(500).json({
            status:"Failed to fetch",
            message:error
        });
    }
}

export const getSingleTrip = async ( req :Request , res:Response)=>{
        try {
            if(!req.profile){
            return res.status(401).json({
                message:"User does not exist"
            })
        }
        const { id , role  }=req.profile;
        if(role !== "owner"){
            return res.status(403).json({
                message:"Don't have access to fetch cars"
            })
        }
        const carId = req.params.carid;
        
        const {data , error }= await supabase
        .from('Cars')
        .select()
        .match({
            'owner_id':id,
            'id':carId
        })
        .single()

        if(error) throw error;

        return res.status(200).json({
            status:"Success",
            data:{...data}
        })
        } catch (error) {
            return res.status(500).json({
            status:"Failed to fetch",
            message:error
        });
        }
}

export const editTrip = async ( req: Request , res:Response)=>{
    try {
         if(!req.profile){
            return res.status(401).json({
                message:"User does not exist"
            })
        }
        const { id , role  }=req.profile;
        if(role !== "owner"){
            return res.status(403).json({
                message:"Don't have access to edit cars"
            })
        }


        const {driver_cost, mileage , price_perKm, extra_day_cost}=req.body;
        if (!driver_cost || !extra_day_cost || !price_perKm || !mileage ) {
            return res.status(400).json({
            message: "Missing required fields"
            });
        }
        const carId = req.params.carid;
        const {error }=await supabase
        .from('Cars')
        .update({
            driver_cost:driver_cost,
            mileage:mileage,
            price_perKm : price_perKm,
            extra_day_cost:extra_day_cost,
        })
        .match({
            'owner_id':id,
            'id':carId
        })
        if(error) throw error;

        return res.status(204).json({status:"Success"});
    } catch (error) {
        return res.status(500).json({
            status:"Failed to fetch",
            message:error
        });
    }
}

export const deleteCar = async ( req: Request , res:Response)=>{
    try {
         if(!req.profile){
            return res.status(401).json({
                message:"User does not exist"
            })
        }
        const { id , role  }=req.profile;
        if(role !== "owner"){
            return res.status(403).json({
                message:"Don't have access to edit cars"
            })
        }


        const carId = req.params.carid;
        const {error }=await supabase
        .from('Cars')
        .update({
            deleted: true
        })
        .match({
            'owner_id':id,
            'id':carId
        })
        if(error) throw error;
        return res.status(204).json({status:"Success"});
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            status:"Failed to fetch",
            message:error
        });
    }
}