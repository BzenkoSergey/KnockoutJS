var myApp = myApp || function() {};

myApp.newPage = function() {
    var _super = this;

    this.postCollection = new this.PostCollection(_super);
    var posts = [];
    if(window.localStorage) {
        var postJSON = window.localStorage["posts"];
        if(!postJSON) {
            window.localStorage["posts"] = JSON.stringify([]);
        } else {
            posts = JSON.parse(postJSON);
        }
    }
    for(var key in posts) {
        var post = posts[key];
        if(!post) continue;
        this.postCollection.addPost(new this.Post(post[0], post[1], post[2]));
    }

    this.postEditor = new this.PostEditor(_super);
    this.searchPanel = new this.SearchPanel(_super);

    var init = function() {
        ko.applyBindings(_super.postEditor, $(".form")[0]);
        ko.applyBindings(_super.searchPanel, $(".search")[0]);
        ko.applyBindings(_super.postCollection, $(".post-wrap")[0]);
        ko.applyBindings(_super.postCollection, $(".post-noresult")[0]);
    };

    init();
};

myApp.newPage.prototype.SearchPanel = function(_super) {
    if(!_super) return false;

    var self = this;
    this.isHide = ko.observable(true);
    this.query = ko.observable();

    this.changeVisible = function() {
        var isHide = self.isHide();
        self.isHide(!isHide);
    };

    var filter = function(query) {
        var posts = _super.postCollection.posts();
        if(!posts.length) return false;

        var query = query.toLowerCase();

        for(var key in posts) {
            var post = posts[key];
            var title = post.title().toLowerCase();
            var message = post.message().toLowerCase();

            var test = (title.indexOf(query) >= 0 || message.indexOf(query) >= 0);
            if(query === "" || test) {
                post.visible(true);
            } else {
                post.visible(false);
            }
        }
    };
    this.query.subscribe(filter);
};

myApp.newPage.prototype.PostEditor = function(_super) {
    if(!_super) return false;

    var self = this;

    this.currentPost = ko.observable(null);
    this.title = ko.observable();
    this.message = ko.observable();

    this.submit = function() {
        if(!validation()) return false;
        if(self.currentPost()) {
            editPost();
            return false;
        }
        addPost();
        return false;
    };

    this.resetValues = function() {
        self.title("");
        self.message("");
    };

    var presentNewData = function() {
            var post = self.currentPost();
            if(!post) return false;
    
            self.title(post.title());
            self.message(post.message());
        },

        validation = function() {
            var title = $.trim(self.title());
            var message = $.trim(self.message());
            if(!title || !message) return false;
            self.title(title);
            self.message(message);
            return true;
        },

        editPost = function() {
            var post = self.currentPost();
            if(!post) return false;
            post.title(self.title());
            post.message(self.message());
            self.currentPost(false);
            self.resetValues();
        },

        addPost = function() {
            var newPostId = _super.postCollection.posts().length;
            var post = new _super.Post(newPostId, self.title(), self.message());
            _super.postCollection.addPost(post);
            self.resetValues();
        };

    this.currentPost.subscribe(presentNewData);
};

myApp.newPage.prototype.Post = function(id, title, message) {
    if(!id && typeof id === undefined) return false;
    if(!title && !message) return false;

    var self = this;

    this.id = id;
    this.title = ko.observable(title);
    this.message = ko.observable(message);
    this.visible = ko.observable(true);
    this.summaryData = ko.observable(null);

    this.summaryData.subscribe(function() {
        if(window.localStorage) {
            var postJSON = window.localStorage["posts"];
            var posts = (postJSON)? $.parseJSON(postJSON) : posts;
            if(!posts) return false;
            if(self.summaryData()) {
                posts[id] = self.summaryData();
            } else {
                delete posts[id];
            }
            posts = JSON.stringify(posts);
            window.localStorage["posts"] = posts;
        }
    });

    var setSummaryData = function() {
        self.summaryData([self.id, self.title(), self.message()]);
    };
    this.title.subscribe(setSummaryData);
    this.message.subscribe(setSummaryData);
    setSummaryData();
};

myApp.newPage.prototype.PostCollection = function(_super) {
    if(!_super) return false;

    var self = this;
    this.posts = new ko.observableArray([]);

    this.deletePost = function(post) {
        if(!post) return false;
        var currentEditedPost = _super.postEditor.currentPost();
        if(currentEditedPost && post.id === currentEditedPost.id) {
            _super.postEditor.resetValues();
        }
        post.summaryData(null);
        self.posts.remove(post);
    };

    this.addPost = function(post) {
        if(!post) return false;
        self.posts.push(post);
        reSort();
    };

    this.editPost = function(post) {
        if(!post) return false;
        _super.postEditor.currentPost(post);
    };

    this.visiblePosts = function() {
        var orgPosts = self.posts();

        var posts = [];
        for(var key in orgPosts) {
            var post = orgPosts[key];
            if(post.visible()) {
                posts.push(post);
            }
        }
        return posts;
    };

    var reSort = function() {
        self.posts.sort(function(left, right) {
            return (left.id > right.id)? -1 : 1;
        });
    };
    reSort();
};

$(function() {
    (new myApp.newPage());
})