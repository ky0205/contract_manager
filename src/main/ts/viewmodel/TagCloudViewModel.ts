/// <reference path="../typings/jquery.d.ts" />
/// <reference path="../typings/knockout.d.ts" />
/// <reference path="../typings/lodash.d.ts" />
/// <reference path="../typings/moment.d.ts" />

declare var playAudio: any;

class TagCloudViewModel {
    //モデル
    groupModel: GroupModel;
    speechModel: SpeechModel;
    tagModel: TagModel;
    userModel: UserModel;
    voiceModel: VoiceModel;

    groupId: number;
    groupName: KnockoutObservable<string> = ko.observable<string>("");
    isGroupLog: KnockoutObservable<boolean> = ko.observable<boolean>(false); //true: グループログ　false：ユーザログ
    userId: number;
    userName: KnockoutObservable<string> = ko.observable<string>("");
    errorMessage: KnockoutObservable<string> = ko.observable<string>("");
    errorMessageHandler: ErrorMessageHandler;
    searchQuery: string;
    headerIconPath: KnockoutObservable<string> = ko.observable<string>("");

    isRecording: KnockoutObservable<boolean> = ko.observable<boolean>(false);
    sessionKey: string;
    recogTmpResult: KnockoutObservable<string> = ko.observable<string>("");
    isSearchMode: KnockoutObservable<boolean> = ko.observable<boolean>(false);
    searchKeyword: KnockoutObservable<string> = ko.observable<string>("");

    constructor() {
        //モデル初期化
        this.speechModel = new SpeechModel();
        this.tagModel = new TagModel();
        this.userModel = new UserModel();
        this.groupModel = new GroupModel();
        this.voiceModel = new VoiceModel();
        
        //thisのバインド
        this.onTagMouseUp = this.onTagMouseUp.bind(this);
        this.onTagMouseDown = this.onTagMouseDown.bind(this);
        this.onTagClick = this.onTagClick.bind(this);
        this.onTagTouchEnd = this.onTagTouchEnd.bind(this);
        this.onTagCloudTouchStart = this.onTagCloudTouchStart.bind(this);
        this.onTagCloudTouchMove = this.onTagCloudTouchMove.bind(this);
        this.onTagCloudTouchEnd = this.onTagCloudTouchEnd.bind(this);
        this.scrollTagViewModels = this.scrollTagViewModels.bind(this);
        this.updateRecogTmpResult = this.updateRecogTmpResult.bind(this);
        this.recognitionError = this.recognitionError.bind(this);
        this.updateAudioVolume = this.updateAudioVolume.bind(this);
        this.onPlaySuccess = this.onPlaySuccess.bind(this);
        this.onPlayError = this.onPlayError.bind(this);
        this.onPlayStatus = this.onPlayStatus.bind(this);
        this.checkMediaRunning = this.checkMediaRunning.bind(this);
        this.onPauseApp = this.onPauseApp.bind(this);
        this.onResumeApp = this.onResumeApp.bind(this);

        this.errorMessageHandler = new ErrorMessageHandler(this.errorMessage);
        
        //ライフサイクル処理開始
        LifecycleHandler.init();
        LifecycleHandler.setOnPauseAppFunc(this.onPauseApp);
        LifecycleHandler.setOnResumeAppFunc(this.onResumeApp);
        
        //キーワード検索処理
        ko.computed({
            owner: this,
            read: () => {
                var keyword = this.searchKeyword();
                if (keyword.length <= 0) {
                    this.clearSeachQuery();
                } else {
                    this.searchQuery = keyword;
                    this.searchSpeeches();
                }
            }
        });
        
        //ローカルストレージからログインユーザ、現在選択中のグループID(ユーザログの場合はnull)、画面表示日時を取得
        var loginUser: User = AppDataManager.getLoginUserInfo();
        this.userId = loginUser.id;
        this.groupId = AppDataManager.getSelectedGroupId();
        var targetDate = AppDataManager.getTagCloudViewTargetDate();
        
        //タグクラウド画面の初期表示
        if (this.groupId) {
            //グループタグクラウド画面
            this.groupModel.getGroup(this.groupId).done((groupJson) => {
                //グループ情報取得
                var icon = new Icon(groupJson.icon.id, groupJson.icon.filename, groupJson.icon.icon_type, null, null);
                var group = new Group(groupJson.id, groupJson.name, icon, null, null);
                this.groupName(group.name);
                this.headerIconPath(group.icon.iconPath);
                this.isGroupLog(true);
                //初期表示描画
                this.initView(targetDate);
            }).fail((jqXHR: JQueryXHR, textStatus, errorThrown) => {
                //グループ情報取得エラー
                this.errorMessageHandler.setByHttpStatus(jqXHR.status);
            });
        } else {
            //ユーザタグクラウド画面
            this.userName(loginUser.dispname);
            this.headerIconPath(loginUser.icon.iconPath);
            this.isGroupLog(false);
            //初期表示描画
            this.initView(targetDate);
        }
    }

    initGroupInfo() {

    }

    initView(targetdate) {
        this.centerPosMillis = moment(targetdate).valueOf();
        this.initTimePointer();
        this.initViewAnims();
        this.moveTimePointerTo(moment(targetdate).toDate());
    }
	
    // --
    // -- update, scroll and zoom the view models for records and tags
    // --
    serverAccessIntervalMillis = 500;
    timeIndicators: KnockoutObservableArray<TimeIndicator> = ko.observableArray<TimeIndicator>([]);
    tagViewModels: KnockoutObservableArray<TagViewModel> = ko.observableArray<TagViewModel>([]);
    speechViewModels: KnockoutObservableArray<SpeechViewModelOnTagCloud> = ko.observableArray<SpeechViewModelOnTagCloud>([]);
    speechWaveViewModels: KnockoutObservableArray<SpeechWaveViewModel> = ko.observableArray<SpeechWaveViewModel>([]);
    viewBeginDate: KnockoutObservable<string> = ko.observable<string>("");
    centerPosMillis: number;
    heightMillis: number;
    viewBeginMillis: number;
    viewEndMillis: number;
    requestAnimFrame: any;
    scrollY: number = 0;
    zoomY: number = 0;
    tagOpacity: number = 0;
    isIncrementingTagOpacity = false;
    isDecrementingTagOpacity = false;

