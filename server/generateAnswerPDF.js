/**
 * DRIVE — Complete Answer PDF Generator
 * Run: node generateAnswerPDFs.js
 * Output: server/answer_pdfs/ folder
 * Generates one PDF per company with ALL questions and answers
 */

const mongoose = require('mongoose')
const fs = require('fs')
const path = require('path')
require('dotenv').config()

// ── Models ────────────────────────────────────────────────────────────────────
const QuestionSchema = new mongoose.Schema({
  text: String, options: [String], answer: Number,
  type: String, topic: String, difficulty: String, companies: [String]
})
const CodingProblemSchema = new mongoose.Schema({
  title: String, description: String,
  examples: [{ input: String, output: String, explanation: String }],
  testCases: [{ input: String, expectedOutput: String }],
  difficulty: String, topic: String, companies: [String],
  starterCode: { python: String, javascript: String, java: String, cpp: String }
})
const CompanySchema = new mongoose.Schema({
  name: String, logo: String, difficulty: String,
  rounds: [{ name: String, type: String, duration_mins: Number, num_questions: Number, cutoff_pct: Number }],
  tags: [String], hidden: Boolean
})

const Question = mongoose.model('Question', QuestionSchema)
const CodingProblem = mongoose.model('CodingProblem', CodingProblemSchema)
const Company = mongoose.model('Company', CompanySchema)

