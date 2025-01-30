import dotenv from 'dotenv';
import { SYSTEM_PROMPT } from "../utils/prompt.js";
import WeatherModel from './models/WeatherModel.js';
import AIController from './controllers/AIController.js';

dotenv.config();

async function main() {
    try {
        const weatherModel = new WeatherModel();
        const aiController = new AIController(weatherModel);

        const userQuery = "What is the sum of weather in patiala and delhi?";
        const result = await aiController.processWeatherQuery(userQuery, SYSTEM_PROMPT);

        console.log("\nFinal Result:", result);
    } catch (error) {
        console.error("Application Error:", error.message);
    }
}

main(); 