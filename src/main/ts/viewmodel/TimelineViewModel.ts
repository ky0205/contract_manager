/// <reference path="../typings/jquery.d.ts" />
/// <reference path="../typings/knockout.d.ts" />
/// <reference path="../typings/lodash.d.ts" />
/// <reference path="../typings/moment.d.ts" />

declare var bouncefix: any;
declare var Media: any;

class TimelineViewModel {
    speechModel: SpeechModel;
    voiceModel: VoiceModel;
    groupModel: GroupModel;
    userModel: UserModel;
    speechViewModelList: KnockoutObservableArray<SpeechViewModel> = ko.observableArray<SpeechViewModel>([]);

    groupId: number;
    group: Group;
    groupName: KnockoutObservable<string> = ko.observable<string>("");
    userId: number;
    user: User;
    userName: KnockoutObservable<string> = ko.observable<string>("");
    isGroupLog: KnockoutObservable<boolean> = ko.observable<boolean>(false); //true: グループログ　false：ユーザログ
    headerIconPath: KnockoutObservable<string> = ko.observable<string>("");

    targetDate: Date;
    isSearchMode: KnockoutObservable<boolean> = ko.observable<boolean>(false);

    isTopSpeechLoading: KnockoutObservable<boolean> = ko.observable<boolean>(false);
    isBottomSpeechLoading: KnockoutObservable<boolean> = ko.observable<boolean>(false);
    errorMessage: KnockoutObservable<string> = ko.observable<string>("");
    errorMessageHandler: ErrorMessageHandler;
    isRecording: KnockoutObservable<boolean> = ko.observable<boolean>(false);
    sessionKey: string;
    pollingLatestSpeechInterval = null;
    recogTmpResult: KnockoutObservable<string> = ko.observable<string>("");
    voicePlayer: any;
    isPlayingButtonPressed: KnockoutObservable<boolean> = ko.observable<boolean>(false);
    searchKeyword: KnockoutObservable<string> = ko.observable<string>("");

    constructor() {
        //モデル初期化
        this.speechModel = new SpeechModel();
        this.groupModel = new GroupModel();
        this.userModel = new UserModel();
        this.voiceModel = new VoiceModel();

        //thisのバインド
        this.onSpeechRendered = this.onSpeechRendered.bind(this);
        this.onRecordButtonClicked = this.onRecordButtonClicked.bind(this);
        this.onSearchButtonClick = this.onSearchButtonClick.bind(this);
        this.updateRecogTmpResult = this.updateRecogTmpResult.bind(this);
        this.recognitionError = this.recognitionError.bind(this);
        this.updateAudioVolume = this.updateAudioVolume.bind(this);
        this.onPlaySuccess = this.onPlaySuccess.bind(this);
        this.onPlayError = this.onPlayError.bind(this);
        this.onPlayStatus = this.onPlayStatus.bind(this);
        this.onPauseApp = this.onPauseApp.bind(this);
        this.onResumeApp = this.onResumeApp.bind(this);

        this.errorMessageHandler = new ErrorMessageHandler(this.errorMessage);
        
        //ライフサイクル処理開始
        LifecycleHandler.init();
        LifecycleHandler.setOnPauseAppFunc(this.onPauseApp);
        LifecycleHandler.setOnResumeAppFunc(this.onResumeApp);
        
        //ローカルストレージからログインユーザ、現在選択中のグループID(ユーザログの場合はnull)、画面表示日時、発話件数を取得
        this.user = AppDataManager.getLoginUserInfo();
        this.userId = this.user.id;
        this.groupId = AppDataManager.getSelectedGroupId();
        this.targetDate = AppDataManager.getTimelineViewTargetDate();
        var viewSpeechCount = AppDataManager.getTimelineViewCount();
        
        //グループログかユーザログかの判定
        if (this.groupId) {
            //グループ情報取得・設定
            this.groupModel.getGroup(this.groupId).done((groupJson) => {
                var icon = new Icon(groupJson.icon.id, groupJson.icon.filename, groupJson.icon.icon_type, null, null);
                this.group = new Group(groupJson.id, groupJson.name, icon, null, null);
                this.groupName(this.group.name);
                this.headerIconPath(this.group.icon.iconPath);
            }).fail((jqXHR: JQueryXHR, textStatus, errorThrown) => {
                this.errorMessageHandler.setByHttpStatus(jqXHR.status);
            });
            this.isGroupLog(true);
        } else {
            //ユーザ情報設定
            this.userName(this.user.dispname);
            this.headerIconPath(this.user.icon.iconPath);
            this.isGroupLog(false);
        }

        var speechViewModels: SpeechViewModel[] = [];
        this.speechModel.getSpeechListBeforeDate(this.userId, this.groupId, this.targetDate, viewSpeechCount).then((result) => {
            var data = result;
            _.forEach((data), (speechResult: any) => {
                speechViewModels.push(this.createSpeechViewModel(speechResult));
            });
            return this.speechModel.getSpeechListSinceDate(this.userId, this.groupId, this.targetDate, viewSpeechCount);
        }).then((resultAfter) => {
            var data = resultAfter;
            var isSpeechSelected = false;
            _.forEach((data), (speechResult: any) => {
                var speechViewModel = this.createSpeechViewModel(speechResult);
                if (!isSpeechSelected) {
                    this.setSelectedSpeechViewModel(speechViewModel);
                    isSpeechSelected = true;
                }
                speechViewModels.push(speechViewModel);
            });
            if (!isSpeechSelected && speechViewModels.length > 0) {
                this.setSelectedSpeechViewModel(speechViewModels[speechViewModels.length - 1]);
            }
            this.speechViewModelList(speechViewModels);
            this.checkIfPollingLatestSpeechNeeded();
        }).fail((jqXHR: JQueryXHR, textStatus, errorThrown) => {
            this.errorMessageHandler.setByHttpStatus(jqXHR.status);
            // TODO: handle ERR_CONNECTION_REFUSED (set timeout or catch the error)
        });

        bouncefix.add('speech_list');
    }
    
