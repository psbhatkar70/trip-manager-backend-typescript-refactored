import type { Request, Response } from "express";
import { supabase } from "../Models/database.js";

export const createCar = async (req:Request , res:Response)=>{
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

        const {model, car_number, driver_cost, mileage , price_perKm, extra_day_cost} = req.body;
        if (!model || !car_number || !price_perKm || !mileage ) {
            return res.status(400).json({
            message: "Missing required fields"
            });
        }
        const {error }=await supabase
        .from('Cars')
        .insert({
            model:model,
            car_number: car_number.split(" ").join('').toUpperCase(),
            driver_cost:driver_cost,
            mileage:mileage,
            price_perKm : price_perKm,
            extra_day_cost:extra_day_cost,
            owner_name: full_name,
            owner_id : id
        });

        if(error){
            return res.status(400).json({
            message: error
            });
        }

        return res.status(201).json({
            status:"Success"
        });


    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status:"Failed to create",
            message:error
        });
    }
}

export const getAllCars= async ( req :Request , res:Response)=>{
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

export const getSingleCar = async ( req :Request , res:Response)=>{
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

export const editCar = async ( req: Request , res:Response)=>{
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