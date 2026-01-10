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
        const { id , role  }=req.profile;
        // if(role !== "owner"){
        //     return res.status(403).json({
        //         message:"Don't have access to create car"
        //     })
        // }
        if (!req.body) {
            return res.status(400).json({ message: "Request body missing" });
        }

        const { car_id,  total_distance,  trip_start_date , trip_end_date ,customer_name , total_days} = req.body;
        if ( !total_distance || !trip_start_date || !trip_end_date ) {
            return res.status(400).json({
            message: "Missing required fields"
            });
        }

        const today = new Date();
        const startdate= new Date(trip_start_date);
        const enddate=new Date(trip_end_date);

        if(startdate.getTime()>enddate.getTime()){
            return res.status(400).json({message:"Trip end date must be greater than trip start date."});
        }

        const prevdate=Math.floor((startdate.getTime()-today.getTime())/86400000)+1;

        if(prevdate<=0){
            return res.status(400).json({
                message:"You can not book in past dates or less than 12 hours duration"
            })
        }



//         const {data: cardata, error:carerror }=await supabase
//         .from('Cars')
//         .select()
//         .match({
//             'id':car_id
//         })
//         .single();

//         if(!cardata || carerror){
//             return res.status(500).json({msg:"Server error",error:carerror});
//         }
//         const {data : ownerdata, error:ownererror}= await supabase
//         .from("profiles")
//         .select()
//         .match({
//             'id':cardata.owner_id,
//             "role":"owner"
//         });

//         if(!ownerdata || ownererror){
//             return res.status(404).json({msg:"The owner or business does not exist"});
//         }
//         if(!cardata.active){
//             return res.status(404).json({msg:"Car is under maintenance"});
//         }
        

///
        // const total_cost:number = total_distance * cardata.price_perKm + cardata.driver_cost + (total_days - 1) * cardata.extra_day_cost ;

        // const profit:number=total_cost - (total_distance*cardata.mileage) - cardata.driver_cost;
        const {error }=await supabase
        .rpc("create_trip_rpc",{
            p_user_id :id,
            p_car_id:car_id ,
            p_total_distance:total_distance ,
            p_trip_start_date : trip_start_date,
            p_trip_end_date:trip_end_date ,
            p_customer_name : customer_name,
            p_total_days : total_days,
            p_role :role
        })
        
        if(error){
            if(error.code==="23P01"){
                return res.status(409).json({message:"The car is booked for this dates..please choose another date"});
            }
            return res.status(400).json({
            message: error
            });
        }

        return res.status(201).json({
            status:"Success",
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
                message:"Don't have access to fetch trips"
            })
        }

        let query =supabase
        .from('trips')
        .select()
        .eq('owner_id',id);

        if(req.query.month){
            const start=`${req.query.month}-01`;
            let end=`${req.query.month}-01`;
            let a=end.split("-");
            const num=a.map(Number);
            if(num[1]===12){
                num[0]! +=1;
                num[1]=1;
            }else{
                num[1]! +=1;
            }
            a=num.map(String);
            end=a.join("-");
            query=query
            .gte("trip_start_date",start)
            .lt("trip_end_date",end)
        }

        if(req.query.carId){
            query =query
            .eq("car_id",req.query.carId);
        }
        if(req.query.status){
            query= query
            .eq("trip_completed",req.query.status);
        }

        const {data , error }= await query;

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
        
        const tripId = req.params.tripid;
        
        if(role==="owner"){
            const {data , error }= await supabase
        .from('trips')
        .select()
        .match({
            'owner_id':id,
            'id':tripId
        })
        .single()
        if(error) throw error;

        return res.status(200).json({
            status:"Success",
            data:data
        })
        }else{
            const {data , error }= await supabase
        .from('trips')
        .select()
        .match({
            'owner_id':id,
            'id':tripId
        })
        .neq("status_cancelled",true)
        if(error) throw error;

        return res.status(200).json({
            status:"Success",
            data:data
        })
        }

        
        } catch (error) {
            return res.status(500).json({
            status:"Failed to fetch",
            message:error
        });
        }
}



// TODO  edit trip api refactor whole
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
                message:"Don't have access to edit trip"
            })
        }

        const tripId = req.params.tripid;


        const {trip_start_date, trip_end_date , total_distance, total_days ,car_id }=req.body;
       
        const {data: occupied ,error: occupyerror}=await supabase
        .from("trips")
        .select()
        .match({
            "car_id":car_id
        })
        .lte("trip_start_date",trip_end_date)
        .gte("trip_end_date",trip_start_date)
        .neq("id",tripId);
        


        if(occupyerror){
            return res.status(500).json({message: occupyerror?.message})
        }
        if(occupied && occupied.length > 0){
            return res.status(409).json({
                message:`The car is already booked from ${occupied[0].trip_start_date} to ${occupied[0].trip_end_date} `
            })
        }


        const {data: cardata, error:carerror }=await supabase
        .from('Cars')
        .select()
        .match({
            'id':car_id
        })
        .single();
        const total_cost:number = total_distance * cardata.price_perKm + cardata.driver_cost + (total_days - 1) * cardata.extra_day_cost ;

        const profit:number=total_cost - (total_distance*cardata.mileage) - cardata.driver_cost;
        
        const {error }=await supabase
        .from('trips')
        .update({
            trip_start_date:trip_start_date,
            trip_end_date: trip_end_date ,
            total_distance: total_distance, 
            total_days: total_days,
            total_cost : total_cost,
            profit : profit
        })
        .match({
            'owner_id':id,
            'id':tripId
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


export const cancelTripByUser = async ( req:Request , res:Response)=>{
    try {
        if(!req.profile){
            return res.status(401).json({
                message:"User does not exist"
            })
        }
        const { id  }=req.profile;
        const tripId = req.params.tripid;
        
        const {data , error}= await supabase
        .from("trips")
        .select()
        .match({
            "booked_by_id":id,
            "id":tripId
        });
        


        if(error || !data){
            return res.status(404).json({msg:"Not found", error:error?.message});
        }

        
        const today = new Date();
        
        const dbdate = new Date(data[0].trip_start_date);

        const daysgap=Math.floor((dbdate.getTime()-today.getTime())/86400000)+1;
        console.log(daysgap)
        if(daysgap>=2){
            const {error}=await supabase
            .from("trips")
            .update({
                status_cancelled:"YES:F"
            })
            .eq("id",tripId);

            return res.status(200).json({
                message:"Trip deleted successfully!"
            })
        }else if(daysgap>=1){
            const {error}=await supabase
            .from("trips")
            .update({
                status_cancelled:"YES:P"
            })
            .eq("id",tripId);

            return res.status(204).json({
                message:"Trip deleted successfully but only one day is remaining so you will be charged and wont get full refund!"
            })
        }else{
            return res.status(404).json({
                message:"The trip is either completed or is in process."
            });

        }

    } catch (error) {
        return res.status(500).json({
            status:"Failed to cancel",
            message:error
        });
    }
}