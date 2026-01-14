import type { Response , Request } from "express";
import { supabase } from "../Models/database.js";

export const getAllBusiness= async (req:Request , res:Response)=>{
    try {

        if(!req.profile){
            return res.status(401).json({message:"User does not exist"});
        }

        const page = Number(req.query.page) || 1;
        const limit=Number(req.query.limit) || 10;
        const from = (page -1 ) * limit;
        const to= from + page -1;
        
        const {data ,count, error }=await supabase
        .from("profiles")
        .select("*",{count:"exact"})
        .eq("role","owner")
        .range(from,to);


        if(!data || !count){
            return res.status(404).json({
                message:"No date to show."
            });
        }

        if(error) throw error;

        return res.status(200).json({
            data:data,
            totalRows:count,
            totalPages:Math.ceil(count/limit)
        });
        
    } catch (error) {
        return res.status(500).json({
            status:"Failed to fetch",
            message:error
        });
    }
}