    createSpeechViewModel(speechResult: any) {
        var icon = new Icon(speechResult.user.icon.id, speechResult.user.icon.filename, speechResult.user.icon.icon_type, null, null);
        var speechUser = new User(null, null, speechResult.user.id, speechResult.user.account, null, null, speechResult.user.name, icon, null, null);
        if (speechResult.group) {
            var groupIcon = new Icon(speechResult.group.icon.id, speechResult.group.icon.filename, speechResult.group.icon.icon_type, null, null);
            var speechGroup = new Group(null, null, groupIcon, null, null);
            var speech = new Speech(speechResult.id, speechResult.recog_content, moment(speechResult.speech_timestamp).toDate(), moment(speechResult.speech_endtimestamp).toDate(), speechResult.session_key, speechUser, speechGroup);
        } else {
            var speech = new Speech(speechResult.id, speechResult.recog_content, moment(speechResult.speech_timestamp).toDate(), moment(speechResult.speech_endtimestamp).toDate(), speechResult.session_key, speechUser, null);
        }
        var speechViewModel = new SpeechViewModel(speech, this);
        return speechViewModel;
    }

    numberOfAddingSpeeches = 10;
    isAddingTopSpeeches = false;
    addingSpeechesCount: number;
    isForcedScrollingBottom = false;

    onSpeechScrolled(data, event) {
        var height = $('#main').outerHeight();
        var scrollTop = $('#main').scrollTop();
        var scrollHeight = $('#main').get(0).scrollHeight;
        if (scrollTop <= 0) {
            this.addTopOrBottomSpeechList(true);
        } else if ((scrollTop + height) >= scrollHeight * 0.98) {
            this.addTopOrBottomSpeechList(false);
        }
    }

