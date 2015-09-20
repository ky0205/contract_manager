/// <reference path="../typings/jquery.d.ts" />
/// <reference path="../typings/bluebird.d.ts" />

class HttpUtil {
    static postJson(url: string, data: any): JQueryXHR {
        return $.ajax({
            type: "Post",
            contentType: "application/json",
            dataType: "text",
            url: url,
            data: JSON.stringify(data)
        });
    }

    static postJsonPromise(url: string, data: any, resolvedResult: any = null): Promise<any> {
        return new Promise((resolve: (result: any) => void, reject) => {
            HttpUtil.postJson(url, data).then(
                (result) => {
                    if (resolvedResult) {
                        resolve(resolvedResult);
                    } else {
                        resolve(result);
                    }
                }).fail(
                (err) => {
                    reject(err);
                });
        });
    }

    static getJson(url: string, data: any = null): JQueryXHR {
        var params: any = {
            type: "Get",
            dataType: "json",
            url: url,
        };
        if (data) {
            params.data = data;
        }
        return $.ajax(params);
    }

    static getJsonPromise(url: string, data: any = null, resolvedResult: any = null, resultParam: any = null): Promise<any> {
        return new Promise((resolve: (result: any) => void, reject) => {
            HttpUtil.getJson(url, data).then(
                (result) => {
                    if (resolvedResult) {
                        resolve(resolvedResult);
                    } else {
                        if (resultParam) {
                            resolve({ result: result, param: resultParam });
                        } else {
                            resolve(result);
                        }
                    }
                }).fail(
                (err) => {
                    reject(err);
                });
        });
    }

    static putAudio(url: string, voiceData: Int16Array, voiceId: number): JQueryXHR {
        var formData = new FormData();
        formData.append('voiceid', voiceId);
        formData.append('voice', new Blob([voiceData], { type: "application/octet-stream" }), 'voicedata.wav');
        return $.ajax({
            type: "Put",
            url: url,
            processData: false,
            contentType: false,
            dataType: "json",
            data: formData
        });
    }

    static putAudioToRecord(url: string, voiceData: Int16Array, voiceId: number,
        recognizingId: string, recognizingVoiceId: number): JQueryXHR {
        var formData = new FormData();
        formData.append('voiceid', voiceId);
        // add ids for storing Voice at the server side
        formData.append('recognizingId', recognizingId);
        formData.append('recognizingVoiceId', recognizingVoiceId);
        formData.append('voice', new Blob([voiceData], { type: "application/octet-stream" }), 'voicedata.wav');
        return $.ajax({
            type: "Put",
            url: url,
            processData: false,
            contentType: false,
            data: formData
        });
    }
}
