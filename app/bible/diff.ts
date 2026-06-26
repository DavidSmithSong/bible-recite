export function normalize(text: string, lang: 'zh' | 'en' = 'zh'): string {
  if (lang === 'en') {
    return text
      .toLowerCase()
      .replace(/[\p{P}「」『』【】《》〈〉・～—…、·""''：；，。！？]/gu, '')
      .replace(/\s+/g, ' ')
      .trim()
  }
  return text.replace(/[\s\n]/g, '')
}

// Split original text into sentences by sentence-ending punctuation
export function splitSentences(text: string): string[] {
  const parts: string[] = []
  let cur = ''
  for (const ch of text) {
    cur += ch
    if ('。！？'.includes(ch)) {
      parts.push(cur)
      cur = ''
    }
  }
  if (cur.trim()) parts.push(cur)
  return parts
}

type DiffChar = { char: string; type: 'ok' | 'missing' | 'extra' }

function lcsMatrix(a: string, b: string): number[][] {
  const m = a.length, n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1])
    }
  }
  return dp
}

// Returns diff of input vs original (normalized strings)
// 'ok'=both, 'missing'=original only, 'extra'=input only
function diffNormalized(input: string, original: string): DiffChar[] {
  const dp = lcsMatrix(input, original)
  const result: DiffChar[] = []
  let i = input.length, j = original.length
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && input[i - 1] === original[j - 1]) {
      result.unshift({ char: input[i - 1], type: 'ok' })
      i--; j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ char: original[j - 1], type: 'missing' })
      j--
    } else {
      result.unshift({ char: input[i - 1], type: 'extra' })
      i--
    }
  }
  return result
}

export interface SentenceResult {
  original: string
  isCorrect: boolean
  annotated: Array<{ char: string; type: 'ok' | 'missing' | 'extra' | 'punct' }>
}

export interface DiffResult {
  sentences: SentenceResult[]
  allCorrect: boolean
  aligned: AlignedChar[]
}

export interface AlignedChar {
  inputChar: string | null
  originalChar: string | null
  type: 'ok' | 'mismatch' | 'missing' | 'extra'
}

function alignDiff(diff: DiffChar[]): AlignedChar[] {
  const aligned: AlignedChar[] = []
  let index = 0

  while (index < diff.length) {
    const item = diff[index]
    if (item.type === 'ok') {
      aligned.push({ inputChar: item.char, originalChar: item.char, type: 'ok' })
      index += 1
      continue
    }

    const extras: string[] = []
    const missings: string[] = []
    while (index < diff.length && diff[index].type !== 'ok') {
      if (diff[index].type === 'extra') extras.push(diff[index].char)
      if (diff[index].type === 'missing') missings.push(diff[index].char)
      index += 1
    }

    const length = Math.max(extras.length, missings.length)
    for (let i = 0; i < length; i++) {
      const inputChar = extras[i] ?? null
      const originalChar = missings[i] ?? null
      aligned.push({
        inputChar,
        originalChar,
        type: inputChar && originalChar ? 'mismatch' : inputChar ? 'extra' : 'missing',
      })
    }
  }

  return aligned
}

export function compareText(userInput: string, originalText: string, lang: 'zh' | 'en' = 'zh'): DiffResult {
  const normInput = normalize(userInput, lang)
  const normOriginal = normalize(originalText, lang)
  const fullDiff = diffNormalized(normInput, normOriginal)

  if (lang === 'en') {
    const isCorrect = fullDiff.every(item => {
      const isPunct = /[\p{P}「」『』【】《》〈〉・～—…、·""''：；，。！？]/u.test(item.char)
      return item.type === 'ok' || isPunct
    })
    return {
      sentences: [{ original: originalText, isCorrect, annotated: [] }],
      allCorrect: isCorrect,
      aligned: alignDiff(fullDiff),
    }
  }

  const sentences = splitSentences(originalText)
  let diffIdx = 0

  const sentenceResults: SentenceResult[] = sentences.map(sent => {
    const annotated: SentenceResult['annotated'] = []

    for (const ch of sent) {
      const isPunct = /[\p{P}「」『』【】《》〈〉・～—…、·""''：；，。！？]/u.test(ch)
      // Flush any 'extra' chars from user that appear before this position
      while (diffIdx < fullDiff.length && fullDiff[diffIdx].type === 'extra') {
        annotated.push(fullDiff[diffIdx++])
      }
      
      // Directly consume the fullDiff item (which now includes punctuation)
      if (diffIdx < fullDiff.length) {
        const d = fullDiff[diffIdx++]
        annotated.push({ char: ch, type: d.type as 'ok' | 'missing' })
      } else {
        annotated.push({ char: ch, type: 'missing' })
      }
    }

    const isCorrect = annotated.every(a => {
      const isCharPunct = /[\p{P}「」『』【】《》〈〉・～—…、·""''：；，。！？]/u.test(a.char)
      return a.type === 'ok' || isCharPunct
    })
    return { original: sent, isCorrect, annotated }
  })

  // Flush any trailing extras onto the last sentence
  while (diffIdx < fullDiff.length && sentenceResults.length > 0) {
    if (fullDiff[diffIdx].type === 'extra') {
      sentenceResults[sentenceResults.length - 1].annotated.push(fullDiff[diffIdx])
    }
    diffIdx++
  }

  return {
    sentences: sentenceResults,
    allCorrect: sentenceResults.every(s => s.isCorrect),
    aligned: alignDiff(fullDiff),
  }
}

// Compare reference strings (book + chapter:verse), ignoring spaces and punctuation
export function compareReference(userInput: string, original: string): boolean {
  const norm = (s: string) => s.replace(/[\s:：\-–；;]/g, '').trim()
  return norm(userInput) === norm(original)
}
