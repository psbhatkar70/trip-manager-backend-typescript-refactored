import { supabase } from "../Models/database.js";
import type { Request ,Response } from "express";

export const stats=async (req:Request , res: Response)=>{
        try {

            if(!req.profile){
            return res.status(401).json({
                message:"User does not exist"
            })
        }
        const { id , role ,full_name }=req.profile;
        if(role !== "owner"){
            return res.status(403).json({
                message:"Don't have access to fetch trips"
            })
        }
            const carId=req.params.carid; 
            const {data , error}=await supabase
            .rpc("toggleCarActive",{row_id:carId})

            if(error) throw error;



            return res.status(200).json({
                data:data
            })
        } catch (error) {
             return res.status(500).json({
            status:"Failed to fetch",
            message:error
        });
        }   
}