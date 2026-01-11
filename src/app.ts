import express from 'express';
import type {Request , Response } from 'express';
import authRoutes from './Routes/authRoutes.js';
import tripRoutes from './Routes/tripRoutes.js';
import carRoutes from './Routes/carRoutes.js';
import reviewRoutes from './Routes/reviewRoutes.js'
import 'dotenv/config';


const app = express();
app.use(express.json());

app.use('/users',authRoutes);
app.use('/trips',tripRoutes);
app.use('/cars',carRoutes);
app.use('/review',reviewRoutes);



app.get('/',(req: Request ,res: Response )=>{
    res.send("Hello from here");
})
app.listen(3000,()=>{
    console.log("Server Started");
})