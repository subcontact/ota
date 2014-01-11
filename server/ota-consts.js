

var otaconsts = function() {
  var self = this;
  const BUILD_DIR = "builds";
  const BUILD_LIST_PATTERN = /^\d{14}$/i;
  const iOS_FILE  = /\.ipa$/i;
  const AND_FILE  = /\.apk$/i;
  const WIN_FILE  = /\.exe$/i;
  const TYPE_IOS  = 0;
  const TYPE_AND  = 1;
  const TYPE_WIN  = 2;

  const TYPE_IPHONE         = 3;
  const TYPE_IPAD           = 4;
  const TYPE_ANDROID_PHONE  = 5;
  const TYPE_ANDROID_TABLET = 6;
  const TYPE_WINDOWS_PHONE  = 7;
  const TYPE_WINDOWS_TABLET = 8;

  const TYPE_LABELS = [
    "iOS",
    "Android",
    "Windows",

    "iPhone",
    "iPad",
    "Android Phone",
    "Android Tablet",
    "Windows Phone",
    "Windows Tablet"
  ];

  // must be a better way to export these!
  this.BUILD_DIR            = BUILD_DIR;
  this.BUILD_LIST_PATTERN   = BUILD_LIST_PATTERN;
  this.iOS_FILE             = iOS_FILE;
  this.AND_FILE             = AND_FILE;
  this.WIN_FILE             = WIN_FILE;
  this.TYPE_IOS             = TYPE_IOS;
  this.TYPE_AND             = TYPE_AND;
  this.TYPE_WIN             = TYPE_WIN;
  this.TYPE_IPHONE          = TYPE_IPHONE;
  this.TYPE_ANDROID_PHONE   = TYPE_ANDROID_PHONE;
  this.TYPE_ANDROID_TABLET  = TYPE_ANDROID_TABLET;
  this.TYPE_WINDOWS_PHONE   = TYPE_WINDOWS_PHONE;
  this.TYPE_WINDOWS_TABLET  = TYPE_WINDOWS_TABLET;
  this.TYPE_LABELS          = TYPE_LABELS;
}

module.exports = new otaconsts();