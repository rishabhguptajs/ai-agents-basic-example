import axios from 'axios';

class AIController {
    constructor(weatherModel) {
        this.weatherModel = weatherModel;
        this.OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    }

    async makeAIRequest(messages) {
        return await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: "meta-llama/llama-3.2-1b-instruct:free",
            messages: messages,
            temperature: 0.7,
            max_tokens: 1000
        }, {
            headers: {
                "Authorization": `Bearer ${this.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://localhost:3000",
                "X-Title": "Weather App"
            }
        });
    }

    parseAIResponse(responseContent) {
        const actionMatch = responseContent.match(/ACTION\s*\n({[\s\S]+?})/);
        const outputMatch = responseContent.match(/OUTPUT\s*\n({[\s\S]+?})/);

        if (actionMatch) {
            return JSON.parse(actionMatch[1]);
        } else if (outputMatch) {
            return JSON.parse(outputMatch[1]);
        }
        throw new Error("No valid ACTION or OUTPUT found in response");
    }

    async processWeatherQuery(userQuery, systemPrompt) {
        try {
            let messages = [
                { role: "system", content: systemPrompt },
                { role: "user", content: userQuery }
            ];

            let aiResponse = await this.makeAIRequest(messages);
            let responseContent = aiResponse.data.choices[0].message.content;
            console.log("Initial AI Response: ", responseContent);

            let aiPlan = this.parseAIResponse(responseContent);
            console.log("Initial AI Plan: ", aiPlan);

            while (true) {
                if (aiPlan.type === "action" && aiPlan.function === "getWeatherDetails") {
                    const observation = this.weatherModel.getWeatherDetails(aiPlan.input);

                    messages.push(
                        { role: "assistant", content: responseContent },
                        { role: "system", content: `Observation: ${observation}` }
                    );

                    aiResponse = await this.makeAIRequest(messages);
                    responseContent = aiResponse.data.choices[0].message.content;
                    console.log("Follow-up AI Response: ", responseContent);

                    aiPlan = this.parseAIResponse(responseContent);
                    console.log("Next AI Plan: ", aiPlan);

                } else if (aiPlan.type === "output") {
                    return aiPlan.output;
                } else {
                    throw new Error(`Unsupported AI Plan type: ${aiPlan.type}`);
                }
            }
        } catch (error) {
            console.error("Error occurred:", error.message);
            if (error.response) {
                console.error("API Response Error:", error.response.data);
            }
            throw error;
        }
    }
}

export default AIController; 