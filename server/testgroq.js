const Groq = require('groq-sdk')
require('dotenv').config()

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

async function test() {
  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: 'Say hello in one word' }],
    model: 'llama-3.3-70b-versatile',
    max_tokens: 10
  })
  console.log('SUCCESS:', completion.choices[0]?.message?.content)
}

test().catch(console.error)