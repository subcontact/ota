"use strict";
var otaconsts = function() {

  this.ATTACH_TST = /attachment;/i;
  this.BUILD_DIR = "builds";
  this.BUILD_LIST_PATTERN = /^\d{14}$/i;
  this.iOS_FILE  = /\.ipa$/i;
  this.AND_FILE  = /\.apk$/i;
  this.WIN_FILE  = /\.exe$/i;    
  this.WIN_FILE_EXE  = /\.exe$/i;  
  this.WIN_FILE_XAP  = /\.xap$/i;
  this.TYPE_IOS  = 0;
  this.TYPE_AND  = 1;
  this.TYPE_WIN  = 2;

  this.TYPE_IPHONE         = 3;
  this.TYPE_IPAD           = 4;
  this.TYPE_ANDROID_PHONE  = 5;
  this.TYPE_ANDROID_TABLET = 6;
  this.TYPE_WINDOWS_PHONE  = 7;
  this.TYPE_WINDOWS_TABLET = 8;
  this.TYPE_UNKNOWN        = 9;

  this.TYPE_LABELS = [
    "iOS",
    "Android",
    "Windows",
    "iPhone",
    "iPad",
    "Android Phone",
    "Android Tablet",
    "Windows Phone",
    "Windows Tablet",
    "Unkown"
  ];

  this.IOS_NAME    = 'CFBundleDisplayName';
  this.IOS_VERSION = 'CFBundleVersion';
  this.IOS_ID      = 'CFBundleIdentifier';
  this.IOS_TEAM    = 'TeamName';
  this.IOS_ICON    = 'CFBundleIconFile';
  this.HOST_SVR    = null;
  this.M_CACHE     = null;

  this.CK_GET_PROJECTS = 0;
  this.CK_GET_PROJECT_BUILDS = 1;
  this.CK_GET_BUILD_DATA = 2;
  
  this.PARSE_BUILD_DIR = [
    {
      pattern : /^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/,
      format  : "YYYY-MM-DD_HH::mm:ss"
    },
    {
      pattern : /^\d{14}$/,
      format  : "YYYYMMDDHHmmss"
    }
  ];
}
module.exports = new otaconsts();