    addTopOrBottomSpeechList(isAddingTop: boolean) {
        if (isAddingTop) {
            if (!this.isTopSpeechLoading()) {
                this.isTopSpeechLoading(true);

                console.log("scroll top!");
                //一番上の発話のbeginDateを取得
                var topDate = this.firstSpeechDate();

                //10件分追加表示
                this.speechModel.getSpeechListBeforeDate(this.userId, this.groupId, topDate, this.numberOfAddingSpeeches).done((result) => {
                    var nextSpeeches: SpeechViewModel[] = this.speechViewModelList();
                    //追加取得したスピーチ
                    var data = result;
                    _.forEachRight((data), (speechResult: any) => {
                        //現在のスピーチリストの前に追加する
                        nextSpeeches.unshift(this.createSpeechViewModel(speechResult));
                    });
                    this.isAddingTopSpeeches = true;
                    this.addingSpeechesCount = data.length;
                    this.speechViewModelList(nextSpeeches);
                    setTimeout(() => this.isTopSpeechLoading(false), 1000);
                }).fail((jqXHR: JQueryXHR, textStatus, errorThrown) => {
                    this.errorMessageHandler.setByHttpStatus(jqXHR.status);
                    setTimeout(() => this.isTopSpeechLoading(false), 1000);
                });
            }
        } else {
            if (!this.isBottomSpeechLoading() && !this.isForcedScrollingBottom) {
                this.isBottomSpeechLoading(true);
                console.log("scroll bottom!");
                var bottomDate = this.lastSpeechDate();
                this.speechModel.getSpeechListAfterDate(this.userId, this.groupId, bottomDate, this.numberOfAddingSpeeches).done((result) => {
                    var nextSpeeches: SpeechViewModel[] = this.speechViewModelList();
                    //追加取得したスピーチ
                    var data = result;
                    _.forEach((data), (speechResult: any) => {
                        //現在のスピーチリストの後に追加する
                        nextSpeeches.push(this.createSpeechViewModel(speechResult));
                    });
                    this.isAddingTopSpeeches = false;
                    if (data.length <= 0) {
                        this.enablePollingLatestSpeech();
                    } else {
                        this.speechViewModelList(nextSpeeches);                    
                        this.checkIfPollingLatestSpeechNeeded();
                    }
                    setTimeout(() => this.isBottomSpeechLoading(false), 1000);
                }).fail((jqXHR: JQueryXHR, textStatus, errorThrown) => {
                    this.errorMessageHandler.setByHttpStatus(jqXHR.status);
                    setTimeout(() => this.isBottomSpeechLoading(false), 1000);
                });
            }
        }
    }

    firstSpeechDate() {
        /*var toDateStr = $('.speechBeginDate:first').val();
        if (toDateStr) {
            // 一番上のスピーチから時刻を取得
            return moment(toDateStr).toDate();
        } else {
            // 表示されているスピーチが存在しない場合はtargetDateで代替。
            return this.targetDate;
        }*/
        if (this.speechViewModelList().length > 0) {
            // 一番上のスピーチから時刻を取得
            return this.speechViewModelList()[0].beginDate;
        } else {
            // 表示されているスピーチが存在しない場合はtargetDateで代替。
            return this.targetDate;            
        }
    }

    lastSpeechDate() {
        /*var toDateStr = $('.speechBeginDate:last').val();
        if (toDateStr) {
            // 一番下のスピーチから時刻を取得
            return moment(toDateStr).add(1, "seconds").toDate();
        } else {
            // 表示されているスピーチが存在しない場合はtargetDateで代替。
            return this.targetDate;
        }*/
        if (this.speechViewModelList().length > 0) {
            return moment(this.speechViewModelList()[this.speechViewModelList().length - 1].beginDate).add(1, "seconds").toDate();
        } else {
            return this.targetDate;
        }
    }

    checkIfPollingLatestSpeechNeeded() {
        var bottomDate = this.lastSpeechDate();
        this.speechModel.getSpeechListAfterDate(this.userId, this.groupId, bottomDate, 1).done((result) => {
            var data = result;
            if (data.length <= 0) {
                this.enablePollingLatestSpeech();
            } else {
                this.disablePollingLatestSpeech();
            }
        });
    }

    enablePollingLatestSpeech() {
        if (this.pollingLatestSpeechInterval) {
            return;
        }
        this.pollingLatestSpeechInterval = setInterval(() => {
            this.addTopOrBottomSpeechList(false);
        }, 5 * 1000);
    }

    disablePollingLatestSpeech() {
        if (this.pollingLatestSpeechInterval) {
            clearInterval(this.pollingLatestSpeechInterval);
            this.pollingLatestSpeechInterval = null;
        }
    }

