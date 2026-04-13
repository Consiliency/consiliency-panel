export class VoiceInput {
  private recognition: SpeechRecognition | null = null;
  private resolveStop: ((transcript: string) => void) | null = null;
  private accumulated = "";

  onInterim: ((text: string) => void) | null = null;

  static isSupported(): boolean {
    return (
      typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
    );
  }

  start(): void {
    if (!VoiceInput.isSupported()) {
      throw new Error("Web Speech API not supported in this browser");
    }

    const SR =
      window.SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition: typeof SpeechRecognition })
        .webkitSpeechRecognition;

    this.recognition = new SR();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = "en-US";
    this.accumulated = "";

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
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
