// mymenu.js

;(function($, window, Modernizr, undefined) {

    "use strict";


    var mymenu_debug = false;


    var _mylog = function(message) {
        if(window.console && mymenu_debug) {
            window.console.log(message);
        }
    };

    var _myerr = function(message) {
        if(window.console) {
            window.console.error(message);
        }
    };


    $.mymenu = function(options, element) {
        this.debug = mymenu_debug;
        this.$el = $(element);

        this.initialize(options);
    };

    // optionsで上書き可
    $.mymenu.defaults = {
        list_default_width: "",

        global_event_close_menu: false,

        menu_direction: "vertical",
        //menu_direction: "horizontal",

        animation_class: {
            trigger: {
                in: ".mymenu_animate_in2",
                out: ".mymenu_animate_out2",
            },
            levelchange: {
                in: ".mymenu_animate_in3",
                out: ".mymenu_animate_out3",
            },
        },
    };


    $.mymenu.prototype.initialize = function(options) {
        this.options = $.extend(true, {}, $.mymenu.defaults, options);

        this.config();
        this.initialize_component();
        this.initialize_event();
    };


    $.mymenu.prototype.config = function() {
        var self = this;

        {
            var create_selector_and_jobj = function(name, element) {
                self.els[name] = element;
                self.els["$" + name] = self.$el.find(element);
            };

            this.els = {
                wrappertag: "section",
                itemtag: "nav",

                // トリガー
                trigger: ".mymenu_trigger",
                triggeractive: ".mymenu_trigger_active",
                $trigger: $(".mymenu_trigger"),

                // 戻るボタン 自動的に追加
                back: ".mymenu_back",
                $backelement: $("<nav class='mymenu_back'><a>Back</a></nav>"),

                // submenuをオープンしているliに付けられるクラス
                submenuopen: ".mymenu_submenuopen",

                // back以外のliアイテム
                $menuitems: this.$el.find("nav").not(".mymenu_back"),

                // これが付いているliはユーザーが手動でオープン
                // ウェイトが入るときのため
                useropen: "section.mymenu_menu_useropen",

                // 現在の階層から見た新しいulに付くクラス
                flyin: ".mymenu_flyin",

                // mymenu_wrapper下に入れるダミーのul
                dummy: ".mymenu_dummy",
                $dummyelement: $("<section class='mymenu_dummy'></section>"),

                // title
                title: ".mymenu_title",

                // label
                label: ".mymenu_label",
                label2: ".mymenu_label2",
            };

            // elsにclass名とjquery objectを登録
            // ex. els.mainmenu, els.$mainmenu
            create_selector_and_jobj("mainmenu", "section.mymenu_mainmenu");
            create_selector_and_jobj("submenu", "section.mymenu_submenu");

            $.mymenu.validate_equal(this.$el, 1);
            $.mymenu.validate_equal(this.els.$mainmenu, 1);
            $.mymenu.validate_equal(this.els.$trigger, 1);
        }

        {
            var animation_end_event_names = {
                "WebkitAnimation" : "webkitAnimationEnd",
                "OAnimation"      : "oAnimationEnd",
                "msAnimation"     : "MSAnimationEnd",
                "animation"       : "animationend",
            };

            var transition_end_event_names = {
                "WebkitTransition" : "webkitTransitionEnd",
                "MozTransition"    : "transitionend",
                "OTransition"      : "oTransitionEnd",
                "msTransition"     : "MSTransitionEnd",
                "transition"       : "transitionend",
            };

            this.animation_end_event_name = animation_end_event_names[Modernizr.prefixed("animation")];
            this.transition_end_event_name = transition_end_event_names[Modernizr.prefixed("transition")];
            this.support_animations = Modernizr.cssanimations;
            this.support_transitions = Modernizr.csstransitions;
        }

        {
            if(!this.options.list_default_width) {
                this.options.list_default_width = this.els.$mainmenu.width();
            }
        }
    };


    $.mymenu.prototype.initialize_component = function() {
        this.$el.css("position", "relative");

        this.els.$submenu.prepend(this.els.$backelement.clone());
        this.els.$back = this.$el.find(this.els.back);

        if(this.els.$mainmenu.css("display") !== "none") {
            this.els.$trigger.addClass($.mymenu.getclass(this.els.triggeractive));
        }

        this.els.$mainmenu.before(this.els.$dummyelement.clone());
    };


    $.mymenu.prototype.initialize_event = function() {
        var self = this;

        $("body").on("click", function(event) {
            if(self.options.global_event_close_menu) {
                if(self.els.$trigger.hasClass($.mymenu.getclass(self.els.triggeractive))) {
                    slef.hide_menu();
                }
            }
        });

        this.els.$trigger.on("click", function(event) {
            event.stopPropagation();

            if(!self.els.$trigger.hasClass($.mymenu.getclass(self.els.triggeractive))) {
                self.show_menu();
            }
            else {
                self.hide_menu();
            }
        });

        this.els.$menuitems.on("click", function(event) {
            event.stopPropagation();

            var isuseropen = $(this)
                .children(self.els.wrappertag)
                .hasClass($.mymenu.getclass(self.els.useropen));

            if(!isuseropen) {
                self.open_submenu(this);
            }
        });

        this.els.$back.on("click", function(event) {
            event.stopPropagation();
            self.close_submenu(this);
        });
    };


    $.mymenu.prototype.show_menu = function() {
        var ret = this.animation_item({
            mode: "open",
            $origin_obj: this.$el.children().last(),
        });

        if(ret) {
            this.els.$trigger.addClass($.mymenu.getclass(this.els.triggeractive));
        }
    };


    $.mymenu.prototype.hide_menu = function() {
        var ret = this.animation_item({
            mode: "close",
            $origin_obj: this.$el.children().last(),
        });

        if(ret) {
            this.els.$trigger.removeClass($.mymenu.getclass(this.els.triggeractive));
        }
    };


    // origin_tid(tag id): this.els.itemtagを受け付ける
    $.mymenu.prototype.open_submenu = function(origin_tid) {
        if(!origin_tid) {
            _myerr("mymenu: open_submenu origin_tid null.");
            return;
        }

        this.animation_item({
            mode: "down",
            $origin_obj: $(origin_tid),
        });
    };


    // origin_tid: .mymenu_back付きli
    $.mymenu.prototype.close_submenu = function(origin_tid) {
        if(!origin_tid) {
            _myerr("mymenu: close_submenu origin_tid null.");
            return;
        }

        this.animation_item({
            mode: "up",
            $origin_obj: $(origin_tid),
        });
    };


    // $origin_obj: イベントが起きたliのdom
    // mode: アニメーションの種類
    //  - open: 単独アイテム用
    //  - close: 単独アイテム用
    //  - down: liアイテム用 root, childを指定すれば使用可能
    //   - $root_container_obj, $child_container_obj
    //  - up: liアイテム用 root, parent, childを指定すれば使用可能
    //   - $root_container_obj, $parent_container_obj, $parent_list_obj, $owner_container_obj, $child_container_obj
    // position(option):
    //  - top:
    //  - left:
    // on_animation_end(option):
    //
    // * 処理の順番大事なので注意
    $.mymenu.prototype.animation_item = function(option) {
        var self = this;

        var mode = option.mode || "open";
        var popuppos = null;
        var $new_container = null;

        if(typeof option.popuppos !== "undefined") {
            popuppos = option.position;
        }
        else {
            popuppos = self.els.$mainmenu.position();
        }

        setTimeout(function() {
            var on_animation_end_ = null;

            switch(mode) {
                case "open":
                    option.$origin_obj
                        .css("opacity", 0)
                        .css("display", "block")
                        .addClass($.mymenu.getclass(self.options.animation_class.trigger.in))

                    on_animation_end_ = function() {
                        self.$el.off(self.animation_end_event_name);

                        option.$origin_obj
                            .removeClass($.mymenu.getclass(self.options.animation_class.trigger.in))
                            .css("opacity", 1)
                            .css("display", "block");

                        _mylog("mymenu: open animation end.");
                    };

                    break;

                case "close":
                    option.$origin_obj
                        .addClass($.mymenu.getclass(self.options.animation_class.trigger.out))

                    on_animation_end_ = function() {
                        self.$el.off(self.animation_end_event_name);

                        option.$origin_obj
                            .removeClass($.mymenu.getclass(self.options.animation_class.trigger.out))
                            .css("opacity", 0)
                            .css("display", "none");

                        _mylog("mymenu: close animation end.");
                    };

                    break;

                case "down":
                    // 手順
                    // 1. mainmenuからsubmenuopenクラスのついたliを探す
                    // 2. なければそのままmainmenu直下のsubmenuをコピーして$el下に配置する
                    // 3-1. ある場合$el下にあるsubmenuを一旦submenuopenの下にcloneで戻す
                    // 3-2. origin_objから上のdomをみれるようになっているはずなのでsubmenuopenタグを新しく付け替える
                    // 3-3. 新しい子をflyin

                    var $prev_container = self.$el.children().first();
                    var $current_container = self.$el.children().last();
                    var $origin_obj = option.$origin_obj;
                    var $child_container_obj = null;
                    var $submenu_opened_listitem = self.els.$mainmenu.find(self.els.submenuopen);

                    $child_container_obj = $origin_obj.children(self.els.submenu).first();
                    if($child_container_obj.size() === 0) {
                        _mylog("mymenu: not found child container.");
                        return false;
                    }

                    if(self.$el.children().size() !== 2) {
                        _mylog("mymenu: root container size mismatch.");
                        return false;
                    }

                    // $origin_objを元の場所を指すように調整する
                    if($submenu_opened_listitem.size() !== 0) {
                        // 表示している$current_containerが消えないように入れ替える
                        var $cc_clone = $current_container.clone().insertAfter($current_container);

                        // 元の場所に戻す
                        $current_container
                            .removeClass($.mymenu.getclass(self.els.flyin))
                            .css("display", "")
                            .css("position", "")
                            .css("top", "")
                            .css("left", "")
                            .appendTo($submenu_opened_listitem);

                        $submenu_opened_listitem.removeClass($.mymenu.getclass(self.els.submenuopen));

                        // 入れ替える
                        $current_container = $cc_clone;
                    }

                    $origin_obj
                        .addClass($.mymenu.getclass(self.els.submenuopen));

                    $new_container = $child_container_obj
                        .addClass($.mymenu.getclass(self.els.flyin))
                        .css("display", "block")
                        .css("position", "absolute")
                        .css("top", popuppos.top)
                        .css("left", popuppos.left)
                        .css("z-index", -1)
                        .insertAfter($current_container);

                    $current_container.addClass($.mymenu.getclass(self.options.animation_class.levelchange.out));
                    $new_container.addClass($.mymenu.getclass(self.options.animation_class.levelchange.in));

                    if($submenu_opened_listitem.size() === 0) {
                        // mainmenuと入れ替える
                        $prev_container
                            .css("display", "block")
                            .css("position", "absolute")
                            .css("top", "0")
                            .css("left", "0")
                            .addClass($.mymenu.getclass(self.els.submenu))
                            .insertAfter(self.els.$mainmenu);

                        $current_container = $prev_container;
                    }

                    on_animation_end_ = function() {
                        self.$el.off(self.animation_end_event_name);

                        self.els.$mainmenu
                            .css("display", "none")
                            .css("position", "")
                            .css("top", "")
                            .css("left", "");

                        $new_container
                            .removeClass($.mymenu.getclass(self.options.animation_class.levelchange.in))
                            .css("z-index", "");

                        self.els.$mainmenu.removeClass($.mymenu.getclass(self.options.animation_class.levelchange.out));
                        $current_container.remove();

                        _mylog("mymenu: down animation end.");
                    };

                    break;

                case "up":
                    var $prev_container = self.$el.children().first();
                    var $current_container = self.$el.children().last();
                    var $submenu_opened_listitem = self.els.$mainmenu.find(self.els.submenuopen);

                    if(self.$el.children().size() !== 2) {
                        _mylog("mymenu: root container size mismatch.");
                        return false;
                    }

                    if($submenu_opened_listitem.size() === 0) {
                        _mylog("mymenu: not found parent container.");
                        return false;
                    }

                    var $cc_clone = $current_container
                        .clone()
                        .css("display", "block")
                        .css("position", "absolute")
                        .css("top", popuppos.top)
                        .css("left", popuppos.left)
                        .addClass("mymenu_debug_ccclone")
                        .insertAfter($current_container);

                    $current_container
                        .removeClass($.mymenu.getclass(self.els.flyin))
                        .css("display", "")
                        .css("position", "")
                        .css("top", "")
                        .css("left", "")
                        .appendTo($submenu_opened_listitem);

                    var $origin_obj = option.$origin_obj;
                    var $parent_listitem = $origin_obj.parent(self.els.wrappertag).parent(self.els.itemtag);
                    var $parent_container = $parent_listitem.parent(self.els.wrappertag);
                    var $gparent_listitem = $parent_container.parent(self.els.itemtag);

                    var $new_container = $parent_container
                        .addClass($.mymenu.getclass(self.els.flyin))
                        .css("display", "block")
                        .css("position", "absolute")
                        .css("top", popuppos.top)
                        .css("left", popuppos.left)
                        .css("z-index", "-1")
                        .addClass("mymenu_debug_newcontainer")
                        .insertAfter($cc_clone);

                    $submenu_opened_listitem.removeClass($.mymenu.getclass(self.els.submenuopen));
                    $gparent_listitem.addClass($.mymenu.getclass(self.els.submenuopen));

                    $cc_clone.addClass($.mymenu.getclass(self.options.animation_class.levelchange.out));
                    $new_container.addClass($.mymenu.getclass(self.options.animation_class.levelchange.in));

                    on_animation_end_ = function() {
                        if($new_container.get(0) === self.els.$mainmenu.get(0)) {
                            $new_container
                                .css("display", "block")
                                .before(self.els.$dummyelement.clone());
                        }

                        self.$el.off(self.animation_end_event_name);

                        $new_container
                            .removeClass($.mymenu.getclass(self.options.animation_class.levelchange.in))
                            .css("z-index", "1000");

                        $cc_clone.remove();

                        _mylog("mymenu: up animation end.");
                    };
            }

            switch(mode) {
                case "open":
                case "close":
                    if(on_animation_end_) {
                        if(self.support_animations) {
                            self.$el.on(self.animation_end_event_name, on_animation_end_);
                        }
                        else {
                            on_animation_end_();
                        }
                    }

                    break;

                case "down":
                case "up":
                    if(on_animation_end_) {
                        if(self.support_animations) {
                            self.$el.on(self.animation_end_event_name, on_animation_end_);
                        }
                        else {
                            on_animation_end_();
                        }
                    }

                    break;

                default:
                    if(option.on_animation_end) {
                        on_animation_end();
                    }

                    break;
            }
        });

        return true;
    };


    $.mymenu.save_styles = {};


    $.mymenu.getclass = function(selector) {
        var dot_index = selector.lastIndexOf(".");
        if(dot_index != -1) {
            return selector.substr(dot_index + 1);
        }

        _mylog("not found class selector.");

        return selector;
    };


    // get element id
    $.mymenu.geteid = function(element, property) {
        var tag_name = element.tagName;
        var id_name = element.id;
        var class_name = element.className;

        return tag_name + "-" + id_name + "-" + class_name + "-" + property;
    };


    $.mymenu.validate_equal = function($element, target) {
        if($element.length !== target) {
            throw new Error("mymenu: " + $element.selector + " validation failed.");
        }
    };


    $.fn.savecss = function(property) {
        $.each(this, function() {
            var element_id = $.mymenu.geteid(this, property);
            $.mymenu.save_styles[element_id] = $(this).css(property);
        });

        return this;
    };


    $.fn.loadcss = function(property) {
        $.each(this, function() {
            var element_id = $.mymenu.geteid(this, property);
            var save_style = $.mymenu.save_styles[element_id] || null;

            if(save_style) {
                $(this).css(property, save_style);
            }
            else {
                _myerr("not found previous style.");
            }
        });

        return this;
    };


    $.fn.isnotcss = function(property, value) {
        var self = this;
        var ret = [];

        $.each(this, function() {
            var v = $(this).css(property);
            if(value !== v) {
                ret.push(this)
            }
        });

        if(ret) {
            return $(ret);
        }
        else {
            this.splice(0, this.size());
            return this;
        }
    };


    $.fn.mymenu = function(options) {
        this.each(function() {
            var instance = $.data(this, "mymenu");
            if(instance) {
                instance.initialize();
            }
            else {
                instance = $.data(this, "mymenu", new $.mymenu(options, this));
            }
        });
    };

})(jQuery, window, window.Modernizr);