    initViewAnims() {
        this.heightMillis = 0;
        this.zoomTime(0);
        this.updateViewBeginEndMillis();
        this.updateTimeIndicators();
        var win: any = window;
        this.requestAnimFrame =
        win.requestAnimationFrame ||
        win.webkitRequestAnimationFrame ||
        win.mozRequestAnimationFrame ||
        win.oRequestAnimationFrame ||
        win.msRequestAnimationFrame ||
        function(callback) {
            window.setTimeout(callback, 1000 / 60 / 2);
        };
        this.updateAnim = this.updateAnim.bind(this);
        this.requestAnimFrame.call(window, this.updateAnim);
        this.updateViewFromServer();
    }
        
    // slip scrolling and zooming by reqAnimFrame
    updateViewTimeout: number;
    updateTagViewModelsTimeout: number;
    prevViewBeginMillis = 0;
    prevHeightMillis = 0;
    ticks = 0;
    isShowingTags = false;

    updateAnim() {
        this.zoomY *= 0.9;
        if (Math.abs(this.zoomY) >= 5) {
            this.zoomTime(this.zoomY);
        } else {
            this.zoomY = 0;
        }
        this.scrollY *= 0.95;
        if (Math.abs(this.scrollY) >= 5) {
            this.changeTime(this.scrollY);            
        } else {
            this.scrollY = 0;
        }
        if (this.zoomY !== 0 || this.scrollY !== 0) {
            this.updateViewBeginEndMillis();
            this.updateTimeIndicators();
            this.scrollTagViewModels();
            this.scrollSpeechWaveViewModels();
            this.arrangeSpeechViewModels();
            if (this.isShowingTimePointerDetail()) {
                this.updateTimePointerDetail();
            }
            if (!this.updateViewTimeout) {
                this.updateViewTimeout = setTimeout(() => {
                    this.updateViewFromServer();
                    this.updateViewTimeout = null;
                }, this.serverAccessIntervalMillis);
            }
            if (!this.isPlayingButtonPressed()) {
                this.hideTimePointerDetail();
            }
        }
        if (this.isShowingTimePointerDetail()) {
            this.getTimePointerSpeechWhenTimePointerIsMoving();
        }
        this.checkShowingAndHidingTags();
        this.updateTagOpacity();
        this.requestAnimFrame.call(window, this.updateAnim);
    }

    checkShowingAndHidingTags() {
        if (this.isIncrementingTagOpacity || this.isDecrementingTagOpacity) {
            return;
        }
        if (!this.isShowingTags) {
            // check if new tags should be shown
            if (this.ticks++ % 10 === 0) {
                var offsetBeginMillisRatio = Math.abs(this.viewBeginMillis - this.prevViewBeginMillis) / this.heightMillis;
                var offsetHeightMillisRatio = Math.abs(this.heightMillis - this.prevHeightMillis) / this.heightMillis;
                if (offsetBeginMillisRatio < 0.1 && offsetHeightMillisRatio < 0.1) {
                    if (!this.updateTagViewModelsTimeout) {
                        this.updateTagViewModelsTimeout = setTimeout(() => {
                            this.updateTagViewModels();
                        }, this.serverAccessIntervalMillis);
                    }
                }
                this.prevViewBeginMillis = this.viewBeginMillis;
                this.prevHeightMillis = this.heightMillis;
            }
        } else {
            // check if new tags should be hidden
            var offsetBeginMillisRatio = Math.abs(this.viewBeginMillis - this.shownTagViewModelsViewBeginMillis) / this.heightMillis;
            var offsetHeightMillisRatio = Math.abs(this.heightMillis - this.shownTagViewModelsHeightMillis) / this.heightMillis;
            if (offsetBeginMillisRatio > 0.5 || offsetHeightMillisRatio > 0.2) {
                this.clearAllTagViewModels();
            }
        }
    }

    updateTagOpacity() {
        if (this.isIncrementingTagOpacity) {
            this.tagOpacity += 1 / (2 * 60);
            if (this.tagOpacity >= 1) {
                this.tagOpacity = 1;
                this.isIncrementingTagOpacity = false;
            }
        } else if (this.isDecrementingTagOpacity) {
            this.tagOpacity -= 1 / (1 * 60);
            if (this.tagOpacity <= 0) {
                this.tagViewModels([]);
                this.tagOpacity = 0;
                this.isDecrementingTagOpacity = false;
                this.isShowingTags = false;
            }
        }
    }

    clearAllTagViewModels() {
        this.isDecrementingTagOpacity = true;
        _.forEach(this.tagViewModels(), (tvm) => tvm.tagFadeInOutClassName("tag-fadeout"));
    }

    updateViewFromServer() {
        //this.updateTagViewModels();
        this.updateSpeechWaveViewModels();
        if (this.searchQuery) {
            this.searchSpeeches();
        }
    }

    changeTime(deltaY: number) {
        this.centerPosMillis += deltaY * this.heightMillis * 0.0002 / 2;
        var currentMillis = new Date().getTime();
        if (this.centerPosMillis > currentMillis) {
            this.centerPosMillis += (currentMillis - this.centerPosMillis) * 0.5;
        }
    }

    zoomTime(deltaY: number) {
        this.heightMillis += deltaY * this.heightMillis * 0.0002;
        if (this.heightMillis < 60 * 3 * 1000) {
            this.heightMillis = 60 * 3 * 1000;
        } else if (this.heightMillis > 24 * 60 * 60 * 1000) {
            this.heightMillis = 24 * 60 * 60 * 1000;
        }
    }

    updateViewBeginEndMillis() {
        this.viewBeginMillis = this.centerPosMillis - this.heightMillis / 2;
        this.viewEndMillis = this.viewBeginMillis + this.heightMillis;
        this.viewBeginDate(moment(this.viewBeginMillis).format("YY/MM/DD"));
    }

