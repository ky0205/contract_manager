/// <reference path="../typings/knockout.d.ts" />

class MicrophoneViewModel {
	recogText: KnockoutObservable<string> = ko.observable("");
	isGetUserMediaReady: KnockoutObservable<boolean> = ko.observable(false);
	isMicrophoneOn: KnockoutObservable<boolean> = ko.observable(false);
	statusText: KnockoutObservable<string> = ko.observable("");

	voiceRecognizer: VoiceRecognizer;
	
	constructor() {
		this.voiceRecognizer = new VoiceRecognizer(this);
		this.voiceRecognizer.setupMicrophone();
	}

    beginMicrophone() {
        this.voiceRecognizer.begin();
    }

    endMicrophone() {
        this.voiceRecognizer.end();
    }
	
	setStatusText(text: string) {
		this.statusText(text);
	}
	
	addRecogResult(result: string) {
		this.recogText(this.recogText() + result);
	}
}
