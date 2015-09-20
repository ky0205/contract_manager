/// <reference path="../typings/bluebird.d.ts" />
/// <reference path="../typings/knockout.d.ts" />

class Microphone {
    static sampleRate: number;
    isReady: boolean = false;
    isOn: boolean = false;

    static bufferSize = 1024;
    nav: any;
    win: any;
    audioContext;

    constructor(public viewModel: MicrophoneViewModel) {
        this.nav = navigator;
        this.win = window;
        this.nav.getUserMedia = (this.nav.getUserMedia || this.nav.webkitGetUserMedia ||
            this.nav.mozGetUserMedia || this.nav.msGetUserMedia);
        this.setIsReady(!!(this.nav.getUserMedia));
        if (!this.isReady) {
            return;
        }
        var winAudioContext = this.win.AudioContext || this.win.webkitAudioContext;
        this.audioContext = new winAudioContext();
        Microphone.sampleRate = this.audioContext.sampleRate;
    }

    setIsReady(isReady: boolean) {
        this.isReady = isReady;
        this.viewModel.isGetUserMediaReady(isReady);
    }

    listener: (data: Float32Array) => void;

    begin(listener: (data: Float32Array) => void): Promise<any> {
        return new Promise((resolve: (result: any) => void, reject) => {
            if (!this.isReady || this.isOn) {
                reject();
                return;
            }
            this.listener = listener;
            this.nav.getUserMedia({ audio: true },
                (e) => {
                    this.onGotUserMedia(e);
                    resolve(null);
                },
                (e) => {
                    this.isReady = false;
                    this.viewModel.isGetUserMediaReady(this.isReady);
                    reject();
                });
        });
    }

    audioStream;
    source;
    // To prevent the ScriptProcessor is GCed
    processor;

    onGotUserMedia(e) {
        this.audioStream = e;
        this.source = this.audioContext.createMediaStreamSource(e);
        this.processor = this.audioContext.createScriptProcessor(Microphone.bufferSize, 1, 1);
        this.processor.onaudioprocess = (e) => {
            var data: Float32Array = e.inputBuffer.getChannelData(0);
            this.listener(data);
        };
        this.source.connect(this.processor);
        this.processor.connect(this.audioContext.destination);
        this.isOn = true;
        this.viewModel.isMicrophoneOn(this.isOn);
    }

    end() {
        if (!this.isReady || !this.isOn) {
            return false;
        }
        this.processor.onaudioprocess = null;
        this.audioStream.stop();
        this.source.disconnect();
        this.isOn = false;
        this.viewModel.isMicrophoneOn(this.isOn);
        return true;
    }
}