    // -- handle a mouse wheel event
    onMouseWheel(viewModel, event) {
        var dy = event.originalEvent.deltaY;
        if (event.originalEvent.ctrlKey) {
            this.zoomTimeline(dy);
        } else {
            this.scrollTimeline(dy);
        }
    }

    zoomTimeline(deltaY) {
        if (this.zoomY * deltaY < 0) {
            this.zoomY *= 0.5;
        }
        this.zoomY += deltaY;
    }

    scrollTimeline(deltaY) {
        if (this.scrollY * deltaY < 0) {
            this.scrollY *= 0.5;
        }
        this.scrollY += deltaY;
    }

    startingFingerDistance: number;

    onTagCloudTouchStart(data, event) {
        this.tagClicked = true;
        var originalEvent = event.originalEvent;
        var fingerCount = originalEvent.touches.length;
        if (fingerCount >= 2) {
            this.startingFingerDistance = this.calcFingerDistance(originalEvent);
            this.onTagCloudPinchStart(1);
        } else {
            this.onTagCloudSwipeStart(originalEvent);
        }

    }

    onTagCloudTouchMove(data, event) {
        this.tagClicked = false;
        var originalEvent = event.originalEvent;
        var fingerCount = originalEvent.touches.length;
        if (fingerCount >= 2) {
            var currentFingerDistance = this.calcFingerDistance(originalEvent);
            var pinchZoom = currentFingerDistance / this.startingFingerDistance;
            this.onTagCloudPinchMove(pinchZoom);
        } else {
            this.onTagCloudSwipeMove(originalEvent);
        }
    }

    onTagCloudTouchEnd(data, event) {
        var originalEvent = event.originalEvent;
        var fingerCount = originalEvent.touches.length;
        if (fingerCount >= 2) {
            this.onTagCloudPinchEnd();
        } else {
            this.onTagCloudSwipeEnd(originalEvent);
        }

        if (this.tagClicked) {
            $('.tag').css('pointer-events', 'auto');
            var x = originalEvent.changedTouches[0].clientX;
            var y = originalEvent.changedTouches[0].clientY;
            var elem = document.elementFromPoint(x, y);
            $('.tag').css('pointer-events', 'none');

            if ($(elem).hasClass('tag-text')) {
                var mouseEvent: any = document.createEvent('MouseEvents');
                mouseEvent.initMouseEvent('click', true, true, window, 0, x, y, x, y, false, false, false, false, 1, null);
                elem.dispatchEvent(mouseEvent);
            } else {
                this.isSearchMode(false);
                this.searchKeyword("");
                this.clearSeachQuery();
            }
        }
        if (!this.isPlayingButtonPressed()) {
            this.hideTimePointerDetail();
        }
    }

    calcFingerDistance(originalEvent) {
        var touch1 = originalEvent.touches[0];
        var touch2 = originalEvent.touches[1];
        var ox = touch1.clientX - touch2.clientX;
        var oy = touch1.clientY - touch2.clientY;
        return Math.sqrt(ox * ox + oy * oy);
    }

    startTouchY = 0;
    prevTouchY = 0;

    onTagCloudSwipeStart(touchEvent) {
        var clientY = this.getClientY(touchEvent);
        if (!clientY) {
            return;
        }
        this.startTouchY = this.prevTouchY = clientY;
    }

    onTagCloudSwipeMove(touchEvent) {
        var clientY = this.getClientY(touchEvent);
        if (!clientY) {
            return;
        }
        var currentTouchY = clientY;
        this.scrollTimeline(this.prevTouchY - currentTouchY);
        this.prevTouchY = currentTouchY;
    }
    
    // TODO: handle multi touches
    getClientY(touchOrMouseEvent) {
        if (touchOrMouseEvent instanceof MouseEvent) {
            return touchOrMouseEvent.clientY;
        } else if (touchOrMouseEvent instanceof TouchEvent) {
            if (touchOrMouseEvent.targetTouches.length <= 0) {
                return null;
            }
            var touch = touchOrMouseEvent.targetTouches[0];
            return touch.clientY;
        }
        return null;
    }

    onTagCloudSwipeEnd(touchEvent) {
        if (Math.abs(this.startTouchY - this.prevTouchY) < 16) {
            this.scrollY = 0;
        }
    }

    prevPinchZoom = 0;

    onTagCloudPinchStart(pinchZoom) {
        this.prevPinchZoom = pinchZoom;
    }

    onTagCloudPinchMove(pinchZoom) {
        var zoomChange = this.prevPinchZoom / pinchZoom;
        this.zoomTimeline((zoomChange - 1) * 500);
        this.prevPinchZoom = pinchZoom;
    }

    onTagCloudPinchEnd() {
        this.zoomY = 0;
    }

    // -- time indicators
    updateTimeIndicators() {
        var intervalMills;
        if (this.heightMillis < 10 * 60 * 1000) {
            intervalMills = 60 * 1000;
        } else if (this.heightMillis < 60 * 60 * 1000) {
            intervalMills = 5 * 60 * 1000;
        } else if (this.heightMillis < 300 * 60 * 1000) {
            intervalMills = 30 * 60 * 1000;
        } else {
            intervalMills = 3 * 60 * 60 * 1000;
        }
        var millis = Math.ceil(this.viewBeginMillis / intervalMills) * intervalMills;
        var tis: TimeIndicator[] = [];
        while (millis < this.viewEndMillis) {
            tis.push(new TimeIndicator(moment(millis).format('HH:mm'), (millis - this.viewBeginMillis) / this.heightMillis));
            millis += intervalMills;
        }
        this.timeIndicators(tis);
    }

    // -- tag view models
    shownTagViewModelsViewBeginMillis: number;
    shownTagViewModelsHeightMillis: number;

