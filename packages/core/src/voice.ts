// Web Speech API types — not always present in all DOM lib versions
interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface ISpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: ISpeechRecognitionResultList;
}

interface ISpeechRecognitionResultList {
  length: number;
  [index: number]: ISpeechRecognitionResult;
}

interface ISpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: { transcript: string; confidence: number };
}

interface ISpeechRecognitionConstructor {
  new (): ISpeechRecognition;
}

type SpeechRecognitionWindow = Window & {
  SpeechRecognition?: ISpeechRecognitionConstructor;
  webkitSpeechRecognition?: ISpeechRecognitionConstructor;
};

export class VoiceInput {
  private recognition: ISpeechRecognition | null = null;
  private resolveStop: ((transcript: string) => void) | null = null;
  private accumulated = "";

  onInterim: ((text: string) => void) | null = null;

  static isSupported(): boolean {
    if (typeof window === "undefined") return false;
    const w = window as SpeechRecognitionWindow;
    return !!(w.SpeechRecognition ?? w.webkitSpeechRecognition);
  }

  start(): void {
    if (!VoiceInput.isSupported()) {
      throw new Error("Web Speech API not supported in this browser");
    }

    const w = window as SpeechRecognitionWindow;
    const SR = (w.SpeechRecognition ?? w.webkitSpeechRecognition)!;
    this.recognition = new SR();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = "en-US";
    this.accumulated = "";

    this.recognition.onresult = (event: ISpeechRecognitionEvent) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += t;
        } else {
          interim += t;
        }
      }
      if (final) this.accumulated += final;
      this.onInterim?.(this.accumulated + interim);
    };

    this.recognition.start();
  }

  stop(): Promise<string> {
    return new Promise((resolve) => {
      this.resolveStop = resolve;
      if (this.recognition) {
        this.recognition.onend = () => {
          resolve(this.accumulated.trim());
          this.resolveStop = null;
        };
        this.recognition.stop();
      } else {
        resolve("");
      }
    });
  }

  abort(): void {
    this.recognition?.abort();
    this.resolveStop?.("");
    this.resolveStop = null;
    this.accumulated = "";
  }
}
