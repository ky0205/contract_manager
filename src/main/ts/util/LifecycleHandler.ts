/// <reference path="../typings/jquery.d.ts" />
/// <reference path="../typings/knockout.d.ts" />
/// <reference path="../typings/lodash.d.ts" />

module LifecycleHandler {
    var isInitialized = false;
    var autoLoginUtil: AutoLoginUtil; //自動ログインモジュール

	export function init() {
        onPauseAppFunc = null;
        onResumeAppFunc = null;
        if (isInitialized) {
            return;
        }
        isInitialized = true;
        
        //cordovaのロード完了イベント
        document.addEventListener("deviceready", onDeviceReady, false);
        
        //自動ログイン開始
        autoLoginUtil = new AutoLoginUtil();
        autoLoginUtil.startAutoLogin();
    }
    
    var onPauseAppFunc: Function;
    export function setOnPauseAppFunc(func: Function) {
        onPauseAppFunc = func;
    }
    
    /**
     * 
     */
    function onDeviceReady(){
        console.log("deviceReady");
        
        //アプリのバックグラウンド移行時、フォアグランド移行時のイベント
        document.addEventListener("pause", pauseApp, false);
        document.addEventListener("resign", pauseApp, false);
        document.addEventListener("resume", resumeApp, false);
        document.addEventListener("active", resumeApp, false);
        
        document.removeEventListener("deviceready", onDeviceReady, false);
    }
    
    /**
     * アプリがバックグランドになった時の処理
     */     
    function pauseApp(){
        console.log("pauseApp");
        
        //自動ログイン停止
        autoLoginUtil.stopAutoLogin();
        
        if (onPauseAppFunc) {
            onPauseAppFunc();
        }
    }
    
    var onResumeAppFunc: Function;
    export function setOnResumeAppFunc(func: Function) {
        onResumeAppFunc = func;
    }
    
    /**
     * アプリがフォアグランドに戻ってきた時の処理
     */
    function resumeApp(){
        console.log("resumeApp");
        
        //自動ログイン開始
        autoLoginUtil.startAutoLogin();
        
        if (onResumeAppFunc) {
            onResumeAppFunc();
        }
    }
}
