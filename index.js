import axios from 'axios';
import dotenv from 'dotenv';
import { SYSTEM_PROMPT as PROMPT } from "./utils/prompt.js";
import { getWeatherDetails } from "./utils/functions.js";

dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const SYSTEM_PROMPT = PROMPT;

async function main() {
    const userQuery = "What is the sum of weather in patiala and delhi?";

    // Initial system and user messages
    let messages = [
        {
            role: "system",
            content: SYSTEM_PROMPT
        },
        {
            role: "user",
            content: userQuery
        }
    ];

    try {
        // Initial API call
        let aiResponse = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: "meta-llama/llama-3.2-1b-instruct:free",
            messages: messages,
            temperature: 0.7, // Add temperature for more focused responses
            max_tokens: 1000  // Ensure enough tokens for complete response
        }, {
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://localhost:3000", // Add referer header
                "X-Title": "Weather App"  // Add title header
            }
        });

        let responseContent = aiResponse.data.choices[0].message.content;
        console.log("Initial AI Response: ", responseContent);

        // Parse initial action
        let aiPlan;
        const actionMatch = responseContent.match(/ACTION\s*\n({[\s\S]+?})/);
        if (!actionMatch) {
            throw new Error("No valid ACTION found in initial response");
        }
        aiPlan = JSON.parse(actionMatch[1]);
        console.log("Initial AI Plan: ", aiPlan);

        // Main interaction loop
        while (true) {
            if (aiPlan.type === "action" && aiPlan.function === "getWeatherDetails") {
                // Get weather observation
                const observation = await getWeatherDetails(aiPlan.input);
                
                // Add interaction to message history
                messages.push(
                    { role: "assistant", content: responseContent },
                    { role: "system", content: `Observation: ${JSON.stringify(observation)}` }
                );

                // Make next API call
                aiResponse = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
                    model: "meta-llama/llama-3.2-1b-instruct:free",
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 1000
                }, {
                    headers: {
                        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                        "Content-Type": "application/json",
                        "HTTP-Referer": "https://localhost:3000",
                        "X-Title": "Weather App"
                    }
                });

                responseContent = aiResponse.data.choices[0].message.content;
                console.log("Follow-up AI Response: ", responseContent);

                // Parse next action/output
                const nextActionMatch = responseContent.match(/ACTION\s*\n({[\s\S]+?})/);
                const outputMatch = responseContent.match(/OUTPUT\s*\n({[\s\S]+?})/);
                
                if (nextActionMatch) {
                    aiPlan = JSON.parse(nextActionMatch[1]);
                } else if (outputMatch) {
                    aiPlan = JSON.parse(outputMatch[1]);
                } else {
                    throw new Error("No valid ACTION or OUTPUT found in response");
                }
                console.log("Next AI Plan: ", aiPlan);

            } else if (aiPlan.type === "output") {
                console.log("\nFinal Output:", aiPlan.output);
                break;
            } else {
                throw new Error(`Unsupported AI Plan type: ${aiPlan.type}`);
            }
        }
    } catch (error) {
        console.error("Error occurred:", error.message);
        if (error.response) {
            console.error("API Response Error:", error.response.data);
        }
    }
}

main();