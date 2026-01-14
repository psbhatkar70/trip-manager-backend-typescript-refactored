import express from 'express';
import type {Request , Response } from 'express';
import authRoutes from './Routes/authRoutes.js';
import tripRoutes from './Routes/tripRoutes.js';
import carRoutes from './Routes/carRoutes.js';
import reviewRoutes from './Routes/reviewRoutes.js';
import userRoutes from './Routes/userRoutes.js';
import 'dotenv/config';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

const app = express();
const limitter = rateLimit({
    windowMs: 15 * 60 * 1000, 
	max: 100, // Limit each IP to 100 requests per window
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: "Too many requests from this IP, please try again after 15 minutes"
})
app.use(limitter);
app.use(helmet());
app.use(express.json());

app.use('/auth',authRoutes);
app.use('/trips',tripRoutes);
app.use('/cars',carRoutes);
app.use('/review',reviewRoutes);
app.use('/user',userRoutes);




app.get('/',(req: Request ,res: Response )=>{
    res.send("Hello from here");
})
app.listen(3000,()=>{
    console.log("Server Started");
})