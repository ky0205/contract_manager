/// <reference path="../typings/jquery.d.ts" />
/// <reference path="../typings/bluebird.d.ts" />
/// <reference path="../typings/lodash.d.ts" />

class VoiceRecognizer {
    static sampleNumber = 128 * 120;
    recognizingId: string;
    beginMillis: number;

    constructor(public viewModel: MicrophoneViewModel) {
    }

    /*
    sendRecord(record: Db.record): Promise<any> {
        return new Promise((resolve: (result: Db.voice) => void, reject) => {
            HttpUtil.postJson(serverUrl + 'record', {
                beginMillis: record.begin_millis,
                endMillis: record.end_millis,
                title: record.title
            }).then(
                (result) => {
                    resolve(result);
                }).fail(
                (err) => {
                    reject(err);
                });
        });
    }

    beginRecord(recognizingId: string) {
        this.recognizingId = recognizingId;
    }

    beginVoice(voice: Db.voice): Promise<Db.voice> {
        return HttpUtil.postJsonPromise(serverUrl + 'voiceBegin', {
                recognizingId: this.recognizingId,
                recognizingVoiceId: voice.id,
                beginMillis: voice.begin_millis,
                endMillis: voice.end_millis
            }, voice);
    }

    endVoice(voice: Db.voice): Promise<any> {
        return HttpUtil.postJsonPromise(serverUrl + 'voiceEnd', {
            recognizingId: this.recognizingId,
            recognizingVoiceId: voice.id
        });
    }

    endRecord(): Promise<any> {
        return HttpUtil.postJsonPromise(serverUrl + 'recordEnd', {
            recognizingId: this.recognizingId,
        });
    }

    // function to put the long audio
    putAudio(voice: Db.voice): Promise<Db.voice> {
        var buffer: Float32Array = this.downsampleBuffer(voice.buffer, 16000, Microphone.sampleRate);
        var bufferIndex = 0;
        var bufferLength = buffer.length;
        var sampleNumber = VoiceRecognizer.sampleNumber;
        var promises = [];
        var voiceId = 1;
        while (bufferLength > 0) {
            if (sampleNumber > bufferLength) {
                sampleNumber = bufferLength;
            }
            var encodedData = new Int16Array(sampleNumber);
            _.forEach(buffer.subarray(bufferIndex, bufferIndex + sampleNumber),
                (v, idx) => {
                    var ed: number;
                    if (v >= 0) {
                        ed = Math.floor(v * 0x7fff);
                    } else {
                        ed = 0xffff - Math.floor(-v * 0x7fff);
                    }
                    encodedData[idx] = ed;
                });
            promises.push(HttpUtil.putAudioToRecord(serverUrl + 'voice', encodedData, voiceId,
                this.recognizingId, voice.id));
            bufferIndex += sampleNumber;
            bufferLength -= sampleNumber;
            voiceId++;
        }
        return new Promise((resolve: (result: Db.voice) => void, reject) => {
            Promise.all(promises).then(
                () => {
                    resolve(voice);
                }).catch(
                (err) => {
                    reject(err);
                });
        });
    }
    */

    downsampleBuffer(buffer, rate, sampleRate) {
        if (rate === sampleRate) {
            return buffer;
        }
        if (rate > sampleRate) {
            throw "downsampling rate should be smaller than original sample rate";
        }
        var sampleRateRatio = sampleRate / rate;
        var newLength = Math.round(buffer.length / sampleRateRatio);
        var result = new Float32Array(newLength);
        var offsetResult = 0;
        var offsetBuffer = 0;
        while (offsetResult < result.length) {
            var nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
            var accum = 0, count = 0;
            for (var i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
                accum += buffer[i];
                count++;
            }
            result[offsetResult] = accum / count;
            offsetResult++;
            offsetBuffer = nextOffsetBuffer;
        }
        return result;
    }

    //
    // using functions below when a realtime recognizion is needed
    //
    static asrUrl = 'http://10.45.232.154:8080/MediaIntelligence/SpeechRecog/';
    static asrId = 'asruser';
    static asrPassword = 'asruser';
    isLoggedInAsr = false;
    asrUuid: string = null;
    voiceId: number;
    interval: number;
    microphone: Microphone;
    buffer: Float32Array;
    bufferIndex: number;