// ── Coding solutions ──────────────────────────────────────────────────────────
const CODING_SOLUTIONS = {
  'Sum of Two Numbers': {
    python: 'def solve(a, b):\n    return a + b\n\na, b = map(int, input().split())\nprint(solve(a, b))',
    javascript: 'process.stdin.resume();\nprocess.stdin.setEncoding("utf8");\nlet input = "";\nprocess.stdin.on("data", d => input += d);\nprocess.stdin.on("end", () => {\n    const [a, b] = input.trim().split(" ").map(Number);\n    console.log(a + b);\n});',
    java: 'import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        System.out.println(sc.nextInt() + sc.nextInt());\n    }\n}',
    approach: 'Direct addition. Time: O(1), Space: O(1).'
  },
  'Reverse a String': {
    python: 'def solve(s):\n    return s[::-1]\n\ns = input().strip()\nprint(solve(s))',
    javascript: 'process.stdin.resume();\nprocess.stdin.setEncoding("utf8");\nlet input = "";\nprocess.stdin.on("data", d => input += d);\nprocess.stdin.on("end", () => {\n    console.log(input.trim().split("").reverse().join(""));\n});',
    java: 'import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        System.out.println(new StringBuilder(sc.nextLine().trim()).reverse());\n    }\n}',
    approach: 'Python slicing s[::-1] reverses in one line. Time: O(n), Space: O(n).'
  },
  'Find Maximum Element': {
    python: 'def solve(arr):\n    return max(arr)\n\nn = int(input())\narr = list(map(int, input().split()))\nprint(solve(arr))',
    javascript: 'process.stdin.resume();\nprocess.stdin.setEncoding("utf8");\nlet input = "";\nprocess.stdin.on("data", d => input += d);\nprocess.stdin.on("end", () => {\n    const lines = input.trim().split("\\n");\n    const arr = lines[1].split(" ").map(Number);\n    console.log(Math.max(...arr));\n});',
    java: 'import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int max = Integer.MIN_VALUE;\n        for(int i=0;i<n;i++) { int x=sc.nextInt(); if(x>max) max=x; }\n        System.out.println(max);\n    }\n}',
    approach: 'Linear scan through array. Time: O(n), Space: O(1).'
  },
  'Count Vowels in String': {
    python: 'def solve(s):\n    return sum(1 for c in s.lower() if c in "aeiou")\n\ns = input().strip()\nprint(solve(s))',
    javascript: 'process.stdin.resume();\nprocess.stdin.setEncoding("utf8");\nlet input = "";\nprocess.stdin.on("data", d => input += d);\nprocess.stdin.on("end", () => {\n    const s = input.trim();\n    console.log([...s].filter(c => "aeiou".includes(c.toLowerCase())).length);\n});',
    java: 'import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String s = sc.nextLine().trim().toLowerCase();\n        int count = 0;\n        for(char c : s.toCharArray()) if("aeiou".indexOf(c)>=0) count++;\n        System.out.println(count);\n    }\n}',
    approach: 'Check each character against vowel set. Time: O(n), Space: O(1).'
  },
  'Check Palindrome': {
    python: 'def solve(s):\n    return "YES" if s == s[::-1] else "NO"\n\ns = input().strip()\nprint(solve(s))',
    javascript: 'process.stdin.resume();\nprocess.stdin.setEncoding("utf8");\nlet input = "";\nprocess.stdin.on("data", d => input += d);\nprocess.stdin.on("end", () => {\n    const s = input.trim();\n    console.log(s === s.split("").reverse().join("") ? "YES" : "NO");\n});',
    java: 'import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String s = sc.nextLine().trim();\n        String r = new StringBuilder(s).reverse().toString();\n        System.out.println(s.equals(r) ? "YES" : "NO");\n    }\n}',
    approach: 'Compare string with its reverse. Time: O(n), Space: O(n).'
  },
  'FizzBuzz': {
    python: 'n = int(input())\nfor i in range(1, n+1):\n    if i%15==0: print("FizzBuzz")\n    elif i%3==0: print("Fizz")\n    elif i%5==0: print("Buzz")\n    else: print(i)',
    javascript: 'process.stdin.resume();\nprocess.stdin.setEncoding("utf8");\nlet input = "";\nprocess.stdin.on("data", d => input += d);\nprocess.stdin.on("end", () => {\n    const n = parseInt(input.trim());\n    for(let i=1;i<=n;i++) {\n        if(i%15===0) console.log("FizzBuzz");\n        else if(i%3===0) console.log("Fizz");\n        else if(i%5===0) console.log("Buzz");\n        else console.log(i);\n    }\n});',
    java: 'import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        for(int i=1;i<=n;i++) {\n            if(i%15==0) System.out.println("FizzBuzz");\n            else if(i%3==0) System.out.println("Fizz");\n            else if(i%5==0) System.out.println("Buzz");\n            else System.out.println(i);\n        }\n    }\n}',
    approach: 'Check divisibility by 15 first, then 3, then 5. Time: O(n).'
  },
  'Two Sum': {
    python: 'n = int(input())\narr = list(map(int, input().split()))\ntarget = int(input())\nseen = {}\nfor i, num in enumerate(arr):\n    if target-num in seen:\n        print(seen[target-num], i)\n        break\n    seen[num] = i',
    javascript: 'process.stdin.resume();\nprocess.stdin.setEncoding("utf8");\nlet input = "";\nprocess.stdin.on("data", d => input += d);\nprocess.stdin.on("end", () => {\n    const lines = input.trim().split("\\n");\n    const arr = lines[1].split(" ").map(Number);\n    const target = parseInt(lines[2]);\n    const seen = {};\n    for(let i=0;i<arr.length;i++) {\n        if(seen[target-arr[i]] !== undefined) { console.log(seen[target-arr[i]]+" "+i); break; }\n        seen[arr[i]] = i;\n    }\n});',
    java: 'import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for(int i=0;i<n;i++) arr[i]=sc.nextInt();\n        int target = sc.nextInt();\n        Map<Integer,Integer> seen = new HashMap<>();\n        for(int i=0;i<n;i++) {\n            if(seen.containsKey(target-arr[i])) { System.out.println(seen.get(target-arr[i])+" "+i); return; }\n            seen.put(arr[i],i);\n        }\n    }\n}',
    approach: 'HashMap stores each number and its index. For each element check if complement exists. Time: O(n), Space: O(n).'
  },
  'Fibonacci Series': {
    python: 'n = int(input())\na, b = 0, 1\nresult = []\nfor _ in range(n):\n    result.append(str(a))\n    a, b = b, a+b\nprint(" ".join(result))',
    javascript: 'process.stdin.resume();\nprocess.stdin.setEncoding("utf8");\nlet input = "";\nprocess.stdin.on("data", d => input += d);\nprocess.stdin.on("end", () => {\n    const n = parseInt(input.trim());\n    let a=0,b=1,result=[];\n    for(let i=0;i<n;i++) { result.push(a); [a,b]=[b,a+b]; }\n    console.log(result.join(" "));\n});',
    java: 'import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        long a=0,b=1;\n        StringBuilder sb = new StringBuilder();\n        for(int i=0;i<n;i++) { if(i>0) sb.append(" "); sb.append(a); long t=a+b; a=b; b=t; }\n        System.out.println(sb);\n    }\n}',
    approach: 'Two variables track consecutive values. Time: O(n), Space: O(n).'
  }
}