    updateTagViewModels() {
        var timeSeparationNumber = 7;
        var timeSeparationInterval = this.heightMillis * 2 / timeSeparationNumber;
        var beginMillis = Math.floor((this.viewBeginMillis - this.heightMillis / 2) / timeSeparationInterval) * timeSeparationInterval;
        var tagGettingDuration = timeSeparationInterval * timeSeparationNumber;
        var endMillis = beginMillis + tagGettingDuration;
        var beginDate = new Date(beginMillis);
        var beginDateStr = util.formatDateUtc(beginDate);
        var endDate = new Date(endMillis);
        var endDateStr = util.formatDateUtc(endDate);
        var currentMillis = new Date().getTime();
        var totalTime = Math.min(tagGettingDuration, currentMillis - endMillis) / 1000;
        if (totalTime < 200) {
            totalTime = 60;
        } else if (totalTime < 3600) {
            totalTime = 600;
        } else if (totalTime < 86400) {
            totalTime = 3600;
        } else {
            totalTime = 86400;
        }
        console.log(totalTime);
        this.tagModel.getTagList(this.userId, this.groupId, beginDateStr, endDateStr, 50, totalTime).then((result) => {
            var tvms: TagViewModel[] = [];

            var tagCloudDivHeight = $('.tag-cloud').height();
            var tagCloudDivWidth = $('.tag-cloud').width();
            _.forEach(result, (tagResult: any) => {
                var beginDate = moment(tagResult.begin_date).toDate();
                var tag = new Tag(tagResult.keyword_id, tagResult.keyword, beginDate);
                var beginMillis = beginDate.getTime();
                var keywordHash = this.calcKeywordHash(tag.keyword);
                var xRatio = ((keywordHash % 16) / 16 + (tag.begin_date.getTime() % 101) / 101) / 2;
                var x = tagCloudDivWidth * (xRatio * 0.7 + 0.2);
                var y = tagCloudDivHeight * ((beginMillis - this.viewBeginMillis) / this.heightMillis);
                var tvm = new TagViewModel(tag, x, y, beginMillis, tagResult.weight, this.viewBeginMillis, keywordHash);
                tvms.push(tvm);
            });
            // filter tags
            var tvmsPerSep: TagViewModel[][] = _.times(timeSeparationNumber, () => []);
            _.forEach(tvms, (tvm) => {
                var index = util.clamp(
                    Math.floor((tvm.millis - beginMillis) / timeSeparationInterval),
                    0, timeSeparationNumber - 1);
                tvmsPerSep[index].push(tvm);
            });
            tvms = [];
            _.forEach((tvmsPerSep), (tvmsPs) => {
                tvmsPs = (<any>_).sortByOrder(tvmsPs, ['weight'], [false]);
                tvms = tvms.concat((<any>_).slice(tvmsPs, 0, 5));
            });
            // modify weights
            var maxWeight = 0;
            var minWeight = Number.MAX_VALUE;
            _.forEach(tvms, (tvm) => {
                if (tvm.weight > maxWeight) {
                    maxWeight = tvm.weight;
                }
                if (tvm.weight < minWeight) {
                    minWeight = tvm.weight;
                }
            });
            var weightWidth = maxWeight - minWeight;
            if (weightWidth <= 0) {
                weightWidth = 1;
                minWeight -= 0.5;
            }
            _.forEach(tvms, (tvm) => {
                tvm.setWeight((tvm.weight - minWeight) / weightWidth);
            });          
            // arrange tags
            _.times(10, (i) => this.arrangeTagViewModels(tvms, i));
            _.forEach(tvms, (tvm) => {
                tvm.fixPosition()
                if (this.searchQuery) {
                    tvm.checkIfHasSearchQuery(this.searchQuery);
                }
            });
            this.isIncrementingTagOpacity = true;
            this.tagOpacity = 0;
            this.tagViewModels(tvms);
            this.shownTagViewModelsViewBeginMillis = this.viewBeginMillis;
            this.shownTagViewModelsHeightMillis = this.heightMillis;
            this.isShowingTags = true;
            this.updateTagViewModelsTimeout = null;
        }).fail((jqXHR: JQueryXHR, textStatus, errorThrown) => {
            this.errorMessageHandler.setByHttpStatus(jqXHR.status);
            this.updateTagViewModelsTimeout = null;
            // TODO: handle ERR_CONNECTION_REFUSED (set timeout or catch the error)
        });
    }

    calcKeywordHash(keyword: string) {
        var sum = 8;
        for (var i = 0; i < keyword.length; i++) {
            sum += keyword.charCodeAt(i);
        }
        return sum;
    }

    arrangeTagViewModels(tvms: TagViewModel[], count: number) {
        var tagCloudWidth = $('.tag-cloud').width();
        _.forEach(tvms, (tvm) => {
            if ((tvm.position.x < tagCloudWidth * 0.3 && tvm.velocity.x < 0) ||
                (tvm.position.x > tagCloudWidth * 0.9 && tvm.velocity.x > 0)) {
                tvm.velocity.x *= -1;
            }
            tvm.position.x += tvm.velocity.x;
            tvm.position.y += tvm.velocity.y;
            tvm.velocity.x *= 0.2;
            tvm.velocity.y *= 0.2;
            _.forEach(tvms, (aTvm) => {
                if (tvm !== aTvm) {
                    this.checkTagViewModelCollision(tvm, aTvm, (10 - count) * 5);
                }
            });
        });
    }

    checkTagViewModelCollision(tvm1: TagViewModel, tvm2: TagViewModel, repulsion: number) {
        var ox = tvm1.position.x - tvm2.position.x;
        var oy = tvm1.position.y - tvm2.position.y;
        var or = (tvm1.radius + tvm2.radius);
        var pr = or - Math.sqrt(ox * ox + oy * oy);
        if (pr > 0) {
            var p = pr / or;
            var ca = Math.atan2(oy, ox);
            var vx = Math.cos(ca) * p * repulsion;
            var vy = Math.sin(ca) * p * repulsion;
            tvm1.velocity.x += vx;
            tvm1.velocity.y += vy;
            tvm2.velocity.x -= vx;
            tvm2.velocity.y -= vy;
        }
    }

