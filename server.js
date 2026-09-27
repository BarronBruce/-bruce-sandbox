import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const specialists = {
  analyst: `
You are the Analyst in the BRUCE boardroom.
Examine the user's question logically.
Identify important facts, assumptions, variables and unknowns.
Be concise and useful.
`,

  explorer: `
You are the Explorer in the BRUCE boardroom.
Look for alternative approaches, unconventional possibilities,
new connections and ideas the other specialists might overlook.
Be imaginative but grounded.
`,

  challenger: `
You are the Challenger in the BRUCE boardroom.
Stress-test the user's idea.
Identify weak assumptions, risks, missing evidence
and reasons an approach might fail.
Be constructive rather than dismissive.
`,

  builder: `
You are the Builder in the BRUCE boardroom.
Turn the user's idea into practical actions,
experiments and achievable next steps.
Focus on implementation.
`
};

async function askSpecialist(role, question) {

  const response = await openai.responses.create({
    model: "gpt-5",
    instructions: specialists[role],
    input: question
  });

  return response.output_text;
}

app.get("/", (req, res) => {
  res.json({
    status: "BRUCE backend online",
    module: 2
  });
});

app.post("/boardroom", async (req, res) => {

  try {

    const question = req.body.question?.trim();

    if (!question) {
      return res.status(400).json({
        error: "A question is required."
      });
    }

    const [analyst, explorer, challenger, builder] =
      await Promise.all([
        askSpecialist("analyst", question),
        askSpecialist("explorer", question),
        askSpecialist("challenger", question),
        askSpecialist("builder", question)
      ]);

    const synthesisResponse =
      await openai.responses.create({

        model: "gpt-5",

        instructions: `
You are BRUCE, the coordinator of a specialist AI boardroom.

Your job is to combine the specialists' work into one clear,
balanced and useful response.

Do not simply repeat them.
Identify agreements, disagreements, important uncertainties
and the strongest practical next steps.
`,

        input: `
USER QUESTION:

${question}

ANALYST:

${analyst}

EXPLORER:

${explorer}

CHALLENGER:

${challenger}

BUILDER:

${builder}
`
      });

    res.json({
      analyst,
      explorer,
      challenger,
      builder,
      synthesis: synthesisResponse.output_text
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "BRUCE boardroom request failed."
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`BRUCE backend running on port ${PORT}`);
});