// ── Section colors ────────────────────────────────────────────────────────────
const COLORS = {
  aptitude:  { header: [44, 44, 138], light: [240, 240, 255] },
  technical: { header: [92, 45, 138], light: [245, 240, 255] },
  coding:    { header: [26, 110, 60],  light: [240, 255, 240] },
  hr:        { header: [138, 44, 44],  light: [255, 240, 240] }
}

// ── Simple PDF writer (pure Node.js, no external lib needed) ──────────────────
// We use PDFKit which you already installed
let PDFDocument
try {
  PDFDocument = require('pdfkit')
} catch(e) {
  console.error('PDFKit not found. Run: npm install pdfkit')
  process.exit(1)
}

// ── Draw helpers ──────────────────────────────────────────────────────────────
function rgb(arr) { return arr.map(v => v/255) }

function sectionHeader(doc, title, type) {
  const col = COLORS[type]?.header || [50,50,50]
  doc.save()
  doc.rect(40, doc.y, doc.page.width - 80, 34)
     .fill(`rgb(${col[0]},${col[1]},${col[2]})`)
  doc.fillColor('white').fontSize(13).font('Helvetica-Bold')
  doc.text(`  ${title}`, 50, doc.y - 26, { width: doc.page.width - 100 })
  doc.restore()
  doc.moveDown(1)
}

function drawQuestion(doc, num, qtext, options, correctIdx, explanation, type, studentIdx) {
  if (doc.y > doc.page.height - 180) doc.addPage()

  const bgCol = COLORS[type]?.light || [249,249,249]

  // Question text
  doc.fillColor('#1a1a2e').fontSize(11).font('Helvetica-Bold')
  doc.text(`Q${num}. ${qtext}`, 40, doc.y, { width: doc.page.width - 80 })
  doc.moveDown(0.4)

  // Options
  const labels = ['A', 'B', 'C', 'D']
  options.forEach((opt, i) => {
    const isCorrect = i === correctIdx
    const isStudent = studentIdx !== undefined && i === studentIdx
    let prefix = '     '
    let color = '#444444'
    let font = 'Helvetica'

    if (isCorrect) {
      prefix = '  ✓  '
      color = '#006400'
      font = 'Helvetica-Bold'
    } else if (isStudent && !isCorrect) {
      prefix = '  ✗  '
      color = '#cc0000'
      font = 'Helvetica-Bold'
    }

    doc.font(font).fontSize(10).fillColor(color)
    doc.text(`${prefix}${labels[i]}) ${opt}`, 52, doc.y, { width: doc.page.width - 100 })
  })

  doc.moveDown(0.3)

  // Correct answer line
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#006400')
  doc.text(`  Correct Answer: ${labels[correctIdx]}) ${options[correctIdx]}`, 52, doc.y, { width: doc.page.width - 100 })
  doc.moveDown(0.2)

  // Explanation box
  const expY = doc.y
  const expText = `Explanation: ${explanation}`
  const expHeight = Math.ceil(expText.length / 90) * 14 + 10
  doc.save()
  doc.rect(52, expY, doc.page.width - 104, expHeight)
     .fill(`rgb(${bgCol[0]},${bgCol[1]},${bgCol[2]})`)
  doc.restore()
  doc.font('Helvetica').fontSize(9.5).fillColor('#444444')
  doc.text(expText, 58, expY + 5, { width: doc.page.width - 118 })
  doc.moveDown(0.8)

  // Divider
  doc.save()
  doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y)
     .strokeColor('#dddddd').lineWidth(0.5).stroke()
  doc.restore()
  doc.moveDown(0.5)
}

