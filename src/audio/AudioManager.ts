import { Howl, Howler } from 'howler';

// 1. Định nghĩa Interface cho cấu hình âm thanh
interface SoundConfig {
    src: string;
    loop?: boolean;
    volume?: number;
}

//Đường dẫn gốc 
const BASE_PATH = 'assets/audio/';

const GAME_ITEM_IDS = [
    'grape', 
    'bee', 
    'volleyball', 
    'stonke', 
    'dog', 
    'letter_o', 
    'cow', 
    'rabbit', 
    'whistle'
];

// Các âm thanh item
const ITEM_SOUNDS: Record<string, SoundConfig> = GAME_ITEM_IDS.reduce((acc, itemId) => {
    // Key: itemId
    // Path: assets/audio/grape.mp3
    acc[itemId] = { src: `${BASE_PATH}${itemId}.mp3`, volume: 1.0 }; 
    return acc;
}, {} as Record<string, SoundConfig>);

// Ánh xạ ID âm thanh và cấu hình chi tiết
const SOUND_MAP: Record<string, SoundConfig> = {

    // ---- SFX Chung ----
    'sfx-correct': { src: `${BASE_PATH}correct.mp3`, volume: 0.5 },
    'sfx-wrong': { src: `${BASE_PATH}wrong.mp3`, volume: 0.5 },
    'sfx-click': { src: `${BASE_PATH}click.mp3`, volume: 0.5 },

    // ---- Prompt Voice ----
    'voice-rotate': { src: `${BASE_PATH}rotate.mp3`, volume: 0.8 },
    'instruction': { src: `${BASE_PATH}instruction.mp3`, volume: 1.0 },
    'start': { src: `${BASE_PATH}khen_be.mp3`, volume: 1.0 },

    // ---- Correct Answer Variations ----
    'complete': { src: `${BASE_PATH}complete.mp3`, volume: 1.0 },
    'fireworks': { src: `${BASE_PATH}fireworks.mp3`, volume: 1.0 },
    'applause': { src: `${BASE_PATH}applause.mp3`, volume: 1.0 },

    ...ITEM_SOUNDS // Thêm các âm thanh item 
};



class AudioManager {
    // Khai báo kiểu dữ liệu cho Map chứa các đối tượng Howl
    private sounds: Record<string, Howl> = {};
    private isLoaded: boolean = false;

    constructor() {
        // Cấu hình quan trọng cho iOS
        Howler.autoUnlock = true;
        Howler.volume(1.0);
    }

    /**
     * Tải tất cả âm thanh
     * @returns {Promise<void>}
     */
    loadAll(): Promise<void> {

        if (this.isLoaded) {
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            const keys = Object.keys(SOUND_MAP);
            let loadedCount = 0;
            const total = keys.length;

            if (total === 0) return resolve();

            keys.forEach((key) => {
                const config = SOUND_MAP[key];

                this.sounds[key] = new Howl({
                    src: [config.src],
                    loop: config.loop || false,
                    volume: config.volume || 1.0,
                    html5: true, // Cần thiết cho iOS

                    onload: () => {
                        loadedCount++;
                        if (loadedCount === total) {
                            this.isLoaded = true;
                            resolve();
                        }
                    },
                    onloaderror: (id: number, error: unknown) => {
                        // Chúng ta vẫn có thể chuyển nó sang string để ghi log nếu muốn
                        const errorMessage =
                            error instanceof Error
                                ? error.message
                                : String(error);

                        console.error(
                            `[Howler Load Error] Key: ${key}, ID: ${id}, Msg: ${errorMessage}. Check file path: ${config.src}`
                        );

                        loadedCount++;
                        if (loadedCount === total) {
                            this.isLoaded = true;
                            resolve();
                        }
                    },
                });
            });
        });
    }

    /**
     * Phát một âm thanh
     * @param {string} id - ID âm thanh
     * @returns {number | undefined} - Sound ID của Howler
     */
    play(id: string): number | undefined {
        if (!this.isLoaded || !this.sounds[id]) {
            console.warn(
                `[AudioManager] Sound ID not found or not loaded: ${id}`
            );
            return;
        }
        return this.sounds[id].play();
    }

    /**
     * Dừng một âm thanh
     * @param {string} id - ID âm thanh
     */
    stop(id: string): void {
        if (!this.isLoaded || !this.sounds[id]) return;
        this.sounds[id].stop();
    }

    stopSound(id: string): void {
        if (this.sounds[id]) {
            this.sounds[id].stop();
        }
    }

    stopAll(): void {
        Howler.stop();
    }

    
    // Dừng TẤT CẢ các Prompt và Feedback 
    
    stopAllVoicePrompts(): void {
        const voiceKeys = Object.keys(SOUND_MAP).filter(
            (key) =>
                key.startsWith('prompt_') || key.startsWith('correct_answer_')
        );

        voiceKeys.forEach((key) => {
            this.stopSound(key);
        });

        // Hoặc dùng: Howler.stop(); để dừng TẤT CẢ âm thanh (thận trọng khi dùng)
    }

    // Kiểm tra nếu audio đã được unlock
    get isUnlocked(): boolean {
        return Howler.ctx && Howler.ctx.state === 'running';
    }

    unlockAudio(): void {
        if (!Howler.usingWebAudio) return; 
        
        // Tạo một âm thanh dummy và play/stop ngay lập tức
        const dummySound = new Howl({
            src: ['data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAAABkYXRhAAAAAA=='], // 1-frame silent WAV
            volume: 0,
            html5: true 
        });
        dummySound.once('play', () => {
            dummySound.stop();
            console.log('[Howler] Audio context unlocked manually.');
        });

        // Chỉ play nếu context đang ở trạng thái suspended/locked
        if (Howler.ctx && Howler.ctx.state !== 'running') {
            dummySound.play();
        }
    }
}

// Xuất phiên bản duy nhất (Singleton)
export default new AudioManager();