    onSpeechRendered(elements, data) {
        if (this.isAddingTopSpeeches) {
            if (--this.addingSpeechesCount <= 0) {
                this.isAddingTopSpeeches = false;
                $('#main').scrollTop(elements[1].offsetTop);
            }
        } else {
            this.isForcedScrollingBottom = true;
            setTimeout(() => this.isForcedScrollingBottom = false, 2000);
            $('#main').scrollTop(9999999);
        }
    }

    // -- select a speech
    selectedSpeechViewModel: SpeechViewModel;

    setSelectedSpeechViewModel(speechViewModel: SpeechViewModel) {
        if (this.selectedSpeechViewModel) {
            this.selectedSpeechViewModel.isSelected(false);
        }
        this.selectedSpeechViewModel = speechViewModel;
        this.selectedSpeechViewModel.isSelected(true);
        this.targetDate = speechViewModel.beginDate;
    }

    setSelectedSpeechViewModelByUser(speechViewModel) {
        this.setSelectedSpeechViewModel(speechViewModel);
        if (this.isPlayingButtonPressed()) {
            this.isStoppedBySelectingSpeech = true;
            this.voicePlayer.stop();
        }
    }

    // -- buttons clicked
    showTagCloud() {
        //ローカルストレージにタグクラウド画面の表示日時をセット
        //this.calcTargetDate();
        AppDataManager.setTagCloudViewTargetDate(this.targetDate);
        
        this.onPauseApp();
        
        //タグクラウド画面に遷移
        window.location.href = "tag_cloud.html";
        
        /*var groupParam = '';
        if (this.groupId) {
            groupParam = '&groupid=' + this.groupId;
        }
        this.calcTargetDate();
        window.location.href = "tag_cloud.html?targetdate=" + moment(this.targetDate).utc().format("YYYY-MM-DD[T]HH:mm:ss.SSS[Z]") + groupParam;
        */
    }

    onGroupButtonClick() {        
        this.onPauseApp();
        
        AppDataManager.setBeforeGroupListView("timeline.html")
        //グループリスト画面に遷移
        window.location.href = "group_list.html";
        /*if(!this.groupId){
            window.location.href = "group_list.html";
        }else{
            window.location.href = "group_list.html?group_id=" + this.groupId;
        }*/
    }

    showConfig() {
        //ローカルストレージにタイムライン画面の表示日時と遷移前の画面情報をセット
        //this.calcTargetDate();
        AppDataManager.setTagCloudViewTargetDate(this.targetDate);
        AppDataManager.setBeforeView("timeline.html");
        
        this.onPauseApp();
        
        //設定画面に遷移
        window.location.href = "config.html";
        //window.location.href = "config.html?ref=timeline.html&targetdate=" + moment(this.targetDate).utc().format("YYYY-MM-DD[T]HH:mm:ss.SSS[Z]") + '&groupid=' + this.groupId;
    }

    /*calcTargetDate() {
        var height = $('#main').outerHeight();
        var tmpDate: Date;
        $('.speech').each(function(i, e) {
            if ($(e).position().top > height / 2) {
                tmpDate = moment($(e).children('input').attr('value')).toDate();
                return false;
            }
        });
        this.targetDate = tmpDate;
    }*/
    
    // -- lifecycle handling
    onPauseApp() {
        this.stopPlaying();
        this.stopRecording();
    }

    onResumeApp() {
    }    
    
    // -- recording
    isPrePostProcessingForRecording = false;
    
    onRecordButtonClicked() {
        if (this.isPrePostProcessingForRecording) {
            return;
        }
        if (!this.isRecording()) {
            this.startRecording();
        } else {
            this.stopRecording();
        }
    }

    startRecording() {
        this.isPrePostProcessingForRecording = true;
        this.isRecording(true);
        this.voiceModel.startTime(new Date(), this.groupId, this.userId).done((result) => {
            setUpdateRecogTmpResultFunc(this.updateRecogTmpResult);
            setRecogResultErrorFunc(this.recognitionError);
            setUpdateAudioVolumeFunc(this.updateAudioVolume);
            this.sessionKey = result.session_key;
            this.voiceModel.startRecording(this.sessionKey);
            this.isPrePostProcessingForRecording = false;
        }).fail((jqXHR: JQueryXHR, textStatus, errorThrown) => {
            this.isRecording(false);
            this.errorMessageHandler.setByHttpStatus(jqXHR.status);
            // TODO: handle ERR_CONNECTION_REFUSED (set timeout or catch the error)
            this.isPrePostProcessingForRecording = false;
        });
    }