function drawCodingProblem(doc, num, problem) {
  if (doc.y > doc.page.height - 220) doc.addPage()

  // Title
  doc.fillColor('#1a1a2e').fontSize(12).font('Helvetica-Bold')
  doc.text(`Problem ${num}: ${problem.title}`, 40, doc.y, { width: doc.page.width - 80 })
  doc.moveDown(0.3)

  // Difficulty badge
  const diffColor = problem.difficulty === 'easy' ? '#006400' :
                    problem.difficulty === 'medium' ? '#cc8800' : '#cc0000'
  doc.font('Helvetica-Bold').fontSize(9).fillColor(diffColor)
  doc.text(`[${(problem.difficulty || 'easy').toUpperCase()}]  Topic: ${problem.topic || 'general'}`, 52, doc.y)
  doc.moveDown(0.3)

  // Description
  doc.font('Helvetica').fontSize(10).fillColor('#333333')
  doc.text(problem.description, 52, doc.y, { width: doc.page.width - 100 })
  doc.moveDown(0.3)

  // Examples
  if (problem.examples && problem.examples.length > 0) {
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#555555')
    doc.text('Examples:', 52, doc.y)
    doc.moveDown(0.2)
    problem.examples.forEach(ex => {
      doc.font('Courier').fontSize(9).fillColor('#333333')
      doc.text(`  Input:  ${ex.input}`, 60, doc.y, { width: doc.page.width - 120 })
      doc.text(`  Output: ${ex.output}`, 60, doc.y, { width: doc.page.width - 120 })
      if (ex.explanation) {
        doc.font('Helvetica').fontSize(9).fillColor('#666666')
        doc.text(`  Note: ${ex.explanation}`, 60, doc.y, { width: doc.page.width - 120 })
      }
      doc.moveDown(0.2)
    })
  }

  // Test cases
  if (problem.testCases && problem.testCases.length > 0) {
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#555555')
    doc.text('Test Cases:', 52, doc.y)
    doc.moveDown(0.1)
    doc.font('Courier').fontSize(9).fillColor('#555555')
    problem.testCases.forEach((tc, i) => {
      doc.text(`  Case ${i+1}: Input="${tc.input}"  →  Expected="${tc.expectedOutput}"`, 60, doc.y, { width: doc.page.width - 120 })
    })
    doc.moveDown(0.3)
  }

  // Solution
  const sol = CODING_SOLUTIONS[problem.title]
  if (sol) {
    // Python solution
    drawCodeBlock(doc, 'Python Solution', sol.python, '#1a6e3c')
    doc.moveDown(0.2)

    // JavaScript solution
    drawCodeBlock(doc, 'JavaScript Solution', sol.javascript, '#cc6600')
    doc.moveDown(0.2)

    // Java solution
    if (sol.java) {
      drawCodeBlock(doc, 'Java Solution', sol.java, '#0055aa')
      doc.moveDown(0.2)
    }

    // Approach
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#444444')
    doc.text('Approach & Complexity:', 52, doc.y)
    doc.font('Helvetica').fontSize(9.5).fillColor('#444444')
    doc.text(sol.approach, 52, doc.y, { width: doc.page.width - 100 })
    doc.moveDown(0.4)
  } else {
    doc.font('Helvetica').fontSize(10).fillColor('#888888')
    doc.text('Solution: Write your own solution using the examples and test cases above.', 52, doc.y, { width: doc.page.width - 100 })
    doc.moveDown(0.3)
  }

  // Section divider
  doc.save()
  doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y)
     .strokeColor('#aaaaaa').lineWidth(1).stroke()
  doc.restore()
  doc.moveDown(0.7)
}