    scrollTagViewModels() {
        var mainHeight = $('.slider-area').height();
        _.forEach(this.tagViewModels(), (tvm: TagViewModel) => {
            var offsetMillis = tvm.arrangedViewBeginMillis - this.viewBeginMillis;
            tvm.setTopByPositionY(tvm.position.y + offsetMillis * mainHeight / this.heightMillis);
        });
    }
    
    // -- speech wave
    speechWaveHeight = 200;
    updateSpeechWaveViewModels() {
        var timeSeparationNumber = 14;
        var timeSeparationInterval = this.heightMillis * 2 / timeSeparationNumber;
        var intervalSeconds = Math.floor(timeSeparationInterval / 1000);
        var maxSpeechCount = intervalSeconds / 5;
        var beginMillis = Math.floor((this.viewBeginMillis - this.heightMillis / 2) / timeSeparationInterval) * timeSeparationInterval;
        var endMillis = beginMillis + timeSeparationInterval * timeSeparationNumber;
        var beginDate = new Date(Math.floor(beginMillis / 1000) * 1000);
        var endDate = new Date(Math.floor(endMillis / 1000) * 1000);
        var swvms: SpeechWaveViewModel[] = [];
        var waveAreaWidth = $('.wave-area').width();
        var waveAreaHeight = $('.wave-area').height();
        var sliderAreaHeight = $('.slider-area').height();
        var colors = ['green', 'lightblue', 'blue'];
        this.speechModel.getSpeechCount(this.userId, this.groupId, beginDate, endDate, intervalSeconds).then((result) => {
            var waveMillis = beginMillis;
            _.forEach((result), (timeAndCount: any) => {
                var millis = moment(timeAndCount.speech_time).valueOf;
                var count = timeAndCount.count;
                var colorIndex = count % 3;
                var width = 0;
                if (count > 0) {
                    width = util.clamp(0.3 + (count / maxSpeechCount) * 0.7, 0, 1.5) * waveAreaWidth;
                }
                var speechWaveViewModel = new SpeechWaveViewModel(colors[colorIndex], waveMillis, width, this.speechWaveHeight);
                var top = 1 - ((1 - (waveMillis - this.viewBeginMillis) / this.heightMillis) / waveAreaHeight * sliderAreaHeight);
                top = top * waveAreaHeight;
                speechWaveViewModel.setTop(top);
                swvms.push(speechWaveViewModel);
                waveMillis += timeSeparationInterval;
            });
            this.speechWaveViewModels(swvms);
        });
    }

    scrollSpeechWaveViewModels() {
        var waveAreaHeight = $('.wave-area').height();
        var sliderAreaHeight = $('.slider-area').height();
        _.forEach((this.speechWaveViewModels()), (swvm: SpeechWaveViewModel) => {
            var top = 1 - ((1 - (swvm.millis - this.viewBeginMillis) / this.heightMillis) / waveAreaHeight * sliderAreaHeight);
            top = top * waveAreaHeight;
            swvm.setTop(top);
        });
    }

    // -- time pointer
    isDraggingTimePointer = false;
    timePointerY = 0;

    initTimePointer() {
        (<any>$(".slider")).slider({
            value: 100,
            orientation: "vertical",
            slide: (ev, ui) => {
                if (!ev.clientY) {
                    return;
                }
                if (this.isDraggingTimePointer) {
                    this.timePointerY = ev.clientY - $(".slider").offset().top;
                    this.updateTimePointerDetail();
                }
            },
            start: (ev, ui) => {
                if (!ev.clientY) {
                    return;
                }
                if (this.isPlayingButtonPressed()) {
                    this.pausePlaying();
                }
                this.isDraggingTimePointer = true;
                this.timePointerY = ev.clientY - $(".slider").offset().top;
                this.updateTimePointerDetail();
                this.showTimePointerDetail();
            },
            stop: (ev, ui) => {
                this.isDraggingTimePointer = false;
                this.hideTimePointerDetail();
                if (this.isPlayingButtonPressed()) {
                    this.startPlaying();
                }
            }
        });
    }

    calcPointedMillis() {
        return this.timePointerY / $('.slider-area').height() * this.heightMillis + this.viewBeginMillis;
    }

    moveTimePointerTo(date: Date) {
        var millis = date.getTime();
        var heightRatio = (millis - this.viewBeginMillis) / this.heightMillis;
        this.timePointerY = heightRatio * $('.slider-area').height();
        (<any>$(".slider")).slider('value', ((1 - heightRatio) * 100));
    }

    moveTimePointerToByTappingSearchResult(date: Date) {
        if (this.isPlayingButtonPressed()) {
            this.pausePlaying();
        }
        this.moveTimePointerTo(date);
        if (this.isPlayingButtonPressed()) {
            this.startPlaying();
        } else {
            this.showTimePointerDetail();
            this.updateTimePointerDetail();
        }
    }

    // -- time pointer detail
    isShowingTimePointerDetail: KnockoutObservable<boolean> = ko.observable<boolean>(false);
    timePointerDetailUserIconPath: KnockoutObservable<string> = ko.observable<string>('');
    timePointerDetailUserName: KnockoutObservable<string> = ko.observable<string>('');
    timePointerDetailDate: KnockoutObservable<string> = ko.observable<string>('');
    timePointerDetailGroupIconPath: KnockoutObservable<string> = ko.observable<string>('');
    timePointerDetailGroupName: KnockoutObservable<string> = ko.observable<string>('');
    timePointerDetailRecogText: KnockoutObservable<string> = ko.observable<string>('');
    timePointerDetailTop: KnockoutObservable<string> = ko.observable<string>('');
    timePointerSpeechShowingMillis: number;

    showTimePointerDetail() {
        clearTimeout(this.getTimePointerSpeechTimeout);
        this.getTimePointerSpeechTimeout = null;
        this.timePointerSpeechShowingMillis = -9999;
        this.isShowingTimePointerDetail(true);
    }

    hideTimePointerDetail() {
        if (!this.isShowingTimePointerDetail()) {
            return;
        }
        this.isShowingTimePointerDetail(false);
    }

