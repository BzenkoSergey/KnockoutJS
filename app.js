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
        this.postCollection.addPost(new this.Post(post[0], post[1], post[2], _super));
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

myApp.newPage.prototype.Post = function(id, title, message, _super) {
    if(!_super) return false;
    if(typeof id === undefined) return false;
    if(!title && !message) return false;

    var self = this;

    this.id = id;
    this.title = ko.observable(title);
    this.message = ko.observable(message);
    this.summaryData = ko.observable(null);

    this.visible = ko.observable(true);
    this.removeFromStorage = ko.observable(false);

    this.isEditNow = function() {
        var editPost = _super.postEditor.editedPost();
        if(!editPost) return false;
        if(editPost.id === self.id) return true;
        return false;
    };

    this.editPost = function() {
        _super.postEditor.editedPost(self);
    };

    var removeFromStorage = function() {
            if(!window.localStorage) return false;

            var posts = getStorageData();
            if(!posts) return false;
            //delete posts[id];
            posts.splice(id, 1);

            window.localStorage["posts"] = JSON.stringify(posts);
        },

        saveToStorage = function() {
            if(!window.localStorage) return false;

            var posts = getStorageData();
            if(!posts) return false;

            var summaryData = self.summaryData();
            if(!summaryData) return false;
            posts[id] = self.summaryData();
            window.localStorage["posts"] = JSON.stringify(posts);
        },

        getStorageData = function() {
            if(!window.localStorage) return false;

            var storageData = window.localStorage["posts"];
            if(!storageData) {
                storageData = (window.localStorage["posts"] = JSON.stringify([]));
            }
            var posts = $.parseJSON(storageData);
            return (posts)? posts: null;
        },

        setSummaryData = function() {
            self.summaryData([self.id, self.title(), self.message()]);
        };

        init = function() {
            self.title.subscribe(setSummaryData);
            self.message.subscribe(setSummaryData);

            self.summaryData.subscribe(saveToStorage);
            setSummaryData();

            self.removeFromStorage.subscribe(function(isRemove) {
                if(!isRemove) return false;
                removeFromStorage();
            });
        };

    init();
};

myApp.newPage.prototype.PostCollection = function(_super) {
    if(!_super) return false;
    var self = this;

    this.posts = new ko.observableArray([]);
    this.postsCount = ko.observable(0);
    this.postsVisbleCount = ko.observable(0);

    this.deletePost = function(post) {
        if(!post) return false;

        if(post.isEditNow()) {
            _super.postEditor.resetFields();
        }
        post.removeFromStorage(true);
        self.posts.remove(post);

        self.postsCount(self.postsCount() - 1);
    };

    this.addPost = function(post) {
        if(!post) return false;
        self.posts.push(post);
        self.postsCount(self.postsCount() + 1);
        reSort();
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
        self.postsVisbleCount(posts.length);
        return posts;
    };

    var reSort = function(posts) {
        self.posts.sort(function(left, right) {
            return (left.id > right.id)? -1 : 1;
        });
    };

    reSort();
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

    this.editedPost = ko.observable(null);
    this.title = ko.observable();
    this.message = ko.observable();

    this.submit = function() {
        normalizeValues();
        if(!validation()) return false;

        self.editedPost()? editPost() : addPost();
    };

    this.resetFields = function() {
        self.title("");
        self.message("");
        self.editedPost(null);
    };

    var presentNewData = function() {
            var post = self.editedPost();
            if(!post) return false;
    
            self.title(post.title());
            self.message(post.message());
        },

        normalizeValues = function() {
            self.title($.trim(self.title()));
            self.message($.trim(self.message()));
        },

        validation = function() {
            if(!self.title() || !self.message()) return false;
            return true;
        },

        editPost = function() {
            var post = self.editedPost();
            if(!post) return false;
            post.title(self.title());
            post.message(self.message());
            self.editedPost(false);
            self.resetFields();
        },

        addPost = function() {
            var id = _super.postCollection.posts().length;
            console.log(id);
            var post = new _super.Post(id, self.title(), self.message(), _super);
            _super.postCollection.addPost(post);
            self.resetFields();
        };

    this.editedPost.subscribe(presentNewData);
};

$(function() {
    (new myApp.newPage());
})
