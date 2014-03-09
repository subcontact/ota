package com.example.android.contactmanager;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.apache.cordova.Config;
import org.apache.cordova.CordovaChromeClient;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.LOG;
import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import org.apache.cordova.CordovaWebView;
import org.apache.cordova.CordovaWebViewClient;

/**
* This class is the main Android activity that represents the Cordova
* application.  It should be extended by the user to load the specific
* html file that contains the application.
*
* As an example:
* 
* <pre>
*     package org.apache.cordova.examples;
*
*     import android.os.Bundle;
*     import org.apache.cordova.*;
*
*     public class Example extends CordovaActivity {
*       &#64;Override
*       public void onCreate(Bundle savedInstanceState) {
*         super.onCreate(savedInstanceState);
*         super.init();
*         // Load your application
*         super.loadUrl(Config.getStartUrl());
*       }
*     }
* </pre>
* 
* Cordova xml configuration: Cordova uses a configuration file at 
* res/xml/config.xml to specify its settings. See "The config.xml File"
* guide in cordova-docs at http://cordova.apache.org/docs for the documentation
* for the configuration. The use of the set*Property() methods is
* deprecated in favor of the config.xml file.
*
*/
public class CustomCordovaWebViewActivity extends Activity implements CordovaInterface {
 public static String TAG = "CustomCordovaWebViewActivity";

 // The webview for our app
 protected CordovaWebView appView;
 protected CordovaWebViewClient webViewClient;
 private final ExecutorService threadPool = Executors.newCachedThreadPool();
 
 // Plugin to call when activity result is received
 protected CordovaPlugin activityResultCallback = null;
 protected boolean activityResultKeepRunning;

 // LoadUrl timeout value in msec (default of 20 sec)
 protected int loadUrlTimeoutValue = 20000;

 // Keep app running when pause is received. (default = true)
 // If true, then the JavaScript and native code continue to run in the background
 // when another application (activity) is started.
 protected boolean keepRunning = true;

 
 /**
  * Called when the activity is first created.
  *
  * @param savedInstanceState
  */
// @SuppressWarnings("deprecation")
 @Override
 public void onCreate(Bundle savedInstanceState) {
     //Config.init(this);
     LOG.d(TAG, "CordovaActivity.onCreate()");
     super.onCreate(savedInstanceState);
     setContentView(R.layout.cordova_webview_activity);
     appView = (CordovaWebView) findViewById(R.id.cordovaWebView);
     Config.init(this);
     appView.loadUrl(Config.getStartUrl());

 }
 
 /**
  * Get the Android activity.
  *
  * @return the Activity
  */
 public Activity getActivity() {
     return this;
 }

 /**
  * Construct the default web view object.
  *
  * This is intended to be overridable by subclasses of CordovaIntent which
  * require a more specialized web view.
  */
 protected CordovaWebView makeWebView() {
     return new CordovaWebView(CustomCordovaWebViewActivity.this);
 }

 /**
  * Construct the client for the default web view object.
  *
  * This is intended to be overridable by subclasses of CordovaIntent which
  * require a more specialized web view.
  *
  * @param webView the default constructed web view object
  */
 protected CordovaWebViewClient makeWebViewClient(CordovaWebView webView) {
     //if(android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.HONEYCOMB) {
         return new CordovaWebViewClient(this, webView);
     //} else {
     //    return new IceCreamCordovaWebViewClient(this, webView);
    // }
 }

 /**
  * Construct the chrome client for the default web view object.
  *
  * This is intended to be overridable by subclasses of CordovaIntent which
  * require a more specialized web view.
  *
  * @param webView the default constructed web view object
  */
 protected CordovaChromeClient makeChromeClient(CordovaWebView webView) {
     return new CordovaChromeClient(this, webView);
 }

 /**
  * Create and initialize web container with default web view objects.
  */
 public void init() {
     CordovaWebView webView = makeWebView();
     this.init(webView, makeWebViewClient(webView), makeChromeClient(webView));
 }

 /**
  * Initialize web container with web view objects.
  *
  * @param webView
  * @param webViewClient
  * @param webChromeClient
  */
  // @SuppressLint("NewApi")
 public void init(CordovaWebView webView, CordovaWebViewClient webViewClient, CordovaChromeClient webChromeClient) {
     LOG.d(TAG, "CordovaActivity.init()");

     // Set up web container
     this.appView = webView;
     this.appView.setId(100);

     this.appView.setWebViewClient(webViewClient);
     this.appView.setWebChromeClient(webChromeClient);
     webViewClient.setWebView(this.appView);
     webChromeClient.setWebView(this.appView);

     // Add web view but make it invisible while loading URL
     this.appView.setVisibility(View.INVISIBLE);
 }

 /**
  * Load the url into the webview.
  *
  * @param url
  */
 public void loadUrl(String url) {

     // Init web view if not already done
     if (this.appView == null) {
         this.init();
     }
     
     this.appView.loadUrl(url);
 }

 /**
  * Send a message to all plugins.
  *
  * @param id            The message id
  * @param data          The message data
  */
 public void postMessage(String id, Object data) {
     if (this.appView != null) {
         this.appView.postMessage(id, data);
     }
 }



 /**
  * Launch an activity for which you would like a result when it finished. When this activity exits,
  * your onActivityResult() method will be called.
  *
  * @param command           The command object
  * @param intent            The intent to start
  * @param requestCode       The request code that is passed to callback to identify the activity
  */
 public void startActivityForResult(CordovaPlugin command, Intent intent, int requestCode) {
     this.activityResultCallback = command;
     this.activityResultKeepRunning = this.keepRunning;

     // If multitasking turned on, then disable it for activities that return results
     if (command != null) {
         this.keepRunning = false;
     }

     // Start activity
     super.startActivityForResult(intent, requestCode);
 }

 @Override
 /**
  * Called when an activity you launched exits, giving you the requestCode you started it with,
  * the resultCode it returned, and any additional data from it.
  *
  * @param requestCode       The request code originally supplied to startActivityForResult(),
  *                          allowing you to identify who this result came from.
  * @param resultCode        The integer result code returned by the child activity through its setResult().
  * @param data              An Intent, which can return result data to the caller (various data can be attached to Intent "extras").
  */
 protected void onActivityResult(int requestCode, int resultCode, Intent intent) {
    super.onActivityResult(requestCode, resultCode, intent);
    CordovaPlugin callback = this.activityResultCallback;
    if (callback != null) {
        callback.onActivityResult(requestCode, resultCode, intent);
    }
 }

 public void setActivityResultCallback(CordovaPlugin plugin) {
     this.activityResultCallback = plugin;
 }

 /**
  * Called when a message is sent to plugin.
  *
  * @param id            The message id
  * @param data          The message data
  * @return              Object or null
  */
 public Object onMessage(String id, Object data) {
	 LOG.d(TAG, "onMessage(" + id + "," + data + ")");
     if (!"onScrollChanged".equals(id)) {
         LOG.d(TAG, "onMessage(" + id + "," + data + ")");
     }
     return null;
 }

 public ExecutorService getThreadPool() {
     return threadPool;
 }
 
 protected void onSaveInstanceState(Bundle outState)
 {
     super.onSaveInstanceState(outState);
     if(this.activityResultCallback != null)
     {
         String cClass = this.activityResultCallback.getClass().getName();
         outState.putString("callbackClass", cClass);
     }
 }
}