    updateTimePointerDetail() {
        this.timePointerDetailTop(this.timePointerY - 200 + 'px');
        if (this.timePointerDetailRecogText().length > 0) {
            return;
        }
        this.timePointerDetailDate(moment(this.calcPointedMillis()).format('HH:mm:ss'));
        this.timePointerDetailUserName('');
    }

    getTimePointerSpeechWhenTimePointerIsMoving() {
        var timePointerMillis = this.calcPointedMillis();
        if (Math.abs(timePointerMillis - this.timePointerSpeechShowingMillis) > 5 * 1000) {
            if (!this.getTimePointerSpeechTimeout) {
                this.getTimePointerSpeechTimeout = setTimeout(() => {
                    this.getTimePointerSpeech();
                    this.getTimePointerSpeechTimeout = null;
                }, this.serverAccessIntervalMillis);
            }
        }
    }

    getTimePointerSpeechTimeout: number = null;
    getTimePointerSpeech() {
        var showingSpeechDuration = this.heightMillis / 7;
        var beforeResult;
        var pointedSpeechDate = new Date(this.calcPointedMillis() + 100);
        this.speechModel.getSpeechListBeforeDate(this.userId, this.groupId, pointedSpeechDate, 1).then((result: any) => {
            if (result.length > 0) {
                beforeResult = result[0];
            }
            return this.speechModel.getSpeechListAfterDate(this.userId, this.groupId, pointedSpeechDate, 1);
        }).then((result: any) => {
            var timePointerMillis = this.calcPointedMillis();
            this.timePointerSpeechShowingMillis = timePointerMillis;
            var afterResult;
            if (result.length > 0) {
                afterResult = result[0];
            }
            if (!beforeResult && !afterResult) {
                this.clearTimePointerDetail();
                this.updateTimePointerDetail();
                return;
            }
            var beforeBeginMillis = 0;
            if (beforeResult) {
                beforeBeginMillis = moment(beforeResult.speech_timestamp).toDate().getTime();
            }
            var afterResultMillis = 0;
            if (afterResult) {
                afterResultMillis = moment(afterResult.speech_timestamp).toDate().getTime();
            }
            var speech;
            if (Math.abs(beforeBeginMillis - timePointerMillis) > Math.abs(afterResultMillis - timePointerMillis)) {
                speech = afterResult;
            } else {
                speech = beforeResult;
            }
            var beginMillis = moment(speech.speech_timestamp).toDate().getTime();
            if (Math.abs(beginMillis - timePointerMillis) > showingSpeechDuration) {
                this.clearTimePointerDetail();
            } else {
                this.timePointerDetailRecogText(speech.recog_content);
                var userIcon = new Icon(null, speech.user.icon.filename, null, null, null);
                this.timePointerDetailUserIconPath(userIcon.iconPath);
                this.timePointerDetailDate(moment(speech.speech_timestamp).format('HH:mm:ss'));
                this.timePointerDetailUserName(speech.user.name);
                if (speech.group) {
                    var groupIcon = new Icon(null, speech.group.icon.filename, null, null, null);
                    this.timePointerDetailGroupIconPath(groupIcon.iconPath);
                    this.timePointerDetailGroupName(speech.group.name);
                } else {
                    this.timePointerDetailGroupIconPath('');
                    this.timePointerDetailGroupName('');
                }
            }
            this.updateTimePointerDetail();
        }).fail((jqXHR: JQueryXHR, textStatus, errorThrown) => {
            this.errorMessageHandler.setByHttpStatus(jqXHR.status);
            // TODO: handle ERR_CONNECTION_REFUSED (set timeout or catch the error)
        });
    }

    clearTimePointerDetail() {
        this.timePointerDetailUserIconPath('');
        this.timePointerDetailRecogText('');
        this.timePointerDetailGroupIconPath('');
        this.timePointerDetailGroupName('');
    }

    // -- tag clicked
    tagClicked = false;
    tagTapped = false;

    onTagMouseDown() {
        this.tagClicked = true;
        return true;
    }

    onTagMouseUp(data, event) {
        if (this.tagClicked) {
        }
        this.tagClicked = false;
        return true;
    }

    onTagClick(data, event) {
        this.isSearchMode(true);
        this.searchKeyword(data.tag.keyword);
        //this.searchQuery = data.tag.keyword;
        //this.searchSpeeches();

        event.preventDefault();
        event.stopPropagation();
        this.tagTapped = true;
        return true;
    }

    searchSpeeches() {
        var date_since = moment(this.centerPosMillis - (this.heightMillis / 2)).toDate();
        var date_until = moment(this.centerPosMillis + (this.heightMillis / 2)).toDate();
        this.speechModel.getSpeechListByKeyword(this.userId, this.groupId, date_since, date_until, this.searchQuery, 10).done((result) => {
            var data = [];
            _.forEach((result), (speechResult: any) => {
                var icon = new Icon(speechResult.user.icon.id, speechResult.user.icon.filename, speechResult.user.icon.icon_type, null, null);
                var speechUser = new User(null, null, speechResult.user.id, speechResult.user.account, null, null, speechResult.user.name, icon, null, null);
                if (speechResult.group) {
                    var groupIcon = new Icon(speechResult.group.icon.id, speechResult.group.icon.filename, speechResult.group.icon.icon_type, null, null);
                    var speechGroup = new Group(speechResult.group.id, speechResult.group.name, groupIcon, null, null);
                    var speech = new Speech(speechResult.id, speechResult.recog_content, moment(speechResult.speech_timestamp).toDate(), moment(speechResult.speech_endtimestamp).toDate(), speechResult.session_key, speechUser, speechGroup);
                } else {
                    var speech = new Speech(speechResult.id, speechResult.recog_content, moment(speechResult.speech_timestamp).toDate(), moment(speechResult.speech_endtimestamp).toDate(), speechResult.session_key, speechUser, null);
                }
                var speechViewModel = new SpeechViewModelOnTagCloud(this, speech);
                data.push(speechViewModel);
            });
            this.speechViewModels(data);
            this.arrangeSpeechViewModels();
            _.forEach(this.tagViewModels(), (tvm) => {
                tvm.checkIfHasSearchQuery(this.searchQuery);
            });
        });
    }

