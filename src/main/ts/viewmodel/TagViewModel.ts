/// <reference path="../typings/knockout.d.ts" />

class TagViewModel {
    id: number;
    keyword: string;
    top: KnockoutObservable<string> = ko.observable("");
    left: KnockoutObservable<string> = ko.observable("");
    opacity: KnockoutObservable<number> = ko.observable(0);
    width: string;
    height: string;
    millis: number;
    weight: number;
    radius: number;
    sizeClassName: string;
    baseColorClassName: string;
    colorClassName: KnockoutObservable<string> = ko.observable<string>("");
    arrangedViewBeginMillis: number;
    position: { x: number, y: number } = { x: 0, y: 0 };
    velocity: { x: number, y: number } = { x: 0, y: 0 };
    tagFadeInOutClassName: KnockoutObservable<string> = ko.observable<string>("tag-fadein");
    animationDelay: string;

    constructor
        (public tag: Tag, x: number, y: number,
            millis: number, weight: number, arrangedViewBeginMillis: number, keywordHash: number) {
        this.id = tag.id;
        this.keyword = tag.keyword;
        this.position.x = x;
        this.position.y = y;
        this.millis = millis;
        this.weight = weight;
        var kh = keywordHash % 3;
        if (kh === 0) {
            this.baseColorClassName = 'tag-blue';
        } else if (kh === 1) {
            this.baseColorClassName = 'tag-lightblue';
        } else {
            this.baseColorClassName = 'tag-green';
        }
        this.colorClassName(this.baseColorClassName);
        this.arrangedViewBeginMillis = arrangedViewBeginMillis;
        this.animationDelay = Math.floor(y / 2 + Math.random() * 500) + "ms";
    }
    
    setWeight(weight: number) {
        this.weight = weight;
        if (weight > 0.66) {
            this.radius = 157;
            this.sizeClassName = "tag-large";
        } else if (weight > 0.33) {
            this.radius = 107;
            this.sizeClassName = "tag-middle";
        } else {
            this.radius = 75;
            this.sizeClassName = "tag-small";
        }
        this.radius *= 2;        
    }
    
    fixPosition() {
        this.setLeftByPositionX(this.position.x);
        this.setTopByPositionY(this.position.y);
    }
    
    setLeftByPositionX(x: number) {
        this.setLeft(x - this.radius);
    }

    setTopByPositionY(y: number) {
        this.setTop(y - this.radius);
    }

    setTop(v: number) {
        this.top(v + 'px');
    }

    setLeft(v: number) {
        this.left(v + 'px');
    }
    
    checkIfHasSearchQuery(keyword: string = null) {
        if (keyword && this.keyword !== keyword) {
            this.colorClassName('tag-gray');
        } else {
            this.colorClassName(this.baseColorClassName);            
        }
    }
}
