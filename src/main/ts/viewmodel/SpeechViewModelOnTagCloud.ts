/// <reference path="../typings/knockout.d.ts" />

class SpeechViewModelOnTagCloud {
    content: string;
    beginDate: Date;
    beginDateStr: string;
    iconPath: string;
    userName: string;
    top: KnockoutObservable<string> = ko.observable<string>("");

    constructor(public tagCloudViewModel: TagCloudViewModel, public speech: Speech) {
        this.content = speech.content;
        this.beginDate = speech.begin_date;
        this.beginDateStr = moment(this.beginDate).format("M/D HH:mm");
        this.iconPath = speech.speechUser.icon.iconPath;
        this.userName = speech.speechUser.dispname;
    }
    
    onClick() {
        this.tagCloudViewModel.moveTimePointerToByTappingSearchResult(this.beginDate);
    }
}
