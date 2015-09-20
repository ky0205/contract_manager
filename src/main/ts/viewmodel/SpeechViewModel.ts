/// <reference path="../typings/knockout.d.ts" />

class SpeechViewModel {
    content: string;
    contentDisp: KnockoutComputed<string>;
    beginDate: Date;
    beginDateStr: string;
    beginDateIsoStr: string;
    endDate: Date;
    endDateStr: string;
    iconPath: string;
    userName: string;
    beginDateStrUserName: string;
    
    isSelected: KnockoutObservable<boolean> = ko.observable<boolean>(false);

    constructor(public speech: Speech, public timelineViewModel: TimelineViewModel) {
        this.content= speech.content;  
        this.beginDate = speech.begin_date;
        this.beginDateStr = moment(this.beginDate).format("M/D HH:mm");
        this.beginDateIsoStr = util.formatDateUtc(this.beginDate);
        this.endDate = speech.end_date;
        this.endDateStr = moment(this.endDate).format("M/D HH:mm");
        this.userName = speech.speechUser.dispname;
        this.beginDateStrUserName = this.beginDateStr + "  " + this.userName;
        
        // 自分のログ一覧表示時にグループの発話はグループアイコンを表示する
        if (!AppDataManager.getSelectedGroupId() && speech.speechGroup !== null) {
            this.iconPath = "icon/" + speech.speechGroup.icon.filename;
        } else {
            this.iconPath = "icon/" + speech.speechUser.icon.filename;
        }
        
        //検索キーワードのハイライト
        this.contentDisp = ko.computed({
            owner: this,
            read:  () => {
                var keyword = this.timelineViewModel.searchKeyword();
                if (keyword !== "") {
                    var escapedKeyword = util.escapeRegularExpression(keyword);
                    var highlightKeywordTag = "<span class=\"searched_keyword\">" + keyword + "</span>";
                    var replacedContent = this.content.replace(new RegExp(escapedKeyword , "g") , highlightKeywordTag);
                    return replacedContent;
                } else {
                    return this.content; 
                }
            }
        });
    }
    
    onClicked() {
        this.timelineViewModel.setSelectedSpeechViewModelByUser(this);
    }
}
