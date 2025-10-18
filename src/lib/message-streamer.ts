/**
 * P5: Response Streaming Implementation
 * Progressively delivers long messages in chunks for better UX
 */

interface StreamConfig {
  maxChunkSize: number // Maximum characters per chunk
  delayBetweenChunks: number // Milliseconds between chunks
  minChunkSize: number // Minimum size before chunking
}

export const DEFAULT_STREAM_CONFIG: StreamConfig = {
  maxChunkSize: 400, // WhatsApp comfortable reading length
  delayBetweenChunks: 800, // Human-friendly pace (1 second - processing time)
  minChunkSize: 600 // Only chunk if message exceeds this length
}

/**
 * P5: Intelligently chunk long text into readable segments
 * Breaks at sentence/paragraph boundaries for natural reading
 */
export function chunkMessage(text: string, config: StreamConfig = DEFAULT_STREAM_CONFIG): string[] {
  // If message is short enough, don't chunk
  if (text.length <= config.minChunkSize) {
    return [text]
  }

  const chunks: string[] = []
  let remainingText = text.trim()

  while (remainingText.length > 0) {
    // If remaining text fits in one chunk, add it and finish
    if (remainingText.length <= config.maxChunkSize) {
      chunks.push(remainingText)
      break
    }

    // Find the best break point (paragraph > sentence > word)
    let chunkEnd = config.maxChunkSize
    let breakPoint = findBestBreakPoint(remainingText, chunkEnd)

    // Extract chunk and update remaining text
    const chunk = remainingText.substring(0, breakPoint).trim()
    chunks.push(chunk)
    remainingText = remainingText.substring(breakPoint).trim()
  }

  return chunks
}

/**
 * P5: Find the best natural break point in text
 * Priority: paragraph break > sentence end > comma > space
 */
function findBestBreakPoint(text: string, maxLength: number): number {
  // Search window: from 70% to 100% of maxLength
  const searchStart = Math.floor(maxLength * 0.7)
  const searchEnd = Math.min(maxLength, text.length)
  const searchText = text.substring(searchStart, searchEnd)

  // 1. Look for paragraph break (double newline)
  const paragraphBreak = text.lastIndexOf('\n\n', searchEnd)
  if (paragraphBreak >= searchStart) {
    return paragraphBreak + 2 // Include newlines
  }

  // 2. Look for sentence ending (.!?)
  const sentenceEndings = ['. ', '! ', '? ', '.\n', '!\n', '?\n']
  for (const ending of sentenceEndings) {
    const endingPos = text.lastIndexOf(ending, searchEnd)
    if (endingPos >= searchStart) {
      return endingPos + ending.length
    }
  }

  // 3. Look for comma or semicolon
  const punctuation = [', ', '; ', ',\n', ';\n']
  for (const punct of punctuation) {
    const punctPos = text.lastIndexOf(punct, searchEnd)
    if (punctPos >= searchStart) {
      return punctPos + punct.length
    }
  }

  // 4. Look for space (word boundary)
  const spacePos = text.lastIndexOf(' ', searchEnd)
  if (spacePos >= searchStart) {
    return spacePos + 1
  }

  // 5. Last resort: break at max length
  return maxLength
}

/**
 * P5: Estimate reading time in milliseconds
 * Based on average reading speed of 200-250 words per minute
 */
export function estimateReadingTime(text: string): number {
  const words = text.split(/\s+/).length
  const wordsPerMinute = 225 // Average reading speed
  const readingTimeMs = (words / wordsPerMinute) * 60 * 1000

  // Minimum 500ms, maximum 5s per chunk
  return Math.max(500, Math.min(5000, readingTimeMs))
}

/**
 * P5: Stream message chunks with adaptive delays
 * Uses reading time estimation for natural pacing
 */
export async function streamMessageChunks(
  chunks: string[],
  sendFunction: (chunk: string, isFirst: boolean, isLast: boolean) => Promise<void>,
  config: StreamConfig = DEFAULT_STREAM_CONFIG
): Promise<void> {
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    const isFirst = i === 0
    const isLast = i === chunks.length - 1

    // Send chunk
    await sendFunction(chunk, isFirst, isLast)

    // Wait before next chunk (except after last chunk)
    if (!isLast) {
      // Adaptive delay based on reading time of current chunk
      const readingTime = estimateReadingTime(chunk)
      const adaptiveDelay = Math.min(readingTime * 0.5, config.delayBetweenChunks)

      await sleep(adaptiveDelay)
    }
  }
}

/**
 * P5: Sleep helper for async delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * P5: Add chunk indicators for user clarity
 */
export function addChunkIndicators(chunks: string[]): string[] {
  if (chunks.length === 1) {
    return chunks
  }

  return chunks.map((chunk, index) => {
    const isFirst = index === 0
    const isLast = index === chunks.length - 1

    if (isFirst) {
      return `${chunk}\n\n_(continua...)_`
    } else if (isLast) {
      return `_(continuação)_\n\n${chunk}`
    } else {
      return `_(continuação)_\n\n${chunk}\n\n_(continua...)_`
    }
  })
}

/**
 * P5: Validate message length for WhatsApp limits
 * WhatsApp message limit is 4096 characters
 */
export function validateMessageLength(text: string): {
  valid: boolean
  length: number
  limit: number
  needsChunking: boolean
} {
  const WHATSAPP_LIMIT = 4096
  const length = text.length

  return {
    valid: length <= WHATSAPP_LIMIT,
    length,
    limit: WHATSAPP_LIMIT,
    needsChunking: length > DEFAULT_STREAM_CONFIG.minChunkSize
  }
}