    arrangeSpeechViewModels() {
        var mainHeight = $('.slider-area').height();
        _.forEach(this.speechViewModels(), (svm) => {
            var y = mainHeight * (svm.beginDate.getTime() - this.viewBeginMillis) / this.heightMillis;
            svm.top(y + 'px');
        });
    }

    clearSeachQuery() {
        this.searchQuery = null;
        _.forEach(this.tagViewModels(), (tvm) => {
            tvm.checkIfHasSearchQuery(this.searchQuery);
        });
        this.speechViewModels([]);
    }

    onTagTouchEnd(data, event) {
        this.tagTapped = false;
        return true;
    }

    // -- buttons clicked
    onMoveToTimelineClick() {
        var pointedMillis = this.calcPointedMillis();
        var viewSpeechCount = 10; //取得する発話件数(TODO:ひとまず10を固定値で設定)
        //ローカルストレージにタイムライン画面の表示日時と発話件数をセット
        AppDataManager.setTimelineViewTargetDate(new Date(pointedMillis));
        AppDataManager.setTimelineViewCount(viewSpeechCount);

        this.onPauseApp();
        //タイムライン画面に遷移
        window.location.href = 'timeline.html';
        /*if (this.groupId) {
            window.location.href = 'timeline.html?group_id=' + this.groupId + '&date=' + moment(pointedMillis).utc().format("YYYY-MM-DD[T]HH:mm:ss.SSS[Z]") + '&count=' + viewSpeechCount;
        } else {
            window.location.href = 'timeline.html?date=' + moment(pointedMillis).utc().format("YYYY-MM-DD[T]HH:mm:ss.SSS[Z]") + '&count=' + viewSpeechCount;
        }*/
        //window.location.href = 'timeline?groupid=' + this.groupId + '&date=' + moment(pointedMillis).format("YYYY-MM-DD[T]HH:mm:ss") + '&count=' + viewSpeechCount;
    }

    onGroupButtonClick() {

        this.onPauseApp();
        
        AppDataManager.setBeforeGroupListView("tag_cloud.html");
        window.location.href = "group_list.html";
        /*if (!this.groupId) {
            window.location.href = "group_list.html";
        } else {
            window.location.href = "group_list.html?group_id=" + this.groupId;
        }*/
    }

    onSearchButtonClick() {
        //検索モードのON/OFF
        if (this.isSearchMode()) {
            this.isSearchMode(false);
            this.searchKeyword("");
            this.clearSeachQuery();
        } else {
            this.isSearchMode(true);
        }
    }

    showConfig() {
        //ローカルストレージに遷移前の画面表示情報をセット(TODO:スケールは？)
        AppDataManager.setTagCloudViewTargetDate(new Date(this.centerPosMillis));
        AppDataManager.setBeforeView("tag_cloud.html");

        this.onPauseApp();
        //設定画面に遷移
        window.location.href = "config.html";
    }
        
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
        setUpdateAudioVolumeFunc(null);
        setRecogResultErrorFunc(null);
        this.updateRecogTmpResult("");
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
    voicePlayer: any;
    isPlayingButtonPressed: KnockoutObservable<boolean> = ko.observable<boolean>(false);
    isStoppedByUser: boolean;

    onPlayButtonClicked() {
        if (this.isPlayingButtonPressed()) {
            //再生中なら停止
            this.stopPlaying();
        } else {
            this.startPlaying();
        }
    }

    startPlaying() {
        this.isPlayingButtonPressed(true);
        this.playFromTimePointer();
        this.showTimePointerDetail();
    }

    stopPlaying() {
        if (!this.isPlayingButtonPressed()) {
            return;
        }
        this.onPlayEnded();
        this.isStoppedByUser = true;
        this.voicePlayer.stop();
    }

    onPlayEnded() {
        this.isPlayingButtonPressed(false);
        this.stopMovingTimePointerByPlaying();
        this.isPlayingVoice = false;
        this.hideTimePointerDetail();
    }

    pausePlaying() {
        this.stopMovingTimePointerByPlaying();
        this.isPlayingVoice = false;
        this.voicePlayer.stop();
    }

    playFromTimePointer() {
        var pointedDate = new Date(this.calcPointedMillis());
        this.playFrom(pointedDate);
    }

    playFrom(from: Date) {
        // play the group voice
        //  - check if another user's speech exists at the pointed date
        //   -- if exists: play the speech until speech.speech_endtimestamp
        //   -- ifnot: check until 1 minutes later if another user's speech exists
        //    -- if exists: play the login user's voice until speech.speech_timestamp
        //    -- ifnot: play the login user's voice until 1 minutes later
        //  - repeat this process when Media.MEDIA_STOPPED is fired
        if (this.groupId) {
            this.speechModel.getSpeechListUntilDate(null, this.groupId, from, 5).done((result) => {
                var isPlayingSpeech = false;
                _.forEach(result, (speech: any) => {
                    // don't play the speech voice when speech.user.id === login user's id
                    if (speech.user.id !== this.userId && moment(speech.speech_endtimestamp).isAfter(moment(from))) {
                        this.playVoice(speech.session_key, from, moment(speech.speech_endtimestamp).toDate());
                        isPlayingSpeech = true;
                        return false;
                    }
                });
                if (!isPlayingSpeech) {
                    this.speechModel.getSpeechListAfterDate(null, this.groupId, from, 5).done((result) => {
                        var isPlayingToNextSpeech = false;
                        _.forEach(result, (speech: any) => {
                            if (speech.user.id !== this.userId && moment(speech.speech_timestamp).isBefore(moment(from).add('minutes', 1))) {
                                isPlayingToNextSpeech = true;
                                this.playLoginUsersVoice(from, moment(speech.speech_timestamp).toDate());
                                return false;
                            }
                        });
                        if (!isPlayingToNextSpeech) {
                            this.playLoginUsersVoice(from, moment(from).add('minutes', 1).toDate());
                        }
                    });
                }
            });
        } else {
            this.playLoginUsersVoice(from, moment(from).add('minutes', 1).toDate());
        }
    }

