import type { Request , Response , NextFunction } from "express";
import { supabase } from "../Models/database.js";



export const profileinfo = async ( req: Request , res: Response, next:NextFunction)=>{
    try {
        if(!req.user){
            return res.status(401).json({ message: "Unauthorized" });
        }
        const  id:string =req.user.id;

        const { data :profile  , error}= await supabase
        .from('profiles')
        .select("id, full_name , role")
        .eq('id',id)
        .single();

        if(error || !profile){
            return res.status(403).json({ message: "Profile not found", error });
        }

        req.profile = profile;

        return next();
    } catch (error) {
        return res.status(401).json({
            status:"Fail",
            mes:error
        });
    }
}




export const protection =async ( req: Request , res: Response, next:NextFunction)=>{

    try {
        const authHeader = req.headers.authorization!;
    if(!authHeader || !authHeader.startsWith("Bearer ")){
       return res.status(401).json({message:"Not authorized"})
    }

    const token=authHeader.split(" ")[1];

    const {data , error } = await supabase.auth.getUser(token);
    if(error || !data.user) {
        return res.status(401).json({ message: "Invalid token" });
    }
    // const id=data.user.id;

    // const userinfo =await supabase
    // .from('profiles')
    // .select()
    // .eq('id',id);


    // req.user=userinfo;


    req.user =data.user;
    return next();
    } catch (error) {
        return res.status(401).json({
            status:"Fail",
            mes:error
        });
    }
}

export const signUp= async (req: Request , res:Response)=>{
    try {
        const { email , password , full_name}=req.body;
        const {data ,error}=await supabase.auth.signUp({email , password});

        if(error || !data){
            return res.status(400).json({error});
        }
        const userInfo =data.user!;
        // console.log("User created in auth");
        const {error : profileError } =await supabase
        .from('profiles')
        .insert({
            id: userInfo.id,
            full_name,
            email
        });
        

        if(profileError) throw profileError;
        return res.status(200).json({
            status:"Success",
            message:userInfo
        });

        // console.log("User created in profile");
    } catch (error) {
         return res.status(401).json({
            status:"Fail",
            mes:error
        });
    }
}

export const login= async (req: Request , res:Response)=>{
    try {
        const {email , password}=req.body;
        const {data , error }= await supabase.auth.signInWithPassword({email , password});
        if(error){
            res.status(400).json({error});
        }
        res.status(200).json({
            status:"Success",
            message: data.user,
            token: data.session?.access_token
        });
    } catch (error) {
        res.status(401).json({
            status:"Fail"
        });
    }
}