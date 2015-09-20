/// <reference path="../typings/knockout.d.ts" />

class TimeIndicator {
    timeText: KnockoutObservable<string> = ko.observable("");
    top: KnockoutObservable<string> = ko.observable("");

    constructor(timeText: string, topValue: number) {
        this.timeText(timeText);
        this.setTop(topValue);
    }

    setTop(v: number) {
        this.top(v * 100 + '%');
    }
}