    playLoginUsersVoice(from: Date, to: Date) {
        this.voiceModel.getVoiceListBeforeDate(this.userId, null, from, 1).done((result) => {
            console.log(result);
            if (result.length > 0) {
                var data = result[0];
                var beginDate = moment(data.begin_date).toDate();
                var endDate: Date;
                if (data.end_date) {
                    endDate = moment(data.end_date).toDate();
                }
                if (endDate && moment(endDate).isAfter(moment(from))) {
                    if (moment(endDate).isAfter((moment(to)))) {
                        this.playVoice(data.session_key, from, to);
                    } else {
                        this.playVoice(data.session_key, from, endDate);
                    }
                } else {
                    this.playLoginUserVoiceAfter(from, to);
                }
            } else {
                this.playLoginUserVoiceAfter(from, to);
            }
        });

    }

    playLoginUserVoiceAfter(from: Date, to: Date) {
        this.voiceModel.getVoiceListAfterDate(this.userId, null, from, 1).done((result) => {
            console.log(result);
            if (result.length > 0) {
                var data = result[0];
                if (this.groupId) {
                    // in the group view check if the another users speech exists until data.begin_date
                    this.speechModel.getSpeechListAfterDate(null, this.groupId, from, 5).done((result) => {
                        var isPlayingToNextSpeech = false;
                        _.forEach(result, (speech: any) => {
                            if (speech.user.id !== this.userId && moment(speech.speech_timestamp).isBefore(moment(data.begin_date))) {
                                isPlayingToNextSpeech = true;
                                var nextPlayingDate = moment(speech.speech_timestamp).add(50, "milliseconds").toDate();
                                //this.moveTimePointerTo(nextPlayingDate);
                                this.playFrom(nextPlayingDate);
                                return false;
                            }
                        });
                        if (!isPlayingToNextSpeech) {
                            var nextPlayingDate = moment(data.begin_date).add(50, "milliseconds").toDate();
                            //this.moveTimePointerTo(nextPlayingDate);
                            this.playFrom(nextPlayingDate);
                        }
                    });
                } else {
                    var nextPlayingDate = moment(data.begin_date).add(50, "milliseconds").toDate();
                    //this.moveTimePointerTo(nextPlayingDate);
                    this.playFrom(nextPlayingDate);
                }
            } else {
                if (this.groupId) {
                    this.playAnotherUsersSpeechAfter(from);
                } else {
                    this.onPlayEnded();
                }
            }
        });
    }
    
    // in the group view check if the another users speech exists
    playAnotherUsersSpeechAfter(from: Date) {
        this.speechModel.getSpeechListAfterDate(null, this.groupId, from, 5).done((result) => {
            var isPlayingToNextSpeech = false;
            _.forEach(result, (speech: any) => {
                if (speech.user.id !== this.userId) {
                    isPlayingToNextSpeech = true;
                    var nextPlayingDate = moment(speech.speech_timestamp).add(50, "milliseconds").toDate();
                    //this.moveTimePointerTo(nextPlayingDate);
                    this.playFrom(nextPlayingDate);
                    return false;
                }
            });
            if (!isPlayingToNextSpeech) {
                this.onPlayEnded();
            }
        });
    }

    isPlayingVoice = false;
    playingVoiceBeginDate: Date;
    playingVoiceEndDate: Date;
    playVoice(sessionKey: string, from: Date, to: Date) {
        if (this.isPlayingVoice) {
            return;
        }
        this.isPlayingVoice = true;
        console.log(moment(from).format("hh:mm:ss.SSS[Z]"));
        console.log(moment(to).format("hh:mm:ss.SSS[Z]"));
        this.playingVoiceBeginDate = from;
        this.playingVoiceEndDate = to;
        var src = this.voiceModel.getVoiceAudioUrl(sessionKey, from, to);
        console.log(src);
        this.voicePlayer = new Media(src, this.onPlaySuccess, this.onPlayError, this.onPlayStatus);
        this.voicePlayer.play();
        this.startMovingTimePointerByPlaying();
    }

    onPlaySuccess() {

    }

    onPlayError(error) {
        if (error.code === MediaError.MEDIA_ERR_ABORTED) {
            console.log('MediaError.MEDIA_ERR_ABORTED')
        }
        if (error.code === MediaError.MEDIA_ERR_NETWORK) {
            console.log('MediaError.MEDIA_ERR_NETWORK')
        }
        if (error.code === MediaError.MEDIA_ERR_DECODE) {
            console.log('MediaError.MEDIA_ERR_DECODE')
        }
        if (error.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
            console.log('MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED')
        }
        this.onPlayEnded();
    }

    onPlayStatus(status) {
        if (status === Media.MEDIA_STOPPED) {
            if (!this.isPlayingVoice) {
                return;
            }
            this.isPlayingVoice = false;
            if (this.isStoppedByUser) {
                this.isStoppedByUser = false;
                return;
            }
            this.stopMovingTimePointerByPlaying();
            this.moveTimePointerTo(this.playingVoiceEndDate);
            this.playFrom(this.playingVoiceEndDate);
        }
    }

    checkMediaRunningInterval: number;
    startMovingTimePointerByPlaying() {
        this.stopMovingTimePointerByPlaying();
        this.checkMediaRunningInterval = setInterval(this.checkMediaRunning, 200);
    }

    stopMovingTimePointerByPlaying() {
        if (this.checkMediaRunningInterval) {
            clearInterval(this.checkMediaRunningInterval);
        }
    }

    checkMediaRunning() {
        this.voicePlayer.getCurrentPosition((result) => {
            var currentPlayingDate = moment(this.playingVoiceBeginDate).add("seconds", result).toDate();
            this.moveTimePointerTo(currentPlayingDate);
        });
    }
}
