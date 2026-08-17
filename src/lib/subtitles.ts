export interface SubtitleCue {
  id?: string;
  start: number; // in seconds
  end: number; // in seconds
  text: string;
}

/**
 * Parses WebVTT or SRT text into an array of timestamped cues.
 */
export function parseVttOrSrt(content: string): SubtitleCue[] {
  if (!content || !content.trim()) return [];

  const clean = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = clean.split('\n');
  const cues: SubtitleCue[] = [];

  let currentStart = -1;
  let currentEnd = -1;
  let currentText: string[] = [];

  const timeRegex = /(?:(\d{1,2}):)?(\d{2}):(\d{2})[.,](\d{3})\s*-->\s*(?:(\d{1,2}):)?(\d{2}):(\d{2})[.,](\d{3})/;

  const parseTime = (hStr?: string, mStr?: string, sStr?: string, msStr?: string) => {
    const hours = hStr ? parseInt(hStr, 10) : 0;
    const minutes = mStr ? parseInt(mStr, 10) : 0;
    const seconds = sStr ? parseInt(sStr, 10) : 0;
    const ms = msStr ? parseInt(msStr, 10) : 0;
    return hours * 3600 + minutes * 60 + seconds + ms / 1000;
  };

  const flushCue = () => {
    if (currentStart >= 0 && currentEnd > currentStart && currentText.length > 0) {
      cues.push({
        start: currentStart,
        end: currentEnd,
        text: currentText.join('\n').replace(/<[^>]*>/g, '').trim()
      });
    }
    currentStart = -1;
    currentEnd = -1;
    currentText = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      flushCue();
      continue;
    }

    if (line === 'WEBVTT' || line.startsWith('NOTE') || line.startsWith('STYLE')) {
      continue;
    }

    const match = line.match(timeRegex);
    if (match) {
      flushCue();
      // start: h1, m1, s1, ms1
      currentStart = parseTime(match[1], match[2], match[3], match[4]);
      // end: h2, m2, s2, ms2
      currentEnd = parseTime(match[5], match[6], match[7], match[8]);
      continue;
    }

    // Check if it's a numeric cue index
    if (/^\d+$/.test(line) && currentStart < 0) {
      continue;
    }

    if (currentStart >= 0) {
      currentText.push(line);
    }
  }

  flushCue();
  return cues;
}

/**
 * Fetch and parse subtitles from a URL, or fallback to embedded sample cues.
 */
export async function loadSubtitleCues(url: string, rawContent?: string): Promise<SubtitleCue[]> {
  if (rawContent && rawContent.trim()) {
    return parseVttOrSrt(rawContent);
  }

  if (!url) return [];

  // Check if it's a data URL
  if (url.startsWith('data:')) {
    try {
      const base64Part = url.split(',')[1];
      const decoded = atob(base64Part);
      return parseVttOrSrt(decoded);
    } catch {
      return [];
    }
  }

  try {
    const res = await fetch(url);
    if (res.ok) {
      const text = await res.text();
      return parseVttOrSrt(text);
    }
  } catch (err) {
    console.warn("Could not fetch subtitle URL directly:", url, err);
  }

  return [];
}
