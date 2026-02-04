import { hideGameButtons, sdk } from '../main';
import { phaser, game } from '@iruka-edu/mini-game-sdk';
import AudioManager from '../audio/AudioManager';

const { createEndGameScene } = phaser;

// Prepare data before creating scene config
if (game && typeof game.prepareSubmitData === 'function') {
    game.prepareSubmitData();
}

export const EndGameScene = createEndGameScene({
    sceneKey: 'EndGameScene',
    assets: {
        banner: {
            key: 'banner_congrat',
            url: 'assets/images/bg/banner_congrat.png',
        },
        icon: { key: 'icon', url: 'assets/images/ui/icon_end.png' },
        replayBtn: { key: 'btn_reset', url: 'assets/images/ui/btn_reset.png' },
        exitBtn: { key: 'btn_exit', url: 'assets/images/ui/btn_exit.png' },
    },
    onLeave : ()=>{
        reportComplete: (payload: { score?: number; timeMs: number; extras?: any; }) => {
        sdk.complete(payload)
        }
    },
    audio: {
        play: (k) => AudioManager.play(k),
        stopAll: () => AudioManager.stopAll(),
    },
    sounds: {
        enter: 'complete',
        fireworks: 'fireworks',
        applause: 'applause',
        click: 'sfx-click',
    },
    replaySceneKey: 'Scene1',
    onEnter: () => {hideGameButtons(),game.retryFromStart() }
});

export default EndGameScene;