    stopRecording() {
        if (!this.isRecording()) {
            return;
        }
        this.isPrePostProcessingForRecording = true;
        this.isRecording(false);
        this.voiceModel.endRecording();
        setUpdateRecogTmpResultFunc(null);
        setRecogResultErrorFunc(null);
        setUpdateAudioVolumeFunc(null);
        this.updateRecogTmpResult("");
        this.recogTmpResult("");
        this.updateAudioVolume("0");
        this.voiceModel.endTime(new Date(), this.sessionKey).done((result) => {
            this.isPrePostProcessingForRecording = false;
        }).fail((jqXHR: JQueryXHR, textStatus, errorThrown) => {
            this.errorMessageHandler.setByHttpStatus(jqXHR.status);
            // TODO: handle ERR_CONNECTION_REFUSED (set timeout or catch the error)
            this.isPrePostProcessingForRecording = false;
        });
    }

    updateRecogTmpResult(result: string) {
        var rl = result.length;
        if (rl < 10) {
            this.recogTmpResult(result);
        } else {
            this.recogTmpResult('..' + result.slice(rl - 10));
        }
    }
    
    recognitionError(){
        console.log("recognitionError");
        this.stopRecording();
        this.recogTmpResult('音声認識エラー');
    }

    volumeIndicatorWidth: KnockoutObservable<string> = ko.observable<string>("");

    updateAudioVolume(volume: string) {
        this.volumeIndicatorWidth(volume + "%");
    }
    
    // -- playing
    isStoppedByUser = false;
    isStoppedBySelectingSpeech = false;

    onPlayButtonClicked() {
        if (this.isPlayingButtonPressed()) {
            //再生中なら停止
            this.stopPlaying();
        } else {
            //停止中の場合
            this.startPlaying();
        }
    }

    startPlaying() {
        if (this.selectedSpeechViewModel) {
            this.isPlayingButtonPressed(true); //再生中フラグ        
            this.playSelectedSpeechViewModel();
        }
    }

    stopPlaying() {
        if (!this.isPlayingButtonPressed()) {
            return;
        }
        this.isPlayingButtonPressed(false);
        this.isStoppedByUser = true;
        this.voicePlayer.stop();
    }
    
    
    //選択されているスピーチを再生 
    playSelectedSpeechViewModel() {
        var playingSpeech = this.selectedSpeechViewModel.speech;
        var src = this.voiceModel.getVoiceAudioUrl(playingSpeech.session_key, playingSpeech.begin_date, playingSpeech.end_date);
        this.voicePlayer = new Media(src, this.onPlaySuccess, this.onPlayError, this.onPlayStatus);
        this.voicePlayer.play();
    }

    onPlaySuccess() {

    }

    onPlayError(error) {
        console.log('error ' + error.code);
        this.isPlayingButtonPressed(false);
    }

    onPlayStatus(status) {
        if (status === Media.MEDIA_STOPPED) {
            if (this.isStoppedByUser) {
                this.isStoppedByUser = false;
                return;
            }
            if (this.isStoppedBySelectingSpeech) {
                this.isStoppedBySelectingSpeech = false;
                this.playSelectedSpeechViewModel();
                return;
            }
            if (!this.isPlayingButtonPressed()) {
                return;
            }
            var si = _.findIndex(this.speechViewModelList(), (svm) => svm.isSelected());
            if (si >= 0 && si < this.speechViewModelList().length - 1) {
                si++;
                this.setSelectedSpeechViewModel(this.speechViewModelList()[si]);
                this.playSelectedSpeechViewModel();
            } else {
                this.isPlayingButtonPressed(false);
            }
        }
    }

    onSearchButtonClick() {
        //検索モードのON/OFF
        if (this.isSearchMode()) {
            this.isSearchMode(false);
            this.searchKeyword("");
        } else {
            this.isSearchMode(true);
        }
    }

}