function drawCodeBlock(doc, label, code, labelColor) {
  if (doc.y > doc.page.height - 100) doc.addPage()

  doc.font('Helvetica-Bold').fontSize(10).fillColor(labelColor)
  doc.text(label + ':', 52, doc.y)
  doc.moveDown(0.2)

  const lines = code.split('\n')
  const boxH = lines.length * 13 + 10

  if (doc.y + boxH > doc.page.height - 60) doc.addPage()

  const codeY = doc.y
  doc.save()
  doc.rect(52, codeY, doc.page.width - 104, boxH).fill('#f5f5f5')
  doc.restore()

  doc.font('Courier').fontSize(8.5).fillColor('#1a1a2e')
  let lineY = codeY + 6
  lines.forEach(line => {
    doc.text(line || ' ', 60, lineY, { width: doc.page.width - 126, lineBreak: false })
    lineY += 13
  })
  doc.y = codeY + boxH + 4
}

// ── Generate one company PDF ──────────────────────────────────────────────────
async function generatePDF(company, questions, codingProblems, outputDir) {
  const companyKey = company.name.toLowerCase()

  // Filter questions for this company only
  const aptitudeQs = questions.filter(q => q.type === 'aptitude' && q.companies.includes(companyKey))
  const technicalQs = questions.filter(q => q.type === 'technical' && q.companies.includes(companyKey))
  const hrQs = questions.filter(q => q.type === 'hr' && q.companies.includes(companyKey))
  const codingProbs = codingProblems.filter(p => p.companies.includes(companyKey))

  const filename = path.join(outputDir, `${company.name}_Answer_Key.pdf`)
  const doc = new PDFDocument({ margin: 40, size: 'A4' })
  const stream = fs.createWriteStream(filename)
  doc.pipe(stream)

  // ── Cover Page ────────────────────────────────────────────────────────────
  doc.rect(0, 0, doc.page.width, doc.page.height).fill('#1a1a2e')

  // Company name
  doc.fillColor('white').fontSize(38).font('Helvetica-Bold')
  doc.text(company.name, 40, 130, { align: 'center' })

  // Subtitle
  doc.fillColor('#aaaaff').fontSize(15).font('Helvetica')
  doc.text('Complete Answer Key — All Rounds', 40, 185, { align: 'center' })

  doc.fillColor('#888888').fontSize(11)
  doc.text('DRIVE — Placement Rehearsal Interview Virtual Environment', 40, 212, { align: 'center' })

  // Info box
  doc.save()
  doc.roundedRect(80, 260, doc.page.width - 160, 170, 10).fill('#2c2c5a')
  doc.restore()

  doc.fillColor('white').fontSize(13).font('Helvetica-Bold')
  doc.text('Contents', 100, 278, { align: 'center', width: doc.page.width - 200 })

  const contents = [
    { label: 'Aptitude Round', count: aptitudeQs.length, color: '#8888ff' },
    { label: 'Technical Round', count: technicalQs.length, color: '#cc88ff' },
    { label: 'Coding Round', count: codingProbs.length, color: '#88ffaa' },
    { label: 'HR Round', count: hrQs.length, color: '#ff8888' }
  ]

  contents.forEach((c, i) => {
    doc.fillColor(c.color).fontSize(11).font('Helvetica')
    doc.text(`• ${c.label}: ${c.count} ${c.label.includes('Coding') ? 'Problems' : 'Questions'}`,
      100, 305 + i * 22, { width: doc.page.width - 200 })
  })

  const totalQ = aptitudeQs.length + technicalQs.length + hrQs.length + codingProbs.length
  doc.fillColor('#888888').fontSize(10)
  doc.text(`Total: ${totalQ} items | Difficulty: ${(company.difficulty || 'medium').toUpperCase()} | Rounds: ${company.rounds?.length || 0}`,
    40, 430, { align: 'center' })

  doc.fillColor('#666666').fontSize(9)
  doc.text('Each question includes the correct answer, all options marked, and a detailed explanation.',
    40, 460, { align: 'center', width: doc.page.width - 80 })

  doc.addPage()

  // ── Aptitude Round ──────────────────────────────────────────────────────────
  if (aptitudeQs.length > 0) {
    sectionHeader(doc, `APTITUDE ROUND  —  ${aptitudeQs.length} Questions`, 'aptitude')

    aptitudeQs.forEach((q, i) => {
      const explanation = `This tests ${q.topic} skills. Difficulty: ${q.difficulty}. ` +
        `The correct answer is "${q.options[q.answer]}".`
      drawQuestion(doc, i + 1, q.text, q.options, q.answer, explanation, 'aptitude')
    })

    doc.addPage()
  }

  // ── Technical Round ─────────────────────────────────────────────────────────
  if (technicalQs.length > 0) {
    sectionHeader(doc, `TECHNICAL ROUND  —  ${technicalQs.length} Questions`, 'technical')

    technicalQs.forEach((q, i) => {
      const explanation = `Topic: ${q.topic} | Difficulty: ${q.difficulty}. ` +
        `The correct answer is "${q.options[q.answer]}".`
      drawQuestion(doc, i + 1, q.text, q.options, q.answer, explanation, 'technical')
    })

    doc.addPage()
  }

  // ── Coding Round ────────────────────────────────────────────────────────────
  if (codingProbs.length > 0) {
    sectionHeader(doc, `CODING ROUND  —  ${codingProbs.length} Problems  (Python · JavaScript · Java solutions)`, 'coding')

    codingProbs.forEach((p, i) => {
      drawCodingProblem(doc, i + 1, p)
    })

    doc.addPage()
  }

  // ── HR Round ────────────────────────────────────────────────────────────────
  if (hrQs.length > 0) {
    sectionHeader(doc, `HR ROUND  —  ${hrQs.length} Questions`, 'hr')

    hrQs.forEach((q, i) => {
      const explanation = `Best professional answer for ${company.name} culture. ` +
        `Topic: ${q.topic}. The ideal response is "${q.options[q.answer]}" because it demonstrates ` +
        `the right professional attitude and aligns with ${company.name}'s values.`
      drawQuestion(doc, i + 1, q.text, q.options, q.answer, explanation, 'hr')
    })
  }

  // End
  doc.end()

  return new Promise((resolve, reject) => {
    stream.on('finish', () => {
      const total = aptitudeQs.length + technicalQs.length + hrQs.length + codingProbs.length
      console.log(`  ✅ ${company.name.padEnd(15)} | Apt:${String(aptitudeQs.length).padStart(2)} Tech:${String(technicalQs.length).padStart(2)} Code:${String(codingProbs.length).padStart(2)} HR:${String(hrQs.length).padStart(2)} | Total: ${total} items → ${path.basename(filename)}`)
      resolve()
    })
    stream.on('error', reject)
  })
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('✅ Connected to MongoDB\n')

    const companies = await Company.find({})
    const questions = await Question.find({})
    const codingProblems = await CodingProblem.find({})

    console.log(`📊 Found: ${companies.length} companies, ${questions.length} questions, ${codingProblems.length} coding problems\n`)

    // Create output directory
    const outputDir = path.join(__dirname, 'answer_pdfs')
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir)

    console.log(`📄 Generating PDFs...\n`)
    console.log(`${'Company'.padEnd(17)} | Apt  Tech Code  HR | Total`)
    console.log(`${'─'.repeat(55)}`)

    // Generate visible companies first, then hidden
    const visible = companies.filter(c => !c.hidden)
    const hidden = companies.filter(c => c.hidden)
    const ordered = [...visible, ...hidden]

    for (const company of ordered) {
      await generatePDF(company, questions, codingProblems, outputDir)
    }

    console.log(`\n${'─'.repeat(55)}`)
    console.log(`\n✅ All ${companies.length} PDFs saved to: server/answer_pdfs/`)
    console.log(`\n📁 Files:`)
    fs.readdirSync(outputDir).forEach(f => {
      const size = (fs.statSync(path.join(outputDir, f)).size / 1024).toFixed(0)
      console.log(`   ${f.padEnd(40)} ${size} KB`)
    })

  } catch (err) {
    console.error('Error:', err.message)
  } finally {
    mongoose.connection.close()
  }
}

main()