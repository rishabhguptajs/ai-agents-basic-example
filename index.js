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

    let aiResponse = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
        model: "meta-llama/llama-3.2-1b-instruct:free",
        messages: messages,
    }, {
        headers: {
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json"
        }
    });

    const responseContent = aiResponse.data.choices[0].message.content;
    console.log("AI Response: ", responseContent);

    let aiPlan;
    try {
        const actionMatch = responseContent.match(/ACTION\s*\n({[^}]+})/);
        if (actionMatch && actionMatch[1]) {
            aiPlan = JSON.parse(actionMatch[1]);
        } else {
            console.log("No ACTION found in response");
            return;
        }
    } catch (error) {
        console.error("Failed to parse AI response as JSON:", error);
        return;
    }
    console.log("AI Plan: ", aiPlan);

    while (true) {
        if (aiPlan.type === "action" && aiPlan.function === "getWeatherDetails") {
            const observation = getWeatherDetails(aiPlan.input);

            messages.push(
                { role: "assistant", content: JSON.stringify(aiPlan) },
                { role: "system", content: `Observation: ${observation}` }
            );

            aiResponse = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
                model: "meta-llama/llama-3.2-1b-instruct:free",
                messages: messages
            }, {
                headers: {
                    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json"
                }
            });

            // Parse next action
            const responseContent = aiResponse.data.choices[0].message.content;
            console.log("AI Response: ", responseContent);

            try {
                const actionMatch = responseContent.match(/ACTION\s*\n({[^}]+})/);
                if (actionMatch && actionMatch[1]) {
                    aiPlan = JSON.parse(actionMatch[1]);
                } else {
                    // Try to find OUTPUT if no ACTION is found
                    const outputMatch = responseContent.match(/OUTPUT\s*\n({[^}]+})/);
                    if (outputMatch && outputMatch[1]) {
                        aiPlan = JSON.parse(outputMatch[1]);
                    } else {
                        console.log("No ACTION or OUTPUT found in response");
                        break;
                    }
                }
            } catch (error) {
                console.error("Failed to parse AI response:", error);
                break;
            }
            console.log("AI Plan: ", aiPlan);

        } else if (aiPlan.type === "output") {
            console.log("\nFinal Output:", aiPlan.output);
            break;
        } else {
            console.log("AI Plan not supported: ", aiPlan);
            break;
        }
    }
}

main();