/// <reference path="../typings/knockout.d.ts" />

class SpeechWaveViewModel {
    top: KnockoutObservable<string> = ko.observable("");
    borderLeft: string;
    borderTop: string;
    borderBottom: string;
    
    constructor(public colorClassName: string, public millis: number, length: number, height: number) {
        this.borderLeft = Math.floor(length) + "px";
        this.borderTop = this.borderBottom = Math.floor(height / 2) + "px";
    }
    
    setTop(value: number) {
        this.top(value + 'px');
    }
}