    setupMicrophone() {
        this.microphone = new Microphone(this.viewModel);
        this.buffer = new Float32Array(VoiceRecognizer.sampleNumber * 5);
        this.bufferIndex = 0;
        this.listener = this.listener.bind(this);
        this.getResult = this.getResult.bind(this);
    }

    begin() {
        this.microphone.begin(this.listener).then(
            () => {
                if (Microphone.sampleRate < 16000) {
                    this.viewModel.setStatusText('microphone sample rate should be >= 16000');
                    this.microphone.setIsReady(false);
                } else {
                    this.login();
                }
            }).catch(
            (err) => {
                this.viewModel.setStatusText('setup microphone failed');
            });
    }

    end() {
        if (!this.microphone.end()) {
            return;
        }
        this.logout();
    }

    login(): JQueryPromise<string> {
        var defer = $.Deferred();
        if (this.isLoggedInAsr) {
            defer.reject('already logined');
            return defer;
        }
        // TODO: check if this 'self' is really needed?
        var self: VoiceRecognizer = this;
        HttpUtil.postJson(VoiceRecognizer.asrUrl + 'login', {
            id: VoiceRecognizer.asrId,
            password: VoiceRecognizer.asrPassword,
            model: {
                audiotype: 'audio/x-linear',
                resulttype: 'one_best',
                resultcount: 1,
            }
        }).
            done(
            (result) => {
                self.bufferIndex = 0;
                self.isLoggedInAsr = true;
                self.asrUuid = result;
                self.voiceId = 1;
                self.interval = setInterval(self.getResult, 500);
                defer.resolve(self.asrUuid);
            }).
            fail(
            (xhr, textStatus, errorThrown) => {
                console.log('login failed ' + textStatus);
                self.viewModel.setStatusText('setup voice recognition failed');
                defer.reject('login failed ' + textStatus);
            });
        return defer;
    }

    getResult() {
        //return () => {
            if (!this.isLoggedInAsr) {
                return;
            }
            var self: VoiceRecognizer = this;
            HttpUtil.getJson(VoiceRecognizer.asrUrl + self.asrUuid + '/result').
                done(
                (result) => {
                    if (!result || Object.keys(result).length === 0) {
                        return;
                    }
                    _.forEach(result,(r:any) => {
                        var resultType = r[0];
                        var resultContent = r[1];
                        if (resultType === 'RESULT') {
                            this.viewModel.addRecogResult(resultContent);
                        } else if (resultType === 'TMP_RESULT') {
                        } else if (resultType === 'NO_DATA') {
                        }
                    });
                }).
                fail(
                (xhr, textStatus: string, errorThrown) => {
                    if (textStatus === 'parsererror') {
                        // null result
                    } else {
                        console.log('get result failed ' + textStatus);
                    }
                });
        //};
    }

    logout() {
        if (!this.isLoggedInAsr) {
            return;
        }
        var self = this;
        HttpUtil.postJson(VoiceRecognizer.asrUrl + this.asrUuid + '/logout', {}).
            done(
            () => {
                self.isLoggedInAsr = false;
                clearInterval(self.interval);
            }).
            fail(
            (xhr, textStatus, errorThrown) => {
                console.log('logout failed ' + textStatus);
                self.isLoggedInAsr = false;
                clearInterval(self.interval);
            });
    }

    listener(orgData: Float32Array) {
        if (!this.isLoggedInAsr) {
            return;
        }
        var data: Float32Array = this.downsampleBuffer(orgData, 16000, Microphone.sampleRate);
        this.buffer.set(data, this.bufferIndex);
        this.bufferIndex += data.length;
        while (this.bufferIndex >= VoiceRecognizer.sampleNumber) {
            var encodedData = new Int16Array(VoiceRecognizer.sampleNumber);
            _.forEach(this.buffer.subarray(0, VoiceRecognizer.sampleNumber),
                (v, idx) => {
                    var ed: number;
                    if (v >= 0) {
                        ed = Math.floor(v * 0x7fff);
                    } else {
                        ed = 0xffff - Math.floor(-v * 0x7fff);
                    }
                    encodedData[idx] = ed;
                });
            HttpUtil.putAudio(VoiceRecognizer.asrUrl + this.asrUuid + '/voice', encodedData, this.voiceId);
            this.voiceId++;
            this.buffer.set(this.buffer.subarray(VoiceRecognizer.sampleNumber));
            this.bufferIndex -= VoiceRecognizer.sampleNumber;
        }
    }
}
