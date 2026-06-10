// Strip punctuation and whitespace, keep Chinese chars and digits/letters
export function normalize(text: string): string {
  return text.replace(/[\s\p{P}「」『』【】《》〈〉・～—…、·""''：；，。！？\n]/gu, '')
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
}

export function compareText(userInput: string, originalText: string): DiffResult {
  const sentences = splitSentences(originalText)
  const normInput = normalize(userInput)
  const normOriginal = normalize(originalText)

  // Diff entire texts at once — avoids per-sentence misalignment when chars are omitted
  const fullDiff = diffNormalized(normInput, normOriginal)
  let diffIdx = 0

  const sentenceResults: SentenceResult[] = sentences.map(sent => {
    const annotated: SentenceResult['annotated'] = []

    for (const ch of sent) {
      const isPunct = normalize(ch) === ''
      // Flush any 'extra' chars from user that appear before this position
      while (diffIdx < fullDiff.length && fullDiff[diffIdx].type === 'extra') {
        annotated.push(fullDiff[diffIdx++])
      }
      if (isPunct) {
        annotated.push({ char: ch, type: 'punct' })
      } else {
        // Consume the 'ok' or 'missing' item for this original char
        if (diffIdx < fullDiff.length) {
          const d = fullDiff[diffIdx++]
          annotated.push({ char: ch, type: d.type as 'ok' | 'missing' })
        } else {
          annotated.push({ char: ch, type: 'missing' })
        }
      }
    }

    const isCorrect = annotated.every(a => a.type === 'ok' || a.type === 'punct')
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
  }
}

// Compare reference strings (book + chapter:verse), ignoring spaces and punctuation
export function compareReference(userInput: string, original: string): boolean {
  const norm = (s: string) => s.replace(/[\s:：\-–；;]/g, '').trim()
  return norm(userInput) === norm(original)